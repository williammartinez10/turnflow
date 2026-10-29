from backend.REST_API.DAO.queue_DAO import queueDAO, Queue
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

    # Use the signed-in Admin instead of an ID supplied in the request.
    new_queue.admin_id = account["admin_id"]
    new_queue.organization_name = None

    # Validate required fields explicitly
    # if not new_queue.queue_code:
    #   raise HTTPException(status_code=401, detail="queue_code is required")
    # if queueDAO().check_withcode_queue3(new_queue.queue_code) != None:
    #   raise HTTPException(status_code=401, detail="queue_code in use")

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

  def get_queue_list2(self):
    return queueDAO().get_queue_list3()

  def get_withcode_queue2(self, queue_code: str):
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