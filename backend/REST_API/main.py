# Imports the tools needed to create the API (Application Programming Interface), handle requests,
# manage login sessions, and allow communication with the frontend.
import os
from starlette.middleware.sessions import SessionMiddleware

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

# Imports the handlers and data models used by the API routes.

from backend.REST_API.handler.customer_handler import customerHandler
from backend.REST_API.DAO.customer_DAO import (
    Customer,
)

from backend.REST_API.handler.queue_handler import queueHandler
from backend.REST_API.DAO.queue_DAO import (
    Queue,
)

from backend.REST_API.handler.admin_handler import adminHandler
from backend.REST_API.DAO.admin_DAO import (
    Admin,
)

from backend.REST_API.handler.staff_handler import staffHandler
from backend.REST_API.DAO.staff_DAO import (
    Staff,
)

from backend.REST_API.handler.staff_privilege_handler import staff_privilegeHandler
from backend.REST_API.DAO.staff_privilege_DAO import (
    Staff_Privilege,
)

from backend.REST_API.DAO.service_DAO import Service
from backend.REST_API.handler.service_handler import serviceHandler

# Creates the FastAPI application.
# When the frontend sends an HTTP request to an API route,
# FastAPI matches the request to the route, runs the associated function,
# and sends the function's result back to the frontend as the response.
app = FastAPI()

# Create backend/.env containing SESSION_SECRET_KEY=<random key>.
# Generate a key: python3 -c "import secrets; print(secrets.token_hex(32))"
# Start the backend with --env-file backend/.env to load it.
# Example: uvicorn backend.REST_API.main:app --reload --env-file backend/.env

# Store the verified account in a signed session cookie.
# The browser sends this cookie with later requests to identify the account.
# The cookie has a maximum age of 30 minutes.

# Version 1.1 comments:
# Keeps the logged-in account available between requests.
# The session is stored in a signed cookie and expires after 30 minutes.
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET_KEY"],
    max_age=1800,
    same_site="lax",
    https_only=False,  # Local HTTP development.
)

# Permit local frontend origins to make cookie-based authentication requests.

# Version 1.1 comments
# Allows the frontend to communicate with the backend
# even though they are running on different local addresses.
# Credentials are allowed so the login session cookie can be sent with requests.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

################################################ REST API ####################################################################

# ===== Customer API Routes =====
# These routes receive customer-related requests from the frontend
# and pass them to the customer handler, where the backend logic is applied.

# Adds a new customer to a queue.
@app.post("/database/customer/add_customer")
async def add_customer1(new_customer: Customer, status_code=201):
    return customerHandler().add_customer2(new_customer)

# Gets the information for a specific customer ticket in a queue.
@app.get("/database/customer/get_ticket")
async def get_ticket1(queue_code: str, ticket_number: int):
    return customerHandler().get_ticket2(queue_code, ticket_number)

# Gets the customers currently associated with a specific queue.
@app.get("/database/customer/get_queue_{queue_code}")
async def list_customers1(queue_code: str, status_code=201):
    return customerHandler().list_customers2(queue_code)

# Counts how many customers are currently waiting for the selected admin.
@app.get("/database/customer/count_waiting_{admin_id}")
async def count_waiting_customers1(admin_id: int):
    return customerHandler().count_waiting_customers2(admin_id)

@app.delete("/database/customer/pop_customer_from_{queue_code}")
async def pop_customer(queue_code: str, status_code=201):
    return customerHandler().pop_customer2(queue_code)

@app.put("/database/customer/complete_customer/{queue_code}/{ticket_id}")
async def complete_customer1(queue_code: str, ticket_id: int):
    return customerHandler().complete_customer2(
        queue_code,
        ticket_id
    )

# ===== Admin API Routes =====
# These routes handle admin account requests such as creating,
# verifying, or deleting an admin account.

@app.post("/database/admin/add_admin", status_code=201)
def add_admin1(new_admin: Admin, status_code=201):
    """ Register an admin using signup validation and password hashing in handler. """
    return adminHandler().add_admin2(new_admin)

# Credential verification uses POST; get-prefixed routes retrieve data.
@app.post("/database/admin/verify_admin", status_code=201)
def verify_admin1(
    email: str = Body(...),
    password: str = Body(...), status_code=201
):
    """ Verify admin credentials and return safe account details without creating a session. """
    account = adminHandler().get_admin2(email, password)

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )
    return account

@app.delete("/database/admin/delete_admin")
def delete_admin1(new_admin: Admin, status_code=201):
    return adminHandler().delete_admin2(new_admin)

# ===== Service API Routes =====
# These routes receive service-related requests from the frontend
# and pass them to the service handler, where the backend logic is applied.

@app.post("/database/service/add_service")
async def add_service1(new_service: Service, request: Request, status_code=201):
    return serviceHandler().add_service2(
        new_service,
        request.session.get("account")
    )

@app.get("/database/service/get_service_list")
async def get_service_list1(request: Request, status_code=201):
    return serviceHandler().get_service_list2(
        request.session.get("account")
    )

