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