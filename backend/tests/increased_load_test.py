"""
Tests the Behavior Under Increased Load performance indicator.

Records load-test requests and compares the test Queue's database records
before and after the test.
"""

import itertools
from contextlib import closing

import psycopg2
import requests
from locust import HttpUser, constant_pacing, events, task
from locust.exception import StopUser

from backend.REST_API.dbconfig import PG_DB_CONFIG


TEST_BACKEND = "http://127.0.0.1:8001"
QUEUE_CODE = "AAF-154-99"
TICKET_NUMBER = 1071
PHONE_PREFIX = "555-013-"

user_numbers = itertools.count()
phone_numbers = itertools.count(1)

test_ready = False
baseline = None
registration_attempts = {}


def get_connection():
    return psycopg2.connect(**PG_DB_CONFIG, connect_timeout=5)


def customer_snapshot(cursor, highest_id=None):
    """Return a count, highest ID, and hash for test-Queue Customers."""
    cursor.execute(
        """
        SELECT
            COUNT(*),
            COALESCE(MAX(customer.customer_id), 0),
            MD5(
                COALESCE(
                    STRING_AGG(
                        ROW_TO_JSON(customer)::text,
                        ',' ORDER BY customer.customer_id
                    ),
                    ''
                )
            )
        FROM customer
        JOIN queue ON customer.queue_id = queue.queue_id
        WHERE queue.queue_code = %s
          AND (%s IS NULL OR customer.customer_id <= %s)
        """,
        (QUEUE_CODE, highest_id, highest_id),
    )
    return cursor.fetchone()


def queue_hash(cursor):
    """Return a hash of the test Queue's database row."""
    cursor.execute(
        """
        SELECT MD5(ROW_TO_JSON(queue)::text)
        FROM queue
        WHERE queue_code = %s
        """,
        (QUEUE_CODE,),
    )
    row = cursor.fetchone()
    return row[0] if row else None


def duplicate_ticket_count(cursor):
    """Count ticket numbers that appear more than once in the test Queue."""
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM (
            SELECT customer.ticket_id
            FROM customer
            JOIN queue ON customer.queue_id = queue.queue_id
            WHERE queue.queue_code = %s
            GROUP BY customer.ticket_id
            HAVING COUNT(*) > 1
        ) AS duplicates
        """,
        (QUEUE_CODE,),
    )
    return cursor.fetchone()[0]


@events.test_start.add_listener
def prepare_test(environment, **kwargs):
    """Record the baseline and verify the fictional number range."""
    global test_ready, baseline, user_numbers, phone_numbers

    test_ready = False
    baseline = None
    registration_attempts.clear()
    user_numbers = itertools.count()
    phone_numbers = itertools.count(1)

    try:
        with closing(get_connection()) as connection:
            connection.set_session(
                readonly=True,
                isolation_level="REPEATABLE READ",
            )

            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT queue_id
                    FROM queue
                    WHERE queue_code = %s AND active = TRUE
                    """,
                    (QUEUE_CODE,),
                )

                if cursor.fetchone() is None:
                    print("TEST NOT STARTED: Active test Queue not found.")
                    return

                cursor.execute(
                    """
                    SELECT COUNT(*)
                    FROM customer
                    JOIN queue ON customer.queue_id = queue.queue_id
                    WHERE queue.queue_code = %s
                      AND customer.phone_number LIKE %s
                    """,
                    (QUEUE_CODE, PHONE_PREFIX + "%"),
                )

                if cursor.fetchone()[0] != 0:
                    print(
                        "TEST NOT STARTED: The fictional phone-number "
                        "range is already in use."
                    )
                    return

                baseline = {
                    "customers": customer_snapshot(cursor),
                    "queue": queue_hash(cursor),
                    "duplicate_tickets": duplicate_ticket_count(cursor),
                }

        test_ready = True
        print(
            "Baseline recorded: "
            f"{baseline['customers'][0]} existing Customer records."
        )

    except psycopg2.Error:
        print("TEST NOT STARTED: Could not check the database.")


