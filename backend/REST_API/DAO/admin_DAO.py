from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
from fastapi import HTTPException


class Admin(BaseModel):
  admin_id: Optional[int] = None
  full_name: str
  email: str
  password: str
  organization_name: str


class adminDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
      POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_admin3(self, new_admin: Admin, password_hash: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
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
    cur.close()
    self.pool.putconn(conn)
    return dict(cashe)

  def get_admin3(self, email: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT admin_id, full_name, email, password, organization_name
    FROM admin
    WHERE email = %s
    """
    # The handler verifies the stored hash against the entered password.
    cur.execute(query, (email,))
    cashe = cur.fetchone()
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    return dict(cashe) if cashe is not None else None

  def delete_admin3(self, admin: Admin):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
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
    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
      raise HTTPException(status_code=404, detail="admin missing")

    # Return the deleted account without its password hash.
    return dict(cashe)