from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from backend.REST_API.DAO.queue_DAO import queueDAO, Queue
import psycopg2
import secrets
import hashlib
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException
import logging


class Customer(BaseModel):
    customer_id: Optional[int] = None
    staff_id: Optional[int] = None
    ticket_id: Optional[int] = None
    phone_number: Optional[str] = None
    queue_code: Optional[str] = None
    waiting_started_at: Optional[datetime.datetime] = None
    waiting_time: Optional[datetime.timedelta] = None
    called_time: Optional[datetime.datetime] = None
    service_started_at: Optional[datetime.datetime] = None
    completed_time: Optional[datetime.datetime] = None
    service_time: Optional[datetime.timedelta] = None
    status: Optional[str] = None


class customerDAO:
    def __init__(self):
        self.pool = SimpleConnectionPool(
            POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
        )

    def has_active_ticket3(self, queue_code: str, phone_number: str):
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT customer.customer_id
                FROM customer
                         JOIN queue ON customer.queue_id = queue.queue_id
                WHERE queue.queue_code = %s
                  AND customer.phone_number = %s
                  AND customer.status IN ('waiting', 'called', 'attending', 'skipped')
                LIMIT 1 \
                """
        # Check for an active ticket with this phone number in the same queue.
        cur.execute(query, (queue_code, phone_number))
        cashe = cur.fetchone()
        conn.commit()
        cur.close()
        self.pool.putconn(conn)
        return cashe is not None

    def add_customer3(self, new_customer: Customer):
        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Retrieve and lock the Queue during registration.
                    cur.execute("""
                        SELECT queue_id, service_id, active, pending_disable
                        FROM queue
                        WHERE queue_code = %s
                        FOR UPDATE
                    """, (new_customer.queue_code,))

                    queue = cur.fetchone()

                    if queue is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Queue not found."
                        )

                    if not queue["active"] or queue["pending_disable"]:
                        raise HTTPException(
                            status_code=409,
                            detail="Queue is not accepting new customers."
                        )

                    queue_id = queue["queue_id"]

                    # Verify that the associated Service is Active.
                    cur.execute("""
                        SELECT active
                        FROM service
                        WHERE service_id = %s
                    """, (queue["service_id"],))

                    service = cur.fetchone()

                    if service is None or not service["active"]:
                        raise HTTPException(
                            status_code=409,
                            detail="Service is disabled."
                        )

                    # Generate the next ticket number.
                    cur.execute("""
                        SELECT COALESCE(MAX(ticket_id), 0) + 1
                        FROM customer
                        WHERE queue_id = %s
                    """, (queue_id,))

                    ticket_id = cur.fetchone()[0]

                    # Register the Customer.
                    cur.execute("""
                        INSERT INTO customer
                            (ticket_id, phone_number, queue_id)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (queue_id, phone_number)
                        WHERE status IN (
                            'waiting', 'called', 'attending', 'skipped'
                        )
                        DO NOTHING
                        RETURNING customer_id, waiting_started_at,
                                  waiting_time, status
                    """, (
                        ticket_id,
                        new_customer.phone_number,
                        queue_id
                    ))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=409,
                            detail="You already have an active ticket in this queue. Use Find My Ticket to view it."
                        )

        finally:
            self.pool.putconn(conn)

        new_customer.ticket_id = ticket_id
        new_customer.customer_id = cashe[0]
        new_customer.waiting_started_at = cashe[1]
        new_customer.waiting_time = cashe[2]
        new_customer.status = cashe[3]

        # Preserve the existing next Customer tracking.
        try:
            next_customer = self.get_next_customer3(
                new_customer.queue_code
            )

            if (
                next_customer is not None
                and next_customer.customer_id == new_customer.customer_id
            ):
                customerDAO().set_next_customer3(
                    new_customer.customer_id,
                    new_customer.queue_code
                )

        except Exception:
            logging.exception("Could not update next customer information.")

        return new_customer

    def get_ticket3(self, queue_code: str, ticket_number: int):
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT customer.ticket_id   AS ticket_number,
                       queue.queue_code,
                       queue.queue_name,
                       service.service_name AS service,
                       customer.status,
                       admin.organization_name,
                       CASE
                           WHEN customer.status = 'waiting'
                               THEN (SELECT COUNT(*)
                                     FROM customer AS ahead
                                     WHERE ahead.queue_id = customer.queue_id
                                       AND ahead.status = 'waiting'
                                       AND ahead.ticket_id < customer.ticket_id)
                           ELSE NULL
                           END              AS people_ahead,
                       ARRAY(
                               SELECT serving.ticket_id
                               FROM customer AS serving
                               WHERE serving.queue_id = customer.queue_id
                                 AND serving.status IN ('called', 'attending')
                               ORDER BY serving.ticket_id
                       )                    AS now_serving
                FROM customer
                         JOIN queue ON customer.queue_id = queue.queue_id
                         JOIN service ON queue.service_id = service.service_id
                         LEFT JOIN admin ON queue.admin_id = admin.admin_id
                WHERE queue.queue_code = %s
                  AND customer.ticket_id = %s \
                """
        # Retrieve the ticket and Queue statistics without Customer contact information.
        cur.execute(query, (queue_code, ticket_number))
        cashe = cur.fetchone()
        conn.commit()
        cur.close()
        self.pool.putconn(conn)

        if cashe == None:
            raise HTTPException(status_code=404, detail="ticket missing")

        ticket = dict(cashe)

        # Position 1 identifies the next eligible waiting Customer.
        # Customers with another status do not have a waiting position.
        if ticket["status"] == "waiting":
            ticket["position"] = ticket["people_ahead"] + 1
        else:
            ticket["position"] = None

        return ticket
        # return the matching ticket with its Queue information and current statistics

    def list_customers3(self, queue_code: str):
        queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
        customer_list: list[Customer] = []
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT *
                FROM customer
                WHERE queue_id = %s
                ORDER BY ticket_id DESC \
                """
        # set up query to make call to database
        cur.execute(query, (queue_id,))
        count = 0
        for row in cur:
            customer_list.append(Customer(**row))
            customer_list[count].queue_code = queue_code
            count += 1
        conn.commit()
        cur.close()
        self.pool.putconn(conn)
        return customer_list
        # return customers from the specified queue, or an empty list

    # ===== Dashboard Statistics =====

    # Counts all customers with an active ticket in queues owned by the admin.
    def count_waiting_customers3(self, admin_id: int):
        conn = self.pool.getconn()
        cur = conn.cursor()

        query = """
                SELECT COUNT(*)
                FROM customer
                         JOIN queue ON customer.queue_id = queue.queue_id
                WHERE queue.admin_id = %s
                  AND customer.status IN ('waiting', 'called', 'attending', 'skipped') \
                """

        cur.execute(query, (admin_id,))
        count = cur.fetchone()[0]

        cur.close()
        self.pool.putconn(conn)

        return count

    # ===== End Dashboard Statistics =====

    # Retrieves the Customer currently being served by this Staff.
    def get_current_customer3(self, queue_id: int, staff_id: int):
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)

        query = """
        SELECT
            customer_id,
            ticket_id,
            phone_number,
            status,
            called_time,
            staff_id
        FROM customer
        WHERE queue_id = %s
          AND staff_id = %s
          AND status IN ('called', 'attending')
        LIMIT 1
        """

        cur.execute(query, (queue_id, staff_id))
        result = cur.fetchone()

        cur.close()
        self.pool.putconn(conn)

        return dict(result) if result is not None else None

    # Calls the next waiting Customer and assigns it to the Staff.
    def pop_customer3(self, queue_code: str, staff_id: int):
        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Lock the Staff to prevent simultaneous actions.
                    cur.execute("""
                        SELECT staff_id
                        FROM staff
                        WHERE staff_id = %s
                        FOR UPDATE
                    """, (staff_id,))

                    if cur.fetchone() is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Staff not found."
                        )

                    # Verify the Staff's Queue assignment.
                    cur.execute("""
                        SELECT queue.queue_id, queue.active
                        FROM staff_queue_assignment
                        JOIN staff USING (staff_id)
                        JOIN queue USING (queue_id)
                        WHERE staff.staff_id = %s
                          AND queue.queue_code = %s
                          AND staff.admin_id = queue.admin_id
                        FOR SHARE OF queue
                    """, (staff_id, queue_code))

                    assignment = cur.fetchone()

                    if assignment is None:
                        raise HTTPException(
                            status_code=403,
                            detail="Staff is not assigned to this queue."
                        )

                    if not assignment["active"]:
                        raise HTTPException(
                            status_code=409,
                            detail="Queue is disabled."
                        )

                    queue_id = assignment["queue_id"]

                    # Prevent the Staff from serving multiple Customers.
                    cur.execute("""
                        SELECT customer_id
                        FROM customer
                        WHERE staff_id = %s
                          AND status IN ('called', 'attending')
                    """, (staff_id,))

                    if cur.fetchone() is not None:
                        raise HTTPException(
                            status_code=409,
                            detail="Staff is already serving a customer."
                        )

                    # Select and assign the next available Customer.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'called',
                            waiting_time = waiting_time + (NOW() - waiting_started_at),
                            called_time = NOW(),
                            staff_id = %s
                        WHERE customer_id = (
                            SELECT customer_id
                            FROM customer
                            WHERE queue_id = %s
                              AND status = 'waiting'
                            ORDER BY ticket_id, customer_id
                            LIMIT 1
                            FOR UPDATE SKIP LOCKED
                        )
                        RETURNING *
                    """, (staff_id, queue_id))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=404,
                            detail="No waiting customers available."
                        )

        finally:
            self.pool.putconn(conn)

        retired_customer = Customer(
            **dict(cashe),
            queue_code=queue_code
        )
        try:
            next_customer = customerDAO().get_next_customer3(queue_code)

            if next_customer is not None:
                queueDAO().update_wait_time(
                    datetime.datetime.now(datetime.timezone.utc) - next_customer.waiting_started_at,
                    next_customer.queue_code
                )

                customerDAO().set_next_customer3(
                    next_customer.customer_id,
                    next_customer.queue_code
                )

        except Exception:
            logging.exception("Could not update wait-time information.")

        return retired_customer
        # return the customer removed from the specified queue

    # Starts service for the Customer assigned to the Staff.
    def start_service3(self, queue_code: str, ticket_id: int, staff_id: int):
        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Start service only for the called Customer
                    # assigned to this Staff.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'attending',
                            service_started_at = NOW()
                        WHERE queue_id = (
                            SELECT queue_id
                            FROM queue
                            WHERE queue_code = %s
                        )
                          AND ticket_id = %s
                          AND staff_id = %s
                          AND status = 'called'
                        RETURNING *
                    """, (queue_code, ticket_id, staff_id))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Called customer not assigned to this Staff."
                        )

        finally:
            self.pool.putconn(conn)

        return Customer(
            **dict(cashe),
            queue_code=queue_code
        )

        # Completes the Customer assigned to the logged-in Staff.
    def complete_customer3(self, queue_code: str, ticket_id: int, staff_id: int):
        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Retrieve and lock the Queue during completion.
                    cur.execute("""
                        SELECT queue_id
                        FROM queue
                        WHERE queue_code = %s
                        FOR UPDATE
                    """, (queue_code,))

                    queue = cur.fetchone()

                    if queue is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Queue not found."
                        )

                    queue_id = queue["queue_id"]

                    # Complete only the Customer assigned to this Staff.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'completed',
                            completed_time = NOW(),
                            service_time = NOW() - service_started_at
                        WHERE queue_id = %s
                          AND ticket_id = %s
                          AND staff_id = %s
                          AND status = 'attending'
                        RETURNING *
                    """, (queue_id, ticket_id, staff_id))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Called customer not assigned to this Staff."
                        )

                    # Check whether the Queue still has active tickets.
                    cur.execute("""
                        SELECT COUNT(*)
                        FROM customer
                        WHERE queue_id = %s
                          AND status IN ('waiting', 'called', 'attending', 'skipped')
                    """, (queue_id,))

                    active_tickets = cur.fetchone()[0]

                    # Finish disabling the Queue when no active tickets remain.
                    if active_tickets == 0:
                        cur.execute("""
                            UPDATE queue
                            SET active = FALSE,
                                pending_disable = FALSE
                            WHERE queue_id = %s
                              AND pending_disable = TRUE
                        """, (queue_id,))

        finally:
            self.pool.putconn(conn)

        return Customer(
            **dict(cashe),
            queue_code=queue_code
        )

    # Cancels the ticket of a Customer who did not arrive.
    def no_show_customer3(self, queue_code: str, ticket_id: int, staff_id: int):
        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Retrieve and lock the Queue.
                    cur.execute("""
                        SELECT queue_id
                        FROM queue
                        WHERE queue_code = %s
                        FOR UPDATE
                    """, (queue_code,))

                    queue = cur.fetchone()

                    if queue is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Queue not found."
                        )

                    queue_id = queue["queue_id"]

                    # Cancel only the called Customer assigned to this Staff.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'no_show'
                        WHERE queue_id = %s
                          AND ticket_id = %s
                          AND staff_id = %s
                          AND status = 'called'
                        RETURNING *
                    """, (queue_id, ticket_id, staff_id))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Called customer not assigned to this Staff."
                        )

                    # Check whether the Queue still has active tickets.
                    cur.execute("""
                        SELECT COUNT(*)
                        FROM customer
                        WHERE queue_id = %s
                          AND status IN (
                              'waiting', 'called', 'attending', 'skipped'
                          )
                    """, (queue_id,))

                    active_tickets = cur.fetchone()[0]

                    # Finish disabling the Queue if no active tickets remain.
                    if active_tickets == 0:
                        cur.execute("""
                            UPDATE queue
                            SET active = FALSE,
                                pending_disable = FALSE
                            WHERE queue_id = %s
                              AND pending_disable = TRUE
                        """, (queue_id,))

        finally:
            self.pool.putconn(conn)

        return Customer(
            **dict(cashe),
            queue_code=queue_code
        )

    def skip_customer3(self, queue_code: str, ticket_id: int, staff_id: int):
        return_token = secrets.token_urlsafe(32)
        return_token_hash = hashlib.sha256(
            return_token.encode("utf-8")
        ).hexdigest()

        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Retrieve and lock the Queue.
                    cur.execute("""
                        SELECT queue_id, active, pending_disable
                        FROM queue
                        WHERE queue_code = %s
                        FOR UPDATE
                    """, (queue_code,))

                    queue = cur.fetchone()

                    if queue is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Queue not found."
                        )

                    # Do not postpone Customers while the Queue is closing.
                    if not queue["active"] or queue["pending_disable"]:
                        raise HTTPException(
                            status_code=409,
                            detail="Customers cannot be skipped while the Queue is closing or disabled."
                        )

                    queue_id = queue["queue_id"]

                    # Skip the Customer and store the return token hash.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'skipped',
                            return_token_hash = %s
                        WHERE queue_id = %s
                          AND ticket_id = %s
                          AND staff_id = %s
                          AND status = 'called'
                        RETURNING *
                    """, (
                        return_token_hash,
                        queue_id,
                        ticket_id,
                        staff_id
                    ))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Called customer not assigned to this Staff."
                        )

        finally:
            self.pool.putconn(conn)

        return Customer(
            **dict(cashe),
            queue_code=queue_code
        ), return_token

    # Allows a skipped Customer to return using their secure token.
    def return_customer3(
        self,
        queue_code: str,
        ticket_id: int,
        return_token: str
    ):
        return_token_hash = hashlib.sha256(
            return_token.encode("utf-8")
        ).hexdigest()

        conn = self.pool.getconn()

        try:
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cur:

                    # Retrieve and lock the Queue.
                    cur.execute("""
                        SELECT queue_id, active, pending_disable
                        FROM queue
                        WHERE queue_code = %s
                        FOR UPDATE
                    """, (queue_code,))

                    queue = cur.fetchone()

                    if queue is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Queue not found."
                        )

                    if not queue["active"] or queue["pending_disable"]:
                        raise HTTPException(
                            status_code=409,
                            detail="Queue is closing or disabled."
                        )

                    # Return the Customer only if the token is valid.
                    cur.execute("""
                        UPDATE customer
                        SET status = 'waiting',
                            waiting_started_at = NOW(),
                            called_time = NULL,
                            staff_id = NULL,
                            return_token_hash = NULL
                        WHERE queue_id = %s
                          AND ticket_id = %s
                          AND status = 'skipped'
                          AND return_token_hash = %s
                        RETURNING *
                    """, (
                        queue["queue_id"],
                        ticket_id,
                        return_token_hash
                    ))

                    cashe = cur.fetchone()

                    if cashe is None:
                        raise HTTPException(
                            status_code=403,
                            detail="Invalid or expired return token."
                        )

        finally:
            self.pool.putconn(conn)

        return Customer(
            **dict(cashe),
            queue_code=queue_code
        )

    def get_next_customer3(self, queue_code: str):
        queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
        cashe: Customer
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT customer_id, queue_id, waiting_started_at, waiting_time
                FROM customer
                WHERE queue_id = %s
                  AND status = 'waiting'
                ORDER BY ticket_id, customer_id
                LIMIT 1
                """
        # set up query to make call to database
        cur.execute(query, (queue_id,))
        cashe = cur.fetchone()
        conn.commit()
        cur.close()
        self.pool.putconn(conn)
        if cashe == None:
            return None
        next_customer = Customer(
            customer_id=cashe["customer_id"],
            waiting_started_at=cashe["waiting_started_at"],
            waiting_time=cashe["waiting_time"],
            queue_code=queue_code,
        )
        return next_customer

    def set_next_customer3(self, next_customer: int, queue_code):
        queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)

        query = """
                INSERT INTO next_customer
                    (next_customer_id, queue_id)
                VALUES (%s, %s)
                ON CONFLICT (next_customer_id)
                    DO UPDATE SET queue_id = EXCLUDED.queue_id
                RETURNING next_customer_id, queue_id
                """

        cur.execute(query, (next_customer, queue_id))
        cashe = cur.fetchone()
        conn.commit()
        cur.close()
        self.pool.putconn(conn)

        return Customer(
            customer_id=cashe["next_customer_id"],
            queue_code=queue_code
        )

    def get_time_remaning3(self, phone_number: str, queue_code: str):
        time_list: list[int]
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT time_list
                FROM queue
                WHERE queue_code = %s \
                """
        # set up query to make call to database
        cur.execute(query, (queue_code,))
        cashe = cur.fetchone()
        if cashe == None:
            raise HTTPException(status_code=404, detail="queue missing")
        time_list = cashe["time_list"]
        conn.commit()
        cur.close()
        self.pool.putconn(conn)

        queue = queueDAO().get_active_withcode_queue3(queue_code)
        queue_id = queue.queue_id
        customer_list: list[Customer]
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)
        query = """
                SELECT *
                FROM customer
                WHERE queue_id = %s \
                """
        # set up query to make call to database
        cur.execute(query, (queue_id,))
        customer_list = cur.fetchall()
        conn.commit()
        cur.close()
        if customer_list == []:
            raise HTTPException(status_code=404, detail="queue empty")

        average_count = 0
        item_list_sum = datetime.timedelta(0)
        for time_waited in time_list:
            average_count += 1
            item_list_sum = item_list_sum + time_waited
        average_wait_time = time_waited / average_count

        customer_count = 0

        while True:
            customer_count += 1
            if customer_list[customer_count - 1]["phone_number"] == phone_number:
                break
        return customer_count * average_wait_time
