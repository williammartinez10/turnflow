from backend.REST_API.DAO.queue_DAO import QueueDAO, Customer
from fastapi import HTTPException

class QueueHandler:
  def add_customer2(self, new_customer: Customer):
    # Validate required fields explicitly
    if not new_customer.phone_number:
      raise HTTPException(status_code=401, detail="phone_number is required")
    if not new_customer.queue_code:
      raise HTTPException(status_code=401, detail="queue_code is required")
    
    if len(new_customer.phone_number) < 12 or len(new_customer.phone_number) > 12:
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if new_customer.phone_number[3] != "-" or new_customer.phone_number[7] != "-":
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if not new_customer.phone_number[0:3].isdigit() or not new_customer.phone_number[4:7].isdigit()  or not new_customer.phone_number[8:12].isdigit():
      raise HTTPException(status_code=401, detail="invalid phone number")
    return QueueDAO().add_customer3(new_customer)

  def list_customers2(self, queue: str):
      return QueueDAO().list_customers3(queue)

  def pop_customer2(self, queue: str):
    result = QueueDAO().pop_customer3(queue)
    return {
      "message": "Customer from queue " + queue + " successfully popped from queue",
      "customer": result
      }