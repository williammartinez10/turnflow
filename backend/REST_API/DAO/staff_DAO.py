from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from backend.REST_API.DAO.queue_DAO import queueDAO
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Staff(BaseModel):
  staff_id: Optional[int] = None
  email: Optional[str] = None
  password: Optional[str] = None

class staffDAO:
  def add_customer3(self, new_staff: Staff):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO staff
      (email, password)
      VALUES (%s, %s)
      RETURNING staff_id, time
      """
      #set up query to make call to database
      cur.execute(query, (new_staff.email, new_staff.password))
      cashe = cur.fetchone()
      new_staff.staff_id = cashe[0]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_staff

  def get_staff3(self, staff: Staff):
    cashe: Staff
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM staff
    WHERE email = %s
    AND password = %s
    """
    #set up query to make call to database
    cur.execute(query, (staff.email, staff.password))
    cashe = cur.fetchone()
    if cashe == None:
      raise HTTPException(status_code=404, detail="staff missing")
    return cashe[0]

  def delete_staff3(self, staff: Staff):
      cashe: Staff
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM staff
      WHERE staff_id = (
        SELECT staff_id FROM staff
        WHERE staff_id = %s
        LIMIT 1
      )
      RETURNING *
      """
      #set up query to make call to database
      cur.execute(query, (staff.staff_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
         raise HTTPException(status_code=404, detail="staff missing")
      retired_staff = Staff(staff_id=cashe[0], email=cashe[1], password=cashe[2])
      return retired_staff
      #return deleted staff, unless it's empty in which case an error is returned