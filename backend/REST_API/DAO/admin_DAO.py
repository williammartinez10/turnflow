from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool


class Admin(BaseModel):
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

    try:
      with conn.cursor(cursor_factory=DictCursor) as cur:
        query = """
        INSERT INTO admin_accounts
        (full_name, email, password, organization_name)
        VALUES (%s, %s, %s, %s)
        RETURNING admin_id, full_name, email, organization_name
        """
        cur.execute(query, (
          new_admin.full_name,
          new_admin.email,
          password_hash,
          new_admin.organization_name,
        ))
        account = dict(cur.fetchone())

      conn.commit()
      return account
    except Exception:
      conn.rollback()
      raise
    finally:
      self.pool.putconn(conn)

  def get_admin3(self, email: str):
    conn = self.pool.getconn()

    try:
      with conn.cursor(cursor_factory=DictCursor) as cur:
        query = """
        SELECT admin_id, full_name, email, password, organization_name
        FROM admin_accounts
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