from backend.REST_API.DAO.queue_DAO import QueueDAO, Customer
from fastapi import HTTPException

class QueueHandler:
  def add_customer2(self, new_customer: Customer):
    # Validate required fields explicitly
    if not new_customer.phone_number:
            raise HTTPException(status_code=400, detail="phone_number is required")
    if not new_customer.queue_code:
            raise HTTPException(status_code=400, detail="queue_code is required")
    dao = QueueDAO()
    return dao.add_customer3(new_customer)