from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
from fastapi import HTTPException


class Staff(BaseModel):
  staff_id: Optional[int] = None
  full_name: str
  email: str
  password: str


class staffDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
      POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_staff3(self, new_staff: Staff, password_hash: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    INSERT INTO staff
    (full_name, email, password)
    VALUES (%s, %s, %s)
    RETURNING staff_id, full_name, email
    """
    # Store the password hash supplied by the signup handler.
    cur.execute(query, (
      new_staff.full_name,
      new_staff.email,
      password_hash,
    ))
    cashe = cur.fetchone()
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    return dict(cashe)

  def get_staff3(self, email: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT staff_id, full_name, email, password
    FROM staff
    WHERE email = %s
    """
    # The handler verifies the stored hash against the entered password.
    cur.execute(query, (email,))
    cashe = cur.fetchone()
    conn.commit()
    cur.close()
    self.pool.putconn(conn)
    return dict(cashe) if cashe is not None else None

  def delete_staff3(self, staff: Staff):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    DELETE FROM staff
    WHERE staff_id = (
      SELECT staff_id FROM staff
      WHERE staff_id = %s
      LIMIT 1
    )
    RETURNING staff_id, full_name, email
    """
    cur.execute(query, (staff.staff_id,))
    cashe = cur.fetchone()
    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
      raise HTTPException(status_code=404, detail="staff missing")

    # Return the deleted account without its password hash.
    return dict(cashe)