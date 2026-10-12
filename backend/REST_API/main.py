import os
from starlette.middleware.sessions import SessionMiddleware

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

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

app = FastAPI()

# Create backend/.env containing SESSION_SECRET_KEY=<random key>.
# Generate a key: python3 -c "import secrets; print(secrets.token_hex(32))"
# Start the backend with --env-file backend/.env to load it.
# Like for example: uvicorn backend.REST_API.main:app --reload --env-file backend/.env
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET_KEY"],
    max_age=1800,
    same_site="lax",
    https_only=False,  # Local HTTP development.
)

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

@app.post("/database/customer/add_customer")
async def add_customer1(new_customer: Customer, status_code=201):
    return customerHandler().add_customer2(new_customer)

@app.get("/database/customer/get_queue_{queue_code}")
async def list_customers1(queue_code: str, status_code=201):
    return customerHandler().list_customers2(queue_code)

@app.delete("/database/customer/pop_customer_from_{queue_code}")
async def pop_customer(queue_code: str, status_code=201):
    return customerHandler().pop_customer2(queue_code)


@app.post("/database/queue/add_queue")
async def add_queue1(new_queue: Queue, status_code=201):
    return queueHandler().add_queue2(new_queue)

@app.get("/database/queue/get_queue_list")
async def get_queue_list1(status_code=201):
    return queueHandler().get_queue_list2()

@app.get("/database/queue/get_withcode_queue_{queue_code}")
async def get_withcode_queue1(queue_code: str, status_code=201):
    return queueHandler().get_withcode_queue2(queue_code)

@app.delete("/database/queue/delete_queue_{queue_code}")
async def delete_queue1(queue_code: str, status_code=201):
    return queueHandler().delete_queue2(queue_code)


@app.post("/database/admin/add_admin", status_code=201)
def add_admin1(new_admin: Admin, status_code=201):
    return adminHandler().add_admin2(new_admin)

@app.post("/database/admin/verify_admin", status_code=201)
def verify_admin1(
    email: str = Body(...),
    password: str = Body(...), status_code=201
):
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


@app.post("/database/staff/add_staff", status_code=201)
def add_staff1(new_Staff: Staff, status_code=201):
    return staffHandler().add_staff2(new_Staff)

@app.post("/database/staff/verify_staff", status_code=201)
def verify_staff1(
    email: str = Body(...),
    password: str = Body(...), status_code=201
):
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
################################################ LOG IN / OUT ####################################################################

@app.post("/auth/login")
def login1(
    request: Request,
    email: str = Body(...),
    password: str = Body(...),
):
    account = adminHandler().get_admin2(email, password)

    if account is None:
        account = staffHandler().get_staff2(email, password)

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Remember the verified account for later requests.
    request.session.clear()
    request.session["account"] = account
    return account


@app.get("/auth/get_current_account")
def get_current_account1(request: Request):
    account = request.session.get("account")

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Not logged in."
        )
    return account


@app.post("/auth/logout")
def logout1(request: Request):
    request.session.clear()
    return {"message": "Logged out."}
