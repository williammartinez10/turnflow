from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from backend.REST_API.DAO.queue_DAO import queueDAO, Queue
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
  status: Optional[str] = None

class customerDAO:
  def __init__(self):
      self.pool = SimpleConnectionPool(
          POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
      )

  def has_active_ticket3(self, queue_code: str, phone_number: str):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT customer.customer_id
      FROM customer
      JOIN queue ON customer.queue_id = queue.queue_id
      WHERE queue.queue_code = %s
      AND customer.phone_number = %s
      AND customer.status IN ('waiting', 'called', 'skipped')
      LIMIT 1
      """
      # Check for an active ticket with this phone number in the same queue.
      cur.execute(query, (queue_code, phone_number))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      return cashe is not None

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
      ON CONFLICT (queue_id, phone_number)
      WHERE status IN ('waiting', 'called', 'skipped')
      DO NOTHING
      RETURNING customer_id, time, status
      """
      #set up query to make call to database
      cur.execute(query, (ticket_id, new_customer.phone_number, queue_id))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      # Handle a duplicate blocked by the database during simultaneous requests.
      if cashe is None:
          raise HTTPException(
              status_code=409,
              detail="You already have an active ticket in this queue. Use Find My Ticket to view it."
          )
      new_customer.ticket_id = ticket_id
      new_customer.customer_id = cashe[0]
      new_customer.time = cashe[1]
      new_customer.status = cashe[2]
      if customerDAO.get_next_customer3(queue_id).customer_id == new_customer.customer_id:
         customerDAO.set_next_customer3(new_customer.customer.id)
      #store and return entry just created in database
      return new_customer

  def get_ticket3(self, queue_code: str, ticket_number: int):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT customer.ticket_id AS ticket_number,
      queue.queue_code,
      queue.service,
      customer.status,
      admin.organization_name
      FROM customer
      JOIN queue ON customer.queue_id = queue.queue_id
      LEFT JOIN admin ON queue.admin_id = admin.admin_id
      WHERE queue.queue_code = %s
      AND customer.ticket_id = %s
      """
      #set up query to make call to database
      cur.execute(query, (queue_code, ticket_number))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
          raise HTTPException(status_code=404, detail="ticket missing")
      return dict(cashe)
      #return the matching ticket without customer contact information

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
      #return customers from the specified queue, or an empty list

  def pop_customer3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      cashe: Customer
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM customer
      WHERE customer_id = (
        SELECT customer_id FROM customer
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
      retired_customer = Customer(
          customer_id=cashe["customer_id"],
          ticket_id=cashe["ticket_id"],
          phone_number=cashe["phone_number"],
          queue_code=queue_code,
          time=cashe["time"],
          status=cashe["status"]
      )
      next_customer = customerDAO.get_next_customer3(queue_code).customer_id
      queueDAO.update_wait_time(next_customer.time - datetime.datetime.now(), next_customer.queue_code)
      customerDAO.set_next_customer3(next_customer.customer_id)
      return retired_customer
      #return the customer removed from the specified queue

  def get_next_customer3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      cashe: Customer
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT customer_id, queue_id
      FROM customer
      WHERE customer_id = (
        SELECT customer_id FROM customer
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
      next_customer = Customer(
          customer_id=cashe["customer_id"],
          queue_code=queue_code,
      )
      return next_customer

  def set_next_customer3(self, next_customer: int):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO next_customer
        (next_customer, time)
        VALUES (%s, NOW())
      ON CONFLICT (next_customer)
        WHERE next_customer
      DO UPDATE SET 
        next_customer = EXCLUDED.next_customer
        time = NOW()
      RETURNING customer_id, time
      """
      #set up query to make call to database
      cur.execute(query, (next_customer.phone_number,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      next_customer = Customer(
          customer_id=cashe["customer_id"],
          time=cashe["time"]
      )
      #store and return entry just created in database
      return next_customer

  def get_time_remaning3(self, phone_number: str, queue_code: str):
    item_list_integer: list[int]
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT item_list_integer FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    item_list_integer = cur.fetchone().item_list_integer
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    if item_list_integer == None:
      raise HTTPException(status_code=404, detail="queue missing")

    customer_list: list[Customer]
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM customer
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    customer_list = cur.fetchone().item_list_integer
    conn.commit()
    cur.close()
    if customer_list == None:
      raise HTTPException(status_code=404, detail="queue empty")

    average_count = 0
    item_list_sum = 0
    for time_waited in item_list_integer:
       average_count += 1
       item_list_sum += time_waited
    average_wait_time = time_waited / average_count
       
    customer_count = 0

    while(customer_list[customer_count].phone_number != phone_number):
       customer_count+=1
    return customer_count * average_wait_timea