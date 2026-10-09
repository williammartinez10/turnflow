from backend.REST_API.DAO.queue_DAO import queueDAO, Queue
from fastapi import HTTPException

class staffHandler:
  def add_queue2(self, new_queue: Queue):
    # Validate required fields explicitly
    if not new_queue.queue_code:
      raise HTTPException(status_code=401, detail="queue_code is required")
    return queueDAO().add_queue3(new_queue)