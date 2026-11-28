from backend.REST_API.dbpool import database_cursor
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from fastapi import HTTPException


class Staff_Privilege(BaseModel):
  staff_priv_id: Optional[int] = None
  staff_privilege: Optional[str] = None
  staff_with_priv: Optional[list[str]] = None


class staff_privilegeDAO:
  def add_staff_privilege3(self, new_staff_privilege: Staff_Privilege):
      if new_staff_privilege.staff_with_priv is None:
        new_staff_privilege.staff_with_priv = []

      with database_cursor(cursor_factory=DictCursor) as (conn, cur):
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
      #store and return entry just created in database
      return new_staff_privilege

  def get_staff_privilege_list3(self):
      privilege_list: list[Staff_Privilege] = []
      with database_cursor(cursor_factory=DictCursor) as (conn, cur):
        query = """
        SELECT * FROM staff_privilege
        """
        #set up query to make call to database
        cur.execute(query)
        for row in cur:
          privilege_list.append(Staff_Privilege(**row))
        conn.commit()

      if privilege_list == []:
         raise HTTPException(
             status_code=404,
             detail="empty staff_privilege table"
         )

      return privilege_list

  def get_with_staff_privilege_staff_list3(self, staff_privilege: str):
      with database_cursor(cursor_factory=DictCursor) as (conn, cur):
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

      if cashe is None:
        raise HTTPException(
            status_code=404,
            detail="staff_privilege missing"
        )

      return cashe["staff_with_priv"] or []

  def delete_staff_privilege3(self, staff_privilege: str):
      with database_cursor(cursor_factory=DictCursor) as (conn, cur):
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

      if cashe is None:
         raise HTTPException(
             status_code=404,
             detail="staff_privilege missing"
         )

      retired_privilege = Staff_Privilege(**cashe)
      return retired_privilege