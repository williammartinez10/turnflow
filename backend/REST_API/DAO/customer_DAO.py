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
      #store and return entry just created in database
      return new_customer

  def get_ticket3(self, queue_code: str, ticket_number: int):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT
          customer.ticket_id AS ticket_number,
          queue.queue_code,
          service.service_name AS service,
          customer.status,
          admin.organization_name
      FROM customer
               JOIN queue
                    ON customer.queue_id = queue.queue_id
               JOIN service
                    ON queue.service_id = service.service_id
               LEFT JOIN admin
                         ON queue.admin_id = admin.admin_id
      WHERE queue.queue_code = %s
        AND customer.ticket_id = %s \
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
      queue_id = queueDAO().get_withcode_queue3(queue_code)
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
              RETURNING * \
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
          called_time=cashe["called_time"],
          status=cashe["status"]
      )
      return retired_customer
      #return the customer removed from the specified queue

  def complete_customer3(self, queue_code: str, ticket_id: int):
      queue_id = queueDAO().get_withcode_queue3(queue_code)

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