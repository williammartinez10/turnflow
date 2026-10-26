from backend.REST_API.DAO.queue_DAO import queueDAO, Queue
from fastapi import HTTPException

class queueHandler:
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
    if not new_queue.queue_code:
      raise HTTPException(status_code=401, detail="queue_code is required")
    if queueDAO().check_withcode_queue3(new_queue.queue_code) != None:
      raise HTTPException(status_code=401, detail="queue_code in use")
    if not new_queue.service:
      raise HTTPException(status_code=401, detail="service is required")
    return queueDAO().add_queue3(new_queue)

  def get_queue_list2(self):
    return queueDAO().get_queue_list3()

  def get_withcode_queue2(self, queue_code: str):
    return queueDAO().get_withcode_queue3(queue_code)

  def delete_queue2(self, queue_code: str):
    result = queueDAO().delete_queue3(queue_code)
    return {
      "message": "Queue" + queue_code + " successfully deleted",
      "queue": result
      }