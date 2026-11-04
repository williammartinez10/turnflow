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
  time: Optional[datetime.datetime] = None
  called_time: Optional[datetime.datetime] = None
  completed_time: Optional[datetime.datetime] = None
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
      queue = queueDAO().get_active_withcode_queue3(new_customer.queue_code)
      queue_id = queue.queue_id
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
      if customerDAO().get_next_customer3(new_customer.queue_code).customer_id == new_customer.customer_id:
         customerDAO().set_next_customer3(new_customer.customer_id, new_customer.queue_code)
      #store and return entry just created in database
      return new_customer

  def get_ticket3(self, queue_code: str, ticket_number: int):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT
          customer.ticket_id AS ticket_number,
          queue.queue_code,
          queue.queue_name,
          service.service_name AS service,
          customer.status,
          admin.organization_name,
          CASE
              WHEN customer.status = 'waiting'
              THEN (
                  SELECT COUNT(*)
                  FROM customer AS ahead
                  WHERE ahead.queue_id = customer.queue_id
                  AND ahead.status = 'waiting'
                  AND ahead.ticket_id < customer.ticket_id
              )
              ELSE NULL
          END AS people_ahead,
          ARRAY(
              SELECT serving.ticket_id
              FROM customer AS serving
              WHERE serving.queue_id = customer.queue_id
              AND serving.status = 'called'
              ORDER BY serving.ticket_id
          ) AS now_serving
      FROM customer
      JOIN queue ON customer.queue_id = queue.queue_id
      JOIN service ON queue.service_id = service.service_id
      LEFT JOIN admin ON queue.admin_id = admin.admin_id
      WHERE queue.queue_code = %s
      AND customer.ticket_id = %s
      """
      # Retrieve the ticket and Queue statistics without Customer contact information.
      cur.execute(query, (queue_code, ticket_number))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if cashe == None:
          raise HTTPException(status_code=404, detail="ticket missing")

      ticket = dict(cashe)

      # Position 1 identifies the next eligible waiting Customer.
      # Customers with another status do not have a waiting position.
      if ticket["status"] == "waiting":
          ticket["position"] = ticket["people_ahead"] + 1
      else:
          ticket["position"] = None

      return ticket
      #return the matching ticket with its Queue information and current statistics

  def list_customers3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
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

  # ===== Dashboard Statistics =====

  # Counts all customers with an active ticket in queues owned by the admin.
  def count_waiting_customers3(self, admin_id: int):
      conn = self.pool.getconn()
      cur = conn.cursor()

      query = """
              SELECT COUNT(*)
              FROM customer
                       JOIN queue ON customer.queue_id = queue.queue_id
              WHERE queue.admin_id = %s
                AND customer.status IN ('waiting', 'called', 'skipped') \
              """

      cur.execute(query, (admin_id,))
      count = cur.fetchone()[0]

      cur.close()
      self.pool.putconn(conn)

      return count

  # ===== End Dashboard Statistics =====


  def pop_customer3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
      cashe: Customer
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
              UPDATE customer
              SET
                  status = 'called',
                  called_time = NOW()
              WHERE customer_id = (
                  SELECT customer_id
                  FROM customer
                  WHERE queue_id = %s
                    AND status = 'waiting'
                  ORDER BY ticket_id
                  LIMIT 1
              )
              RETURNING *
              """
#      DELETE FROM next_customer
#      WHERE next_customer_id = (
#        SELECT next_customer_id FROM next_customer
#        WHERE queue_id = %s
#      )
#      """
#      #set up query to make call to database
#      cur.execute(query, (queue_id,))
#      query = """
#      DELETE FROM customer
#      WHERE customer_id = (
#        SELECT customer_id FROM customer
#        WHERE queue_id = %s
#        ORDER BY ticket_id
#        LIMIT 1
#      )
#      RETURNING *
#      """ old pop_customer code, under verification
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
          called_time=cashe["called_time"],
          status=cashe["status"]
      )
      next_customer = customerDAO().get_next_customer3(queue_code)
      if next_customer != None:
        queueDAO().update_wait_time(datetime.datetime.now(datetime.timezone.utc) - next_customer.time, next_customer.queue_code)
        customerDAO().set_next_customer3(next_customer.customer_id, next_customer.queue_code)
      return retired_customer
      #return the customer removed from the specified queue

  def complete_customer3(self, queue_code: str, ticket_id: int):
      queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id

      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)

      query = """
              UPDATE customer
              SET
                  status = 'completed',
                  completed_time = NOW()
              WHERE queue_id = %s
                AND ticket_id = %s
                AND status = 'called'
              RETURNING * \
              """

      cur.execute(query, (queue_id, ticket_id))
      cashe = cur.fetchone()

      if cashe is not None:
          cur.execute(
              """
              SELECT COUNT(*)
              FROM customer
              WHERE queue_id = %s
                AND status IN ('waiting', 'called', 'skipped')
              """,
              (queue_id,)
          )

          active_tickets = cur.fetchone()[0]

          if active_tickets == 0:
              cur.execute(
                  """
                  UPDATE queue
                  SET
                      active = FALSE,
                      pending_disable = FALSE
                  WHERE queue_id = %s
                    AND pending_disable = TRUE
                  """,
                  (queue_id,)
              )

      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if cashe is None:
          raise HTTPException(
              status_code=404,
              detail="Called customer not found."
          )

      return Customer(**cashe)

  def get_next_customer3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
      cashe: Customer
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT customer_id, queue_id, time
      FROM customer
      WHERE customer_id = (
        SELECT customer_id FROM customer
        WHERE queue_id = %s
        ORDER BY ticket_id
        LIMIT 1
      )
      """
      #set up query to make call to database
      cur.execute(query, (queue_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
         return None
      next_customer = Customer(
          customer_id=cashe["customer_id"],
          time=cashe["time"],
          queue_code=queue_code,
      )
      return next_customer

  def set_next_customer3(self, next_customer: int, queue_code):
      queue_id = queueDAO().get_withcode_queue3(queue_code).queue_id
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO next_customer
        (next_customer_id, queue_id, time)
        VALUES (%s, %s, NOW())
      ON CONFLICT (next_customer_id)
        WHERE next_customer
      DO UPDATE SET 
        next_customer_id = EXCLUDED.next_customer_id,
        queue_id = EXCLUDED.queue_id,
        time = NOW()
      RETURNING next_customer_id, queue_id, time
      """
      #set up query to make call to database
      cur.execute(query, (next_customer, queue_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      next_customer = Customer(
          next_customer_id=cashe["next_customer_id"],
          queue_id =["queue_id"],
          time=cashe["time"]
      )
      #store and return entry just created in database
      return next_customer

  def get_time_remaning3(self, phone_number: str, queue_code: str):
    time_list: list[int]
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT time_list FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()
    if cashe == None:
      raise HTTPException(status_code=404, detail="queue missing")
    time_list = cashe["time_list"]
    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    queue = queueDAO().get_active_withcode_queue3(queue_code)
    queue_id = queue.queue_id
    customer_list: list[Customer]
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM customer
    WHERE queue_id = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_id,))
    customer_list = cur.fetchall()
    conn.commit()
    cur.close()
    if customer_list == []:
      raise HTTPException(status_code=404, detail="queue empty")

    average_count = 0
    item_list_sum = datetime.timedelta(0)
    for time_waited in time_list:
       average_count += 1
       item_list_sum = item_list_sum + time_waited
    average_wait_time = time_waited / average_count
       
    customer_count = 0

    while True:
        customer_count += 1
        if customer_list[customer_count-1]["phone_number"] == phone_number:
            break
    return customer_count * average_wait_time