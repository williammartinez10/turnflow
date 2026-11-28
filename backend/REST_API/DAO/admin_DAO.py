from backend.REST_API.dbpool import database_cursor
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from fastapi import HTTPException


class Admin(BaseModel):
  admin_id: Optional[int] = None
  full_name: str
  email: str
  password: str
  organization_name: str
  invitation_code: Optional[str] = None

class Admin_and_old(BaseModel):
  admin_id: Optional[int] = None
  full_name: str
  email: str
  email_old: str
  password: str
  password_old: str
  organization_name: str


class adminDAO:
  def add_admin3(self, new_admin: Admin, password_hash: str):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur):
      query = """
      INSERT INTO admin
      (full_name, email, password, organization_name)
      VALUES (%s, %s, %s, %s)
      RETURNING admin_id, full_name, email, organization_name
      """
      # Store the password hash supplied by the signup handler.
      cur.execute(query, (
        new_admin.full_name,
        new_admin.email,
        password_hash,
        new_admin.organization_name,
      ))
      cashe = cur.fetchone()
      conn.commit()
    return dict(cashe)

  def get_admin3(self, email: str):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur):
      query = """
      SELECT admin_id, full_name, email, password, organization_name, invitation_code
      FROM admin
      WHERE email = %s
      """
      # The handler verifies the stored hash against the entered password.
      cur.execute(query, (email,))
      cashe = cur.fetchone()
      conn.commit()
    return dict(cashe) if cashe is not None else None

  def delete_admin3(self, admin: Admin):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur):
      query = """
      DELETE FROM admin
      WHERE admin_id = (
        SELECT admin_id FROM admin
        WHERE admin_id = %s
        LIMIT 1
      )
      RETURNING admin_id, full_name, email, organization_name
      """
      cur.execute(query, (admin.admin_id,))
      cashe = cur.fetchone()
      conn.commit()

    if cashe is None:
      raise HTTPException(status_code=404, detail="admin missing")

    # Return the deleted account without its password hash.
    return dict(cashe)

  def set_invitation_code3(self, admin_id: int, invitation_code: str):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur):

      query = """
              UPDATE admin
              SET invitation_code = %s
              WHERE admin_id = %s
              RETURNING admin_id, invitation_code \
              """

      cur.execute(query, (
        invitation_code,
        admin_id,
      ))

      result = cur.fetchone()
      conn.commit()

    if result is None:
      raise HTTPException(status_code=404, detail="Admin not found")

    return dict(result)

  def get_admin_by_invitation_code3(self, invitation_code: str):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur):

      query = """
              SELECT admin_id, organization_name
              FROM admin
              WHERE invitation_code = %s \
              """

      cur.execute(query, (invitation_code,))
      result = cur.fetchone()

    return dict(result) if result is not None else None

  def count_admin3(self):
    with database_cursor() as (conn, cur), conn:
      cur.execute("SELECT COUNT(*) FROM admin")
      return cur.fetchone()[0]

  def update_admin3(self, updated: Admin_and_old, admin_id: int,
                    old_password_hash: str, new_password_hash: str):
    with database_cursor(cursor_factory=DictCursor) as (conn, cur), conn:
      cur.execute("""
        UPDATE admin
        SET full_name = %s, email = %s, password = %s,
            organization_name = %s
        WHERE admin_id = %s AND email = %s AND password = %s
        RETURNING admin_id, full_name, email, organization_name
      """, (
        updated.full_name,
        updated.email,
        new_password_hash,
        updated.organization_name,
        admin_id,
        updated.email_old,
        old_password_hash,
      ))
      result = cur.fetchone()
      if result is None:
        raise HTTPException(status_code=409, detail="Account changed. Retry the update.")
      return dict(result)
