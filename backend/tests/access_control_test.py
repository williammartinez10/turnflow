"""
Tests selected cases for the Access Control performance indicator.

Covers unauthenticated access, Staff and Admin permissions,
organizational isolation, and authorized Queue operations.
"""

import getpass

from locust import HttpUser, task
from locust.exception import StopUser


TEST_BACKEND = "http://127.0.0.1:8001"
QUEUE_CODE = "AAF-154-99"
PUBLIC_TICKET = 1071

# This ticket must have "called" status before the test starts.
CALLED_TICKET = 1062

OWN_ORGANIZATION = "Santini Master Fades"
OTHER_ORGANIZATION = "Test Organization"

# Enter credentials locally when starting Locust.
OWNER_EMAIL = input("Owning Admin email: ")
OWNER_PASSWORD = getpass.getpass("Owning Admin password: ")

OTHER_ADMIN_EMAIL = input("Test Organization Admin email: ")
OTHER_ADMIN_PASSWORD = getpass.getpass("Test Organization Admin password: ")

STAFF_EMAIL = input("Assigned Staff email: ")
STAFF_PASSWORD = getpass.getpass("Assigned Staff password: ")


def contains_phone_field(value):
    """Check whether a response contains a phone-related field."""
    if isinstance(value, dict):
        return any(
            "phone" in str(key).lower() or contains_phone_field(item)
            for key, item in value.items()
        )

    if isinstance(value, list):
        return any(contains_phone_field(item) for item in value)

    return False


class AccessControlUser(HttpUser):
    host = TEST_BACKEND

    def check(self, method, path, name, statuses, validate=None, **kwargs):
        """Check the response status and, when needed, its JSON content."""
        with self.client.request(
            method,
            path,
            name=name,
            catch_response=True,
            timeout=10,
            **kwargs,
        ) as response:
            if response.status_code not in statuses:
                response.failure(
                    f"Expected {statuses}, received HTTP {response.status_code}."
                )
                return False, None

            data = None

            if validate is not None:
                try:
                    data = response.json()
                    valid = validate(data)
                except (ValueError, TypeError, KeyError, AttributeError):
                    valid = False

                if not valid:
                    response.failure("The response did not match the expected result.")
                    return False, None

            response.success()
            return True, data

    def login(self, email, password, role, organization, name):
        passed, _ = self.check(
            "POST",
            "/auth/login",
            name,
            (200,),
            validate=lambda account: (
                account.get("role") == role
                and account.get("organization_name") == organization
            ),
            json={"email": email, "password": password},
        )
        return passed

    def check_queue_access(self, role):
        self.check(
            "GET",
            f"/database/queue/get_withcode_queue_{QUEUE_CODE}",
            f"{role} can access their Queue",
            (200,),
            validate=lambda queue: queue.get("queue_code") == QUEUE_CODE,
        )

        self.check(
            "GET",
            f"/database/customer/get_queue_{QUEUE_CODE}",
            f"{role} can access the Queue Customer list",
            (200,),
            validate=lambda customers: isinstance(customers, list),
        )

    @task
    def check_access_control(self):
        # Use only the SMS-disabled test backend.
        if self.host.rstrip("/") != TEST_BACKEND:
            print("Test stopped: use the test backend on port 8001.")
            raise StopUser()

        passed, _ = self.check(
            "GET",
            "/load-test/sms-status",
            "SMS is disabled",
            (200,),
            validate=lambda result: result == {"sms_disabled": True},
        )

        if not passed:
            raise StopUser()

        # Confirm the called ticket exists before testing completion access.
        passed, _ = self.check(
            "GET",
            "/database/customer/get_ticket",
            "Called test ticket is available",
            (200,),
            validate=lambda ticket: (
                ticket.get("ticket_number") == CALLED_TICKET
                and ticket.get("queue_code") == QUEUE_CODE
                and ticket.get("status") == "called"
            ),
            params={
                "queue_code": QUEUE_CODE,
                "ticket_number": CALLED_TICKET,
            },
        )

        if not passed:
            print("Test stopped: check CALLED_TICKET before retrying.")
            raise StopUser()

        protected_cases = [
            ("Current account requires login", "/auth/get_current_account"),
            ("Staff list requires login", "/database/staff/get_staff_list"),
            ("Service list requires login", "/database/service/get_service_list"),
            ("Queue list requires login", "/database/queue/get_queue_list"),
            ("Customer list requires login", f"/database/customer/get_queue_{QUEUE_CODE}"),
        ]

        for name, path in protected_cases:
            self.check("GET", path, name, (401,))

        self.check(
            "GET",
            "/database/customer/get_ticket",
            "Public ticket lookup without phone number",
            (200,),
            validate=lambda ticket: (
                ticket.get("queue_code") == QUEUE_CODE
                and ticket.get("ticket_number") == PUBLIC_TICKET
                and not contains_phone_field(ticket)
            ),
            params={
                "queue_code": QUEUE_CODE,
                "ticket_number": PUBLIC_TICKET,
            },
        )

        call_path = f"/database/customer/pop_customer_from_{QUEUE_CODE}"
        complete_path = (
            f"/database/customer/complete_customer/{QUEUE_CODE}/{CALLED_TICKET}"
        )

        # Stop if an unauthorized action is not rejected.
        for method, path, name in [
            ("DELETE", call_path, "Logged-out user cannot call a Customer"),
            ("PUT", complete_path, "Logged-out user cannot complete a ticket"),
        ]:
            passed, _ = self.check(method, path, name, (401,))
            if not passed:
                raise StopUser()

        if not self.login(
            OTHER_ADMIN_EMAIL,
            OTHER_ADMIN_PASSWORD,
            "admin",
            OTHER_ORGANIZATION,
            "Other organization's Admin login",
        ):
            raise StopUser()

        foreign_cases = [
            ("Other Admin cannot access Queue", f"/database/queue/get_withcode_queue_{QUEUE_CODE}"),
            ("Other Admin cannot access Customer list", f"/database/customer/get_queue_{QUEUE_CODE}"),
        ]

        for name, path in foreign_cases:
            self.check("GET", path, name, (403, 404))

        for method, path, name in [
            ("DELETE", call_path, "Other Admin cannot call a Customer"),
            ("PUT", complete_path, "Other Admin cannot complete a ticket"),
        ]:
            passed, _ = self.check(method, path, name, (403,))
            if not passed:
                raise StopUser()

        if not self.login(
            OWNER_EMAIL,
            OWNER_PASSWORD,
            "admin",
            OWN_ORGANIZATION,
            "Owning Admin login",
        ):
            raise StopUser()

        self.check_queue_access("Admin")

        if not self.login(
            STAFF_EMAIL,
            STAFF_PASSWORD,
            "staff",
            OWN_ORGANIZATION,
            "Assigned Staff login",
        ):
            raise StopUser()

        admin_only_cases = [
            ("Staff cannot access Admin staff list", "/database/staff/get_staff_list"),
            ("Staff cannot access Admin service list", "/database/service/get_service_list"),
            ("Staff cannot access Admin queue list", "/database/queue/get_queue_list"),
        ]

        for name, path in admin_only_cases:
            self.check("GET", path, name, (403,))

        self.check_queue_access("Staff")

        # The authorized call changes one fictional waiting ticket.
        passed, called = self.check(
            "DELETE",
            call_path,
            "Assigned Staff can call a Customer",
            (200,),
            validate=lambda ticket: (
                ticket.get("ticket_id") is not None
                and ticket.get("status") == "called"
            ),
        )

        if not passed:
            print("Test stopped: inspect the test Queue before retrying.")
            raise StopUser()

        called_ticket = called["ticket_id"]

        # Complete the fictional Customer called by this test.
        self.check(
            "PUT",
            f"/database/customer/complete_customer/{QUEUE_CODE}/{called_ticket}",
            "Assigned Staff can complete a ticket",
            (200,),
            validate=lambda ticket: (
                ticket.get("ticket_id") == called_ticket
                and ticket.get("status") == "completed"
            ),
        )

        raise StopUser()