@events.test_stop.add_listener
def verify_test_data(environment, **kwargs):
    """Compare the baseline and reconcile the registration attempts."""
    if not test_ready or baseline is None:
        return

    try:
        with closing(get_connection()) as connection:
            connection.set_session(
                readonly=True,
                isolation_level="REPEATABLE READ",
            )

            with connection.cursor() as cursor:
                highest_id = baseline["customers"][1]
                customers_after = customer_snapshot(cursor, highest_id)
                queue_after = queue_hash(cursor)
                duplicates_after = duplicate_ticket_count(cursor)

                cursor.execute(
                    """
                    SELECT customer.customer_id, customer.ticket_id,
                           customer.phone_number, customer.status
                    FROM customer
                    JOIN queue ON customer.queue_id = queue.queue_id
                    WHERE queue.queue_code = %s
                      AND customer.phone_number LIKE %s
                    """,
                    (QUEUE_CODE, PHONE_PREFIX + "%"),
                )
                new_records = cursor.fetchall()

        print("\n--- Test data verification ---")

        if customers_after == baseline["customers"]:
            print("Existing Customer records match the baseline.")
        else:
            print("Existing Customer records DO NOT match the baseline.")

        if queue_after == baseline["queue"]:
            print("The test Queue record matches the baseline.")
        else:
            print("The test Queue record changed during the test.")

        print(
            "Duplicate ticket numbers before/after: "
            f"{baseline['duplicate_tickets']}/{duplicates_after}"
        )

        stored = {row[2]: row for row in new_records}

        successful = [
            (phone, result)
            for phone, result in registration_attempts.items()
            if result["valid_success"]
        ]

        matched = sum(
            stored.get(phone) == (
                result["customer_id"],
                result["ticket_id"],
                phone,
                "waiting",
            )
            for phone, result in successful
        )

        saved_without_success = sum(
            phone in stored and not result["valid_success"]
            for phone, result in registration_attempts.items()
        )

        unexpected_records = sum(
            phone not in registration_attempts
            for phone in stored
        )

        print(f"Registration attempts recorded: {len(registration_attempts)}")
        print(f"New fictional Customer records: {len(new_records)}")
        print(
            "Successful responses matching database records: "
            f"{matched}/{len(successful)}"
        )
        print(
            "Records saved without a verified successful response: "
            f"{saved_without_success}"
        )
        print(f"Records without a recorded attempt: {unexpected_records}")

        if len(stored) != len(new_records):
            print("WARNING: Duplicate fictional phone numbers were found.")

    except psycopg2.Error:
        print("Data verification could not be completed; check the database.")


class IncreasedLoadUser(HttpUser):
    host = TEST_BACKEND

    # Each user attempts one request every three seconds.
    wait_time = constant_pacing(3)

    def on_start(self):
        if not test_ready or self.host.rstrip("/") != TEST_BACKEND:
            print("User stopped: test setup or backend is not valid.")
            raise StopUser()

        try:
            response = requests.get(
                f"{TEST_BACKEND}/load-test/sms-status",
                timeout=5,
            )
            response.raise_for_status()

            if response.json() != {"sms_disabled": True}:
                raise ValueError("SMS is not confirmed as disabled.")

        except (requests.RequestException, ValueError):
            print("User stopped: SMS-disabled backend was not confirmed.")
            raise StopUser()

        self.step = next(user_numbers) % 3

    @task
    def customer_request(self):
        self.step = (self.step + 1) % 3

        if self.step == 0:
            self.client.get(
                f"/database/queue/get_active_withcode/{QUEUE_CODE}",
                name="Queue lookup",
                timeout=20,
            )

        elif self.step == 1:
            self.client.get(
                "/database/customer/get_ticket",
                params={
                    "queue_code": QUEUE_CODE,
                    "ticket_number": TICKET_NUMBER,
                },
                name="Ticket status",
                timeout=20,
            )

        else:
            number = next(phone_numbers)

            if number > 9999:
                print("User stopped: fictional number range exhausted.")
                raise StopUser()

            phone_number = f"{PHONE_PREFIX}{number:04d}"

            # Record the attempt before sending it, including requests that
            # later fail or do not receive a response.
            result = {
                "http_status": None,
                "valid_success": False,
                "customer_id": None,
                "ticket_id": None,
            }
            registration_attempts[phone_number] = result

            with self.client.post(
                "/database/customer/add_customer",
                json={
                    "queue_code": QUEUE_CODE,
                    "phone_number": phone_number,
                },
                name="Join queue",
                catch_response=True,
                timeout=20,
            ) as response:
                result["http_status"] = response.status_code

                if response.status_code != 201:
                    response.failure(
                        f"Expected HTTP 201, received {response.status_code}."
                    )
                    return

                try:
                    customer = response.json()
                    customer_id = int(customer["customer_id"])
                    ticket_id = int(customer["ticket_id"])

                    if (
                        customer.get("queue_code") != QUEUE_CODE
                        or customer.get("phone_number") != phone_number
                        or customer.get("status") != "waiting"
                    ):
                        raise ValueError("Unexpected registration response.")

                except (ValueError, KeyError, TypeError):
                    response.failure(
                        "The registration response was missing expected data."
                    )
                    return

                result["customer_id"] = customer_id
                result["ticket_id"] = ticket_id
                result["valid_success"] = True
                response.success()