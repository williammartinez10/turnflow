from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool


class Staff(BaseModel):
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

    try:
      with conn.cursor(cursor_factory=DictCursor) as cur:
        query = """
        INSERT INTO staff_accounts
        (full_name, email, password)
        VALUES (%s, %s, %s)
        RETURNING staff_id, full_name, email, staff_priv_id
        """
        cur.execute(query, (
          new_staff.full_name,
          new_staff.email,
          password_hash,
        ))
        account = dict(cur.fetchone())

      conn.commit()
      return account
    except Exception:
      conn.rollback()
      raise
    finally:
      self.pool.putconn(conn)

  def get_staff3(self, email: str):
    conn = self.pool.getconn()

    try:
      with conn.cursor(cursor_factory=DictCursor) as cur:
        query = """
        SELECT staff_id, full_name, email, password, staff_priv_id
        FROM staff_accounts
        WHERE email = %s
        """
        cur.execute(query, (email,))
        account = cur.fetchone()

      conn.commit()
      return dict(account) if account else None
    except Exception:
      conn.rollback()
      raise
    finally:
      self.pool.putconn(conn)