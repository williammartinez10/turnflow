from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from backend.REST_API.DAO.queue_DAO import queueDAO
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

class Admin(BaseModel):
  admin_id: Optional[int] = None
  email: Optional[str] = None
  password: Optional[str] = None

class adminDAO:
  def add_customer3(self, new_admin: Admin):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO admin
      (email, password)
      VALUES (%s, %s)
      RETURNING staff_id, time
      """
      #set up query to make call to database
      cur.execute(query, (new_admin.email, new_admin.password))
      cashe = cur.fetchone()
      new_admin.admin_id = cashe[0]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_admin

  def get_admin3(self, admin: Admin):
    cashe: Admin
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM admin
    WHERE email = %s
    AND password = %s
    """
    #set up query to make call to database
    cur.execute(query, (admin.email, admin.password))
    cashe = cur.fetchone()
    if cashe == None:
      raise HTTPException(status_code=404, detail="admin missing")
    return cashe[0]

  def delete_admin3(self, admin: Admin):
      cashe: Admin
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM admin
      WHERE admin_id = (
        SELECT admin_id FROM admin
        WHERE admin_id = %s
        LIMIT 1
      )
      RETURNING *
      """
      #set up query to make call to database
      cur.execute(query, (admin.admin_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
         raise HTTPException(status_code=404, detail="admin missing")
      retired_admin = Admin(admin_id=cashe[0], email=cashe[1], password=cashe[2])
      return retired_admin
      #return deleted admin, unless it's empty in which case an error is returned