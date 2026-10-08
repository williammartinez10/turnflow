from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Queue(BaseModel):
  queue_id: Optional[int] = None
  queue_code: Optional[str] = None

class queueDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
        POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_queue3(self, new_queue: Queue):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO queue
      (queue_code)
      VALUES (%s)
      RETURNING queue_id
      """
      #set up query to make call to database
      cur.execute(query, (new_queue.queue_code,))
      cashe = cur.fetchone()
      new_queue.queue_id = cashe[0]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_queue
  
  def get_withcode_queue3(self, queue_code: str):
    cashe: Queue
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()
    if cashe == None:
      raise HTTPException(status_code=404, detail="queue missing")
    return cashe[0]

  def get_queue_list3(self):
      queue_list: list[Queue] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM queue
      """
      #set up query to make call to database
      cur.execute(query)
      for row in cur:
        queue_list.append(Queue(**row))
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if queue_list == []:
         raise HTTPException(status_code=404, detail="queue missing")
      return queue_list
      #return list of customers from the specified queue, unless it's empty in which case an error is returned