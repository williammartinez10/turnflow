from backend.REST_API.DAO.queue_DAO import queueDAO, Queue

from backend.REST_API.DAO.staff_privilege_DAO import staff_privilegeDAO

from fastapi import HTTPException
import random
import string

class queueHandler:

  # Generates a queue code in the format ABC-123-45.
  def generate_queue_code(self):
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    numbers1 = "".join(random.choices(string.digits, k=3))
    numbers2 = "".join(random.choices(string.digits, k=2))

    return f"{letters}-{numbers1}-{numbers2}"

  def add_queue2(self, new_queue: Queue, account: dict | None):
    # Require an Admin session before creating a queue.
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Admin access required.")

    # Derive ownership and organization from the signed-in Admin.
    new_queue.admin_id = account["admin_id"]
    new_queue.organization_name = account.get("organization_name")

    # New queues have no recorded service times yet.
    new_queue.time_list = []

    # Generate a unique queue code.
    queue_code = self.generate_queue_code()

    while queueDAO().check_withcode_queue3(queue_code) is not None:
      queue_code = self.generate_queue_code()

    new_queue.queue_code = queue_code

    if new_queue.service_id is None:
      raise HTTPException(
        status_code=400,
        detail="A service is required"
      )
    return queueDAO().add_queue3(new_queue)

  def get_queue_list2(self, account: dict | None):
    if account is None:
      raise HTTPException(
        status_code=401,
        detail="Not logged in."
      )

    if account.get("role") != "admin":
      raise HTTPException(
        status_code=403,
        detail="Admin access required."
      )

    return queueDAO().get_queue_list3(
      account["admin_id"]
    )

  def get_withcode_queue2(self, queue_code: str, account: dict | None):
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "staff" and account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Staff or admin access required.")

    if account.get("role") != "admin":
      staff_with_priv = staff_privilegeDAO().get_with_staff_privilege_staff_list3(queue_code)
      if account["full_name"] not in staff_with_priv and account.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Staff missing privileges.")

    return queueDAO().get_withcode_queue3(queue_code)

  def get_active_withcode_queue2(self, queue_code: str):
    return queueDAO().get_active_withcode_queue3(queue_code)

  def delete_queue2(self, queue_code: str, account: dict | None):
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Admin access required.")

    result = queueDAO().delete_queue3(
      queue_code,
      account["admin_id"]
    )

    return {
      "message": "Queue " + queue_code + " successfully deleted",
      "queue": result
    }

  # ===== Dashboard Statistics =====

  # Returns the number of active queues owned by this admin.
  def count_active_queues2(self, admin_id: int):
    return queueDAO().count_active_queues3(admin_id)

  # ===== End Dashboard Statistics =====

  # ===== Queue Editing =====

  def update_queue2(self, updated_queue: Queue, account: dict | None):
    # Require an Admin session.
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Admin access required.")

    # Use the logged-in admin instead of trusting admin_id from the frontend.
    updated_queue.admin_id = account["admin_id"]

    if not updated_queue.queue_code:
      raise HTTPException(status_code=400, detail="queue_code is required")

    if not updated_queue.queue_name:
      raise HTTPException(status_code=400, detail="queue_name is required")

    if updated_queue.service_id is None:
      raise HTTPException(
        status_code=400,
        detail="A service is required"
      )

    return queueDAO().update_queue3(updated_queue)

  # ===== End Queue Editing =====

  def set_queue_active2(
          self,
          queue_code: str,
          make_active: bool,
          account: dict | None
  ):
    if account is None:
      raise HTTPException(status_code=401, detail="Not logged in.")

    if account.get("role") != "admin":
      raise HTTPException(status_code=403, detail="Admin access required.")

    return queueDAO().set_queue_active3(
      queue_code,
      account["admin_id"],
      make_active
    )