@app.put("/database/service/update_service")
async def update_service1(updated_service: Service, request: Request):
    return serviceHandler().update_service2(
        updated_service,
        request.session.get("account")
    )

@app.put("/database/service/set_active/{service_id}")
async def set_service_active1(
        service_id: int,
        make_active: bool,
        request: Request
):
    return serviceHandler().set_service_active2(
        service_id,
        make_active,
        request.session.get("account")
    )

@app.delete("/database/service/delete_service/{service_id}")
async def delete_service1(service_id: int, request: Request):
    return serviceHandler().delete_service2(
        service_id,
        request.session.get("account")
    )

# ===== Queue API Routes =====
# These routes receive queue-related requests from the frontend
# and pass them to the queue handler, where the backend logic is applied.

@app.get("/database/queue/count_active_{admin_id}")
async def count_active_queues1(admin_id: int):
    return queueHandler().count_active_queues2(admin_id)

@app.put("/database/queue/update_queue")
async def update_queue1(updated_queue: Queue, request: Request):
    return queueHandler().update_queue2(
        updated_queue,
        request.session.get("account")
    )

@app.post("/database/queue/add_queue")
async def add_queue1(new_queue: Queue, request: Request, status_code=201):
    return queueHandler().add_queue2(
        new_queue,
        request.session.get("account")
    )

@app.put("/database/queue/set_active/{queue_code}")
async def set_queue_active1(
        queue_code: str,
        make_active: bool,
        request: Request
):
    return queueHandler().set_queue_active2(
        queue_code,
        make_active,
        request.session.get("account")
    )

@app.get("/database/queue/get_queue_list")
async def get_queue_list1(request: Request, status_code=201):
    return queueHandler().get_queue_list2(
        request.session.get("account")
    )

@app.get("/database/queue/get_withcode_queue_{queue_code}")
async def get_withcode_queue1(queue_code: str, status_code=201):
    return queueHandler().get_withcode_queue2(queue_code)

@app.get("/database/queue/get_active_withcode/{queue_code}")
def get_active_withcode_queue(queue_code: str):
    return queueHandler().get_active_withcode_queue2(queue_code)

@app.delete("/database/queue/delete_queue/{queue_code}")
async def delete_queue1(queue_code: str, request: Request):
    return queueHandler().delete_queue2(
        queue_code,
        request.session.get("account")
    )

# ===== Staff API Routes =====
# These routes handle staff account requests such as creating,
# verifying, or deleting a staff account.

@app.post("/database/staff/add_staff", status_code=201)
def add_staff1(new_Staff: Staff, status_code=201):
    """ Register a staff account using signup validation and password hashing in handler. """
    return staffHandler().add_staff2(new_Staff)

@app.post("/database/staff/verify_staff", status_code=201)
def verify_staff1(
    email: str = Body(...),
    password: str = Body(...), status_code=201
):
    """ Verify staff credentials and return safe account details without creating a session. """
    account = staffHandler().get_staff2(email, password)

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )
    return account

@app.delete("/database/staff/delete_staff")
def delete_staff1(new_Staff: Staff, status_code=201):
    return staffHandler().delete_staff2(new_Staff)


@app.post("/database/staff_privilege/add_staff_privilege", status_code=201)
async def add_staff_privilege1(new_staff_privilege: Staff_Privilege):
    return staff_privilegeHandler().add_staff_privilege2(new_staff_privilege)

@app.get("/database/staff_privilege/get_staff_privilege_list")
async def get_staff_privilege_list1(status_code=201):
    return staff_privilegeHandler().get_staff_privilege_list2()

@app.get("/database/staff_privilege/get_with_staff_privilege_staff_list_{staff_privilege}")
async def get_with_staff_privilege_staff_list1(staff_privilege: str, status_code=201):
    return staff_privilegeHandler().get_with_staff_privilege_staff_list2(
        staff_privilege
    )

@app.delete("/database/staff_privilege/delete_staff_privilege_{staff_privilege}")
async def delete_staff_privilege_staff1(staff_privilege: str, status_code=201):
    return staff_privilegeHandler().delete_staff_privilege_staff2(
        staff_privilege
    )


######################################### LOG IN / OUT #########################################

@app.post("/auth/login")
def login1(
    request: Request,
    email: str = Body(...),
    password: str = Body(...),
):
    """
    Authenticate an admin or staff member and save the account in a signed session cookie.

    Replace prior session data after successful verification and return account
    details without the password hash. Reject invalid credentials with HTTP 401.
    """
    account = adminHandler().get_admin2(email, password)

    if account is None:
        account = staffHandler().get_staff2(email, password)

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Replace previous session data with the verified account.
    request.session.clear()
    request.session["account"] = account
    return account


@app.get("/auth/get_current_account")
def get_current_account1(request: Request):
    """ Return the account remembered in the session, or HTTP 401 when it is absent. """
    account = request.session.get("account")

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Not logged in."
        )
    return account


@app.post("/auth/logout")
def logout1(request: Request):
    """ Clear this browser session and confirm logout. """
    request.session.clear()
    return {"message": "Logged out."}
