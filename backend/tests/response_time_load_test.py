"""
Tests the Response Time and Load Tolerance performance indicator.

Simulates Customer requests for Queue lookup, joining, and ticket status.
"""

import itertools

import psycopg2
import requests
from locust import HttpUser, constant_pacing, task
from locust.exception import StopUser

from backend.REST_API.dbconfig import PG_DB_CONFIG


QUEUE_CODE = "AAF-154-99"
TEST_BACKEND = "http://127.0.0.1:8001"

customer_numbers = itertools.count(1)


class CustomerUser(HttpUser):
    host = TEST_BACKEND

    # Each user attempts one request every five seconds.
    wait_time = constant_pacing(5)

    def on_start(self):
        # Make sure Locust is using the backend with SMS disabled.
        try:
            response = requests.get(
                f"{TEST_BACKEND}/load-test/sms-status",
                timeout=5,
            )
            response.raise_for_status()

            if response.json() != {"sms_disabled": True}:
                raise ValueError("SMS is not confirmed as disabled.")

        except (requests.RequestException, ValueError):
            print("Test stopped: the SMS-disabled backend is not available.")
            raise StopUser()

        self.number = next(customer_numbers)

        if self.number > 25:
            print("Test stopped: use exactly 25 simulated users.")
            raise StopUser()

        self.phone = f"555-010-{self.number:04d}"
        self.step = (self.number - 1) % 3

        self.db = psycopg2.connect(**PG_DB_CONFIG)

        # Find this simulated Customer's current test ticket.
        with self.db.cursor() as cursor:
            cursor.execute(
                """
                SELECT customer.ticket_id
                FROM customer
                JOIN queue ON customer.queue_id = queue.queue_id
                WHERE queue.queue_code = %s
                  AND customer.phone_number = %s
                  AND customer.status = 'waiting'
                """,
                (QUEUE_CODE, self.phone),
            )

            result = cursor.fetchone()

        if result is None:
            print(f"No waiting test ticket found for user {self.number}.")
            self.db.close()
            raise StopUser()

        self.ticket = result[0]

    def on_stop(self):
        if hasattr(self, "db") and not self.db.closed:
            self.db.close()

    @task
    def customer_action(self):
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
                    "ticket_number": self.ticket,
                },
                name="Ticket status",
                timeout=20,
            )

        else:
            # Complete this fictional Customer's previous test ticket
            # before registering the same simulated Customer again.
            with self.db:
                with self.db.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE customer
                        SET status = 'completed'
                        WHERE phone_number = %s
                          AND status = 'waiting'
                          AND queue_id = (
                              SELECT queue_id
                              FROM queue
                              WHERE queue_code = %s
                          )
                        """,
                        (self.phone, QUEUE_CODE),
                    )

            with self.client.post(
                "/database/customer/add_customer",
                json={
                    "queue_code": QUEUE_CODE,
                    "phone_number": self.phone,
                },
                name="Join queue",
                timeout=20,
                catch_response=True,
            ) as response:
                if response.status_code == 201:
                    try:
                        self.ticket = int(response.json()["ticket_id"])
                    except (ValueError, KeyError, TypeError):
                        response.failure("The response is missing a ticket ID.")