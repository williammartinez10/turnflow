"""
Tests the Customer-Position Accuracy performance indicator.

Checks the ticket status, position, and number of people ahead returned
by the Customer ticket API for predefined test cases.
"""

from locust import HttpUser, task
from locust.exception import StopUser


QUEUE_CODE = "AAF-154-99"
TEST_BACKEND = "http://127.0.0.1:8001"

# These expected results match the current state of the test Queue.
TEST_CASES = [
    {
        "ticket": 1054,
        "status": "completed",
        "position": None,
        "people_ahead": None,
    },
    {
        "ticket": 1055,
        "status": "waiting",
        "position": 1,
        "people_ahead": 0,
    },
    {
        "ticket": 1060,
        "status": "no_show",
        "position": None,
        "people_ahead": None,
    },
    {
        "ticket": 1061,
        "status": "skipped",
        "position": None,
        "people_ahead": None,
    },
    {
        "ticket": 1062,
        "status": "called",
        "position": None,
        "people_ahead": None,
    },
    {
        "ticket": 1070,
        "status": "waiting",
        "position": 13,
        "people_ahead": 12,
    },
    {
        "ticket": 1071,
        "status": "waiting",
        "position": 14,
        "people_ahead": 13,
    },
]


class PositionAccuracyUser(HttpUser):
    host = TEST_BACKEND

    @task
    def check_positions(self):
        for case in TEST_CASES:
            with self.client.get(
                "/database/customer/get_ticket",
                params={
                    "queue_code": QUEUE_CODE,
                    "ticket_number": case["ticket"],
                },
                name=f"Ticket {case['ticket']}",
                catch_response=True,
                timeout=10,
            ) as response:
                if response.status_code != 200:
                    response.failure(
                        f"Expected HTTP 200, received {response.status_code}."
                    )
                    continue

                try:
                    ticket = response.json()
                except ValueError:
                    response.failure("The response was not valid JSON.")
                    continue

                expected = {
                    "ticket_number": case["ticket"],
                    "queue_code": QUEUE_CODE,
                    "status": case["status"],
                    "position": case["position"],
                    "people_ahead": case["people_ahead"],
                }

                differences = []

                for field, expected_value in expected.items():
                    actual_value = ticket.get(field)

                    if actual_value != expected_value:
                        differences.append(
                            f"{field}: expected {expected_value}, "
                            f"received {actual_value}"
                        )

                if differences:
                    response.failure("; ".join(differences))
                else:
                    response.success()

        # Run the seven cases once for this user.
        raise StopUser()