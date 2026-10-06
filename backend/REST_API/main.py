from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.REST_API.handler.customer_handler import customerHandler
from backend.REST_API.DAO.customer_DAO import (
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

@app.post("/database/customer/add_customer")  # initialize code and route for defined instruction
async def add_customer1(
    new_customer: Customer, status_code=201
):  # define expected fields in json file
    return customerHandler().add_customer2(new_customer)
    # call customerHandler with associated instruction and return the customer we just obtained

@app.get("/database/customer/get_customer_{customer}")
async def list_customers1(customer: str):
    return customerHandler().list_customers2(customer)
    #return list of customers from specified customer

@app.delete("/database/customer/pop_customer_from_{customer}")
async def pop_customer(customer: str):
    return customerHandler().pop_customer2(customer)