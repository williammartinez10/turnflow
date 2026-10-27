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
  service: Optional[str] = None
  admin_id: Optional[int] = None
  organization_name: Optional[str] = None
  time_list: Optional[list[datetime.timedelta]] = None

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
      (queue_code, service, admin_id, time_list)
      VALUES (%s, %s, %s, %s)
      RETURNING queue_id
      """
      #set up query to make call to database
      cur.execute(query, (
          new_queue.queue_code,
          new_queue.service,
          new_queue.admin_id,
          new_queue.time_list
      ))
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
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    if cashe == None:
      raise HTTPException(status_code=404, detail="queue missing")
    return cashe[0]

  def check_withcode_queue3(self, queue_code: str):
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
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    if cashe == None:
       return cashe
    return cashe[0]

  def get_queue_list3(self):
      queue_list: list[Queue] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT queue.queue_id,
      queue.queue_code,
      queue.service,
      admin.organization_name
      FROM queue
      LEFT JOIN admin ON queue.admin_id = admin.admin_id
      """
      #set up query to make call to database
      cur.execute(query)
      for row in cur:
        queue_list.append(Queue(**row))
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if queue_list == []:
         raise HTTPException(status_code=404, detail="empty queue table")
      return queue_list
      #return list of queues, unless it's empty in which case an error is returned

  def delete_queue3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      cashe: Queue
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM queue
      WHERE queue_id = (
        SELECT queue_id FROM queue
        WHERE queue_id = %s
        ORDER BY queue_id
        LIMIT 1
      )
      RETURNING *
      """
      #set up query to make call to database
      cur.execute(query, (queue_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
         raise HTTPException(status_code=404, detail="queue missing or empty")
      retired_queue = Queue(**cashe)
      return retired_queue
      #return deleted queue, unless it's empty in which case an error is returned

  def update_wait_time(self, new_wait_time: datetime.datetime, queue_code: str):
      
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      UPDATE queue SET
        time_list = array_append(queue.time_list, %s)
        WHERE queue_code = %s
      RETURNING time_list
      """
      #set up query to make call to database
      cur.execute(query, (
          new_wait_time,
          queue_code,
      ))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database