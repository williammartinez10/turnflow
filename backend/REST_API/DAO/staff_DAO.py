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
  admin_id: Optional[int] = None
  invitation_code: Optional[str] = None
  active: Optional[bool] = False


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
    (full_name, email, password, admin_id)
    VALUES (%s, %s, %s, %s)
    RETURNING staff_id, full_name, email, admin_id
    """
    # Store the password hash supplied by the signup handler.
    cur.execute(query, (
      new_staff.full_name,
      new_staff.email,
      password_hash,
      new_staff.admin_id,
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
    SELECT staff.staff_id, staff.full_name, staff.email, staff.password, staff.admin_id, staff.active, admin.organization_name
    FROM staff
    JOIN admin
    ON staff.admin_id = admin.admin_id
    WHERE staff.email = %s
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

  def set_active3(self, staff_id: int, active: bool):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            UPDATE staff
            SET active = %s
            WHERE staff_id = %s
            RETURNING staff_id, active \
            """

    cur.execute(query, (
      active,
      staff_id,
    ))

    result = cur.fetchone()

    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if result is None:
      raise HTTPException(
        status_code=404,
        detail="Staff not found."
      )

    return dict(result)

  def get_staff_list3(self, admin_id: int):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            SELECT
              staff_id,
              full_name,
              email,
              active
            FROM staff
            WHERE admin_id = %s
            ORDER BY full_name \
            """

    cur.execute(query, (admin_id,))
    results = cur.fetchall()

    cur.close()
    self.pool.putconn(conn)

    return [dict(row) for row in results]

  def assign_queue3(
          self,
          staff_id: int,
          queue_id: int,
          admin_id: int
  ):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            INSERT INTO staff_queue_assignment (staff_id, queue_id)
            SELECT staff.staff_id, queue.queue_id
            FROM staff, queue
            WHERE staff.staff_id = %s
              AND staff.admin_id = %s
              AND queue.queue_id = %s
              AND queue.admin_id = %s
            ON CONFLICT (staff_id, queue_id) DO NOTHING
            RETURNING staff_id, queue_id \
            """

    cur.execute(query, (
      staff_id,
      admin_id,
      queue_id,
      admin_id,
    ))

    result = cur.fetchone()

    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if result is None:
      raise HTTPException(
        status_code=404,
        detail="Staff or queue not found, or queue is already assigned."
      )

    return dict(result)

  def unassign_queue3(
          self,
          staff_id: int,
          queue_id: int,
          admin_id: int
  ):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            DELETE FROM staff_queue_assignment
            WHERE staff_id = %s
              AND queue_id = %s
              AND staff_id IN (
              SELECT staff_id
              FROM staff
              WHERE admin_id = %s
            )
              AND queue_id IN (
              SELECT queue_id
              FROM queue
              WHERE admin_id = %s
            )
            RETURNING staff_id, queue_id \
            """

    cur.execute(query, (
      staff_id,
      queue_id,
      admin_id,
      admin_id,
    ))

    result = cur.fetchone()

    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if result is None:
      raise HTTPException(
        status_code=404,
        detail="Assignment not found."
      )

    return dict(result)

  def get_assigned_queues3(
          self,
          staff_id: int,
          admin_id: int
  ):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            SELECT
              queue.queue_id,
              queue.queue_name,
              queue.queue_code,
              queue.active,
              (
                SELECT COUNT(*)
                FROM customer
                WHERE customer.queue_id = queue.queue_id
                  AND customer.status = 'waiting'
              ) AS waiting_count
            FROM staff_queue_assignment
                   JOIN queue
                        ON staff_queue_assignment.queue_id = queue.queue_id
                   JOIN staff
                        ON staff_queue_assignment.staff_id = staff.staff_id
            WHERE staff.staff_id = %s
              AND staff.admin_id = %s
              AND queue.admin_id = %s
            ORDER BY queue.queue_name \
            """

    cur.execute(query, (
      staff_id,
      admin_id,
      admin_id,
    ))

    results = cur.fetchall()

    cur.close()
    self.pool.putconn(conn)

    return [dict(row) for row in results]