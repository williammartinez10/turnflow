from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from backend.REST_API.DAO.queue_DAO import queueDAO
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Customer(BaseModel):
  customer_id: Optional[int] = None 
  ticket_id: Optional[int] = None
  phone_number: Optional[str] = None
  queue_code: Optional[str] = None
  time: Optional[datetime.datetime | str] = None

class customerDAO:
  def __init__(self):
      self.pool = SimpleConnectionPool(
          POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
      )
  def add_customer3(self, new_customer: Customer):
      ticket_id = customerDAO().list_customers3(new_customer.queue_code)
      if ticket_id == []:
         ticket_id = 1
      else:
        ticket_id = ticket_id[0].ticket_id+1
      queue_id = queueDAO().get_withcode_queue3(new_customer.queue_code)
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO customer
      (ticket_id, phone_number, queue_id, time)
      VALUES (%s, %s, %s, NOW())
      RETURNING customer_id, time
      """
      #set up query to make call to database
      cur.execute(query, (ticket_id, new_customer.phone_number, queue_id))
      cashe = cur.fetchone()
      new_customer.ticket_id = ticket_id
      new_customer.customer_id = cashe[0]
      new_customer.time = cashe[1]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_customer

  def list_customers3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      customer_list: list[Customer] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM customer
      WHERE queue_id = %s
      ORDER BY ticket_id DESC
      """
      #set up query to make call to database
      cur.execute(query, (queue_id,))
      count = 0
      for row in cur:
        customer_list.append(Customer(**row))
        customer_list[count].queue_code = queue_code
        count+=1
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      return customer_list
      #return list of customers from the specified queue, unless it's empty in which case an error is returned

  def pop_customer3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      cashe: Customer
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM customer
      WHERE ticket_id = (
        SELECT ticket_id FROM customer
        WHERE queue_id = %s
        ORDER BY ticket_id
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
      retired_customer = Customer(ticket_id=cashe[0], phone_number=cashe[1], queue_code=queue_code, time=cashe[3])
      return retired_customer
      #return list of customers from the specified queue, unless it's empty in which case an error is returned