from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Customer(BaseModel):
  ticket_id: Optional[int] = None
  phone_number: Optional[str] = None
  queue_code: Optional[str] = None
  time: Optional[datetime.datetime | str] = None

class QueueDAO:
  def __init__(self):
      self.pool = SimpleConnectionPool(
          POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
      )
  def add_customer3(self, new_customer: Customer):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      #the rest is history lol
      query = """
      INSERT INTO queue
      (phone_number, queue_code, time)
      VALUES (%s, %s, NOW())
      RETURNING ticket_id, time
      """
      cur.execute(query, (new_customer.phone_number, new_customer.queue_code))
      cashe = cur.fetchone()
      new_customer.ticket_id = cashe[0]
      new_customer.time = cashe[1]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      return new_customer