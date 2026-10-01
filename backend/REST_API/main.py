from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.REST_API.handler.queue_handler import QueueHandler
from backend.REST_API.DAO.queue_DAO import (
    Customer,
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

@app.post("/database/queue/add_customer")  # initialize code and route for defined instruction
async def add_customer1(
    new_customer: Customer, status_code=201
):  # define expected fields in json file
    return QueueHandler().add_customer2(new_customer)
    # call queueHandler with associated instruction and return the customer we just obtained