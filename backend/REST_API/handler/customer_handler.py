from backend.REST_API.DAO.customer_DAO import customerDAO, Customer
from backend.REST_API.DAO.queue_DAO import queueDAO
from fastapi import HTTPException
from backend.REST_API.DAO.staff_privilege_DAO import staff_privilegeDAO

class customerHandler:
  def add_customer2(self, new_customer: Customer):
    # Validate required fields explicitly
    if not new_customer.phone_number:
      raise HTTPException(status_code=401, detail="phone_number is required")
    if not new_customer.queue_code:
      raise HTTPException(status_code=401, detail="queue_code is required")
    queueDAO().get_withcode_queue3(new_customer.queue_code)
    
    if len(new_customer.phone_number) < 12 or len(new_customer.phone_number) > 12:
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if new_customer.phone_number[3] != "-" or new_customer.phone_number[7] != "-":
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if not new_customer.phone_number[0:3].isdigit() or not new_customer.phone_number[4:7].isdigit() or not new_customer.phone_number[8:12].isdigit():
      raise HTTPException(status_code=401, detail="invalid phone number")

    dao = customerDAO()

    # Prevent another active ticket for the same phone number in this queue.
    if dao.has_active_ticket3(new_customer.queue_code, new_customer.phone_number):
      raise HTTPException(
        status_code=409,
        detail="You already have an active ticket in this queue. Please use Find My Ticket to view it."
      )

    return dao.add_customer3(new_customer)

  def get_ticket2(self, queue_code: str, ticket_number: int):
      return customerDAO().get_ticket3(queue_code, ticket_number)

  def list_customers2(self, queue_code: str, account: dict | None):
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "staff" and account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Staff or admin access required.")

    if account.get("role" != "admin"):
      staff_with_priv = staff_privilegeDAO().get_with_staff_privilege_staff_list3(queue_code)

      if account["full_name"] not in staff_with_priv and account.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Staff missing privileges.")
    return customerDAO().list_customers3(queue_code)

  # ===== Dashboard Statistics =====

  # Returns the number of active customers waiting in this admin's queues.
  def count_waiting_customers2(self, admin_id: int):
    return customerDAO().count_waiting_customers3(admin_id)

  # ===== End Dashboard Statistics =====

  def pop_customer2(self, queue_code: str, account: dict | None):
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "staff" and account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Staff or admin access required.")

    if account.get("role" != "admin"):
      staff_with_priv = staff_privilegeDAO().get_with_staff_privilege_staff_list3(queue_code)

      if account["full_name"] not in staff_with_priv and account.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Staff missing privileges.")
    return customerDAO().pop_customer3(queue_code)

#  def pop_customer2(self, queue_code: str, account: dict | None):
#    if account is None:
#      raise HTTPException(status_code=401, detail="Not logged in.")
#
#    if account.get("role") != "staff" and account.get("role") != "admin":
#      raise HTTPException(status_code=403, detail="Staff or admin access required.")
#
#    staff_with_priv = staff_privilegeDAO().get_with_staff_privilege_staff_list3(queue_code)
#
#    if account["full_name"] not in staff_with_priv and account.get("role") != "admin":
#      raise HTTPException(status_code=403, detail="Staff missing privileges.")
#    result = customerDAO().pop_customer3(queue_code)
#    return {
#      "message": "Customer from queue " + queue_code + " successfully popped from queue",
#      "customer": result
#      }
# commented out for future storage

  def complete_customer2(self, queue_code: str, ticket_id: int):
    return customerDAO().complete_customer3(
      queue_code,
      ticket_id
    )
  
  def get_time_remaning2(self, phone_number: str, queue_code: str):
    if not phone_number:
      raise HTTPException(status_code=401, detail="phone_number is required")
    if not queue_code:
      raise HTTPException(status_code=401, detail="queue_code is required")

    if len(phone_number) < 12 or len(phone_number) > 12:
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if phone_number[3] != "-" or phone_number[7] != "-":
      raise HTTPException(status_code=401, detail="invalid phone number")
    
    if not phone_number[0:3].isdigit() or not phone_number[4:7].isdigit() or not phone_number[8:12].isdigit():
      raise HTTPException(status_code=401, detail="invalid phone number")

    return customerDAO().get_time_remaning3(phone_number, queue_code)
