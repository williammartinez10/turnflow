from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Staff_Privilege(BaseModel):
  staff_priv_id: Optional[int] = None
  staff_privilege: Optional[str] = None
  staff_with_priv: Optional[str] = None

class staff_privilegeDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
        POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_staff_privilege3(self, new_staff_privilege: Staff_Privilege):
      new_staff_privilege.staff_with_priv = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO staff_privilege
      (staff_privilege, staff_with_priv)
      VALUES (%s, %s)
      RETURNING staff_priv_id
      """
      #set up query to make call to database
      cur.execute(query, (new_staff_privilege.staff_privilege, new_staff_privilege.staff_with_priv))
      cashe = cur.fetchone()
      new_staff_privilege.queue_id = cashe[0]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_staff_privilege

  def get_staff_privilege_list3(self):
      queue_list: list[Staff_Privilege] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM staff_privilege
      """
      #set up query to make call to database
      cur.execute(query)
      for row in cur:
        queue_list.append(Staff_Privilege(**row))
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if queue_list == []:
         raise HTTPException(status_code=404, detail="empty staff_privilege table")
      return queue_list
      #return list of queues, unless it's empty in which case an error is returned

  def get_staff_privilege_list3(self, staff_privilege: str):
      cashe: Staff_Privilege
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM staff_privilege
      WHERE staff_privilege = %s
      """
      #set up query to make call to database
      cur.execute(query, (staff_privilege,))
      cashe = cur.fetchone()
      if cashe == None:
        raise HTTPException(status_code=404, detail="staff_privilege missing")
      return cashe[0]

  def delete_staff_privilege_staff3(self, queue_code: str):
      cashe: Staff_Privilege
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
      retired_queue = Staff_Privilege(ticket_id=cashe[0], phone_number=cashe[1], queue_code=queue_code, time=cashe[3])
      return retired_queue
      #return deleted queue, unless it's empty in which case an error is returned