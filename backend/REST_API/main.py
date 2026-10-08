from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.REST_API.handler.customer_handler import customerHandler
from backend.REST_API.DAO.customer_DAO import (
    Customer,
)

from backend.REST_API.handler.queue_handler import queueHandler
from backend.REST_API.DAO.queue_DAO import (
    Queue,
)

#from backend.REST_API.handler.admin_handler import adminHandler
#from backend.REST_API.DAO.admin_DAO import (
#    Admin,
#)

#from backend.REST_API.handler.staff_handler import staffHandler
#from backend.REST_API.DAO.staff_DAO import (
#    Staff,
#)

#from backend.REST_API.handler.staff_privilage_handler import staffHandler
#from backend.REST_API.DAO.staff_privilage_DAO import (
#    Staff_Privilege,
#)

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/database/customer/add_customer")  # initialize code and route for defined instruction
async def add_customer1(new_customer: Customer, status_code=201):
    return customerHandler().add_customer2(new_customer)
    # call customerHandler with associated instruction and return the customer we just obtained
    # adds customer with defined properties
@app.get("/database/customer/get_queue_{queue_code}")
async def list_customers1(queue_code: str):
    return customerHandler().list_customers2(queue_code)
    # return list of customers from specified queue with queue_code
@app.delete("/database/customer/pop_customer_from_{queue_code}")
async def pop_customer(queue_code: str):
    return customerHandler().pop_customer2(queue_code)
    # remove oldest customer from queue

@app.post("/database/queue/add_queue")
async def add_queue1(new_queue: Queue, status_code=201):
    return queueHandler().add_queue2(new_queue)
    # add new queue
@app.get("/database/queue/get_queue_list")
async def get_queue_list1(status_code=201):
    return queueHandler().get_queue_list2()
    # get list of queues defined with their queue code

@app.get("/database/queue/get_withcode_queue_{queue_code}")
async def get_queue1(queue_code: str):
    return customerHandler().get_queue2(queue_code)
    # return queue ID if it exists


#@app.post("/database/admin/add_admin")
#async def add_admin1(new_admin: Admin, status_code=201):
#    return adminHandler().add_admin2(new_admin)
#    # add new admin
#@app.get("/database/admin/get_admin")
#async def get_admin1(new_admin: Admin, status_code=201):
#    return adminHandler().get_admin2(new_admin)
#    # get existing admin
#@app.get("/database/admin/delete_admin")
#async def delete_admin1(new_admin: Admin, status_code=201):
#    return adminHandler().delete_admin2(new_admin)
#    # delete admin

#@app.post("/database/staff/add_staff")
#async def add_staff1(new_Staff: Staff, status_code=201):
#    return adminHandler().add_staff2(new_Staff)
#    # add staff member
#@app.get("/database/staff/get_staff")
#async def get_staff1(new_Staff: Staff, status_code=201):
#    return adminHandler().get_staff2(new_Staff)
#    # get existing staff member
#@app.get("/database/staff/delete_staff")
#async def delete_staff1(new_Staff: Staff, status_code=201):
#    return adminHandler().delete_staff2(new_Staff)
#    # delete staff member

#@app.get("/database/staff_privilege/add_staff_privilage")
#async def add_staff_privilege1(new_staff_privilage: Staff_Privilage, status_code=201):
#    return adminHandler().add_staff_privilage2(new_Staff_privilage)
#    # add new staff privilage