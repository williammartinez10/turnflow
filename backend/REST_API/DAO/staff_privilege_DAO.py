from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
from fastapi import HTTPException


class Staff_Privilege(BaseModel):
  staff_priv_id: Optional[int] = None
  staff_privilege: Optional[str] = None
  staff_with_priv: Optional[list[int]] = None


class staff_privilegeDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
        POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_staff_privilege3(self, new_staff_privilege: Staff_Privilege):
      if new_staff_privilege.staff_with_priv is None:
        new_staff_privilege.staff_with_priv = []

      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO staff_privilege
      (staff_privilege, staff_with_priv)
      VALUES (%s, %s)
      RETURNING staff_priv_id
      """
      cur.execute(query, (
        new_staff_privilege.staff_privilege,
        new_staff_privilege.staff_with_priv,
      ))
      cashe = cur.fetchone()
      new_staff_privilege.staff_priv_id = cashe[0]
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_staff_privilege

  def get_staff_privilege_list3(self):
      privilege_list: list[Staff_Privilege] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM staff_privilege
      """
      #set up query to make call to database
      cur.execute(query)
      for row in cur:
        privilege_list.append(Staff_Privilege(**row))
      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if privilege_list == []:
         raise HTTPException(
             status_code=404,
             detail="empty staff_privilege table"
         )

      return privilege_list

  def get_with_staff_privilege_staff_list3(self, staff_privilege: str):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT * FROM staff_privilege
      WHERE staff_privilege = %s
      ORDER BY staff_priv_id
      LIMIT 1
      """
      #set up query to make call to database
      cur.execute(query, (staff_privilege,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if cashe is None:
        raise HTTPException(
            status_code=404,
            detail="staff_privilege missing"
        )

      return cashe["staff_with_priv"] or []

  def delete_staff_privilege3(self, staff_privilege: str):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM staff_privilege
      WHERE staff_priv_id = (
        SELECT staff_priv_id FROM staff_privilege
        WHERE staff_privilege = %s
        ORDER BY staff_priv_id
        LIMIT 1
      )
      RETURNING *
      """
      cur.execute(query, (staff_privilege,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if cashe is None:
         raise HTTPException(
             status_code=404,
             detail="staff_privilege missing"
         )

      retired_privilege = Staff_Privilege(**cashe)
      return retired_privilege