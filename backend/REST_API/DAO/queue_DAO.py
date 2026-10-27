from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
import psycopg2
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
import datetime
from fastapi import HTTPException

# Updated for Services/Queues page
class Queue(BaseModel):
    queue_id: Optional[int] = None
    queue_code: Optional[str] = None
    queue_name: Optional[str] = None
    prefix: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = True

    # Temporary old field
    service: Optional[str] = None

    # Services linked to this queue through queue_service
    service_ids: Optional[list[int]] = None
    service_names: Optional[list[str]] = None

    admin_id: Optional[int] = None
    organization_name: Optional[str] = None

class queueDAO:
  def __init__(self):
    self.pool = SimpleConnectionPool(
        POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
    )

  def add_queue3(self, new_queue: Queue):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      INSERT INTO queue
      (queue_code, queue_name, prefix, description, service, active, admin_id)
      VALUES (%s, %s, %s, %s, %s, %s, %s)
      RETURNING queue_id
      """
      #set up query to make call to database
      cur.execute(query, (
          new_queue.queue_code,
          new_queue.queue_name,
          new_queue.prefix,
          new_queue.description,
          new_queue.service,
          new_queue.active,
          new_queue.admin_id
      ))
      cashe = cur.fetchone()
      new_queue.queue_id = cashe[0]

      # Links the new queue to each selected service.
      if new_queue.service_ids:
        for service_id in new_queue.service_ids:
            cur.execute(
                """
                INSERT INTO queue_service (queue_id, service_id)
                SELECT %s, service_id
                FROM service
                WHERE service_id = %s
                  AND admin_id = %s
                """,
                (
                    new_queue.queue_id,
                    service_id,
                    new_queue.admin_id
                )
            )

      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_queue
  
  def get_withcode_queue3(self, queue_code: str):
    cashe: Queue
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()
    if cashe == None:
      raise HTTPException(status_code=404, detail="queue missing")
    return cashe[0]

  def check_withcode_queue3(self, queue_code: str):
    cashe: Queue
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()
    if cashe == None:
       return cashe
    return cashe[0]

  def get_queue_list3(self):
      queue_list: list[Queue] = []
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      SELECT
        queue.queue_id,
        queue.queue_code,
        queue.queue_name,
        queue.prefix,
        queue.description,
        queue.service,
        queue.active,
        queue.admin_id,
        admin.organization_name,

        COALESCE(
            ARRAY_AGG(service.service_id)
            FILTER (WHERE service.service_id IS NOT NULL),
            '{}'
        ) AS service_ids,

        COALESCE(
            ARRAY_AGG(service.service_name)
            FILTER (WHERE service.service_name IS NOT NULL),
            '{}'
        ) AS service_names

      FROM queue

      LEFT JOIN admin
        ON queue.admin_id = admin.admin_id

      LEFT JOIN queue_service
        ON queue.queue_id = queue_service.queue_id

      LEFT JOIN service
        ON queue_service.service_id = service.service_id

      GROUP BY
        queue.queue_id,
        admin.organization_name \
        """
      #set up query to make call to database
      cur.execute(query)
      for row in cur:
        queue_list.append(Queue(**row))
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if queue_list == []:
         raise HTTPException(status_code=404, detail="empty queue table")
      return queue_list
      #return list of queues, unless it's empty in which case an error is returned

  def delete_queue3(self, queue_code: str):
      queue_id = queueDAO().get_withcode_queue3(queue_code)
      cashe: Queue
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)
      query = """
      DELETE FROM queue
      WHERE queue_id = (
        SELECT queue_id FROM queue
        WHERE queue_id = %s
        ORDER BY queue_id
        LIMIT 1
      )
      RETURNING *
      """
      #set up query to make call to database
      cur.execute(query, (queue_id,))
      cashe = cur.fetchone()
      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      if cashe == None:
         raise HTTPException(status_code=404, detail="queue missing or empty")
      retired_queue = Queue(**cashe)
      return retired_queue
      #return deleted queue, unless it's empty in which case an error is returned

  # Counts active queues owned by the admin.
  def count_active_queues3(self, admin_id: int):
    conn = self.pool.getconn()
    cur = conn.cursor()

    query = """
        SELECT COUNT(*)
        FROM queue
        WHERE admin_id = %s
          AND active = TRUE \
        """

    cur.execute(query, (admin_id,))
    count = cur.fetchone()[0]

    cur.close()
    self.pool.putconn(conn)

    return count

  # ===== Queue Editing =====

# Updates a queue owned by the logged-in admin.
  def update_queue3(self, updated_queue: Queue):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    query = """
            UPDATE queue
            SET
                queue_name = %s,
                prefix = %s,
                description = %s,
                service = %s,
                active = %s
            WHERE queue_code = %s
              AND admin_id = %s
            RETURNING * \
            """

    cur.execute(query, (
        updated_queue.queue_name,
        updated_queue.prefix,
        updated_queue.description,
        updated_queue.service,
        updated_queue.active,
        updated_queue.queue_code,
        updated_queue.admin_id
    ))

    cashe = cur.fetchone()

    # Replaces the queue's current service relationships.
    if cashe is not None:
        queue_id = cashe["queue_id"]

        cur.execute(
            """
            DELETE FROM queue_service
            WHERE queue_id = %s
            """,
            (queue_id,)
        )

        if updated_queue.service_ids:
            for service_id in updated_queue.service_ids:
                cur.execute(
                    """
                    INSERT INTO queue_service (queue_id, service_id)
                    SELECT %s, service_id
                    FROM service
                    WHERE service_id = %s
                      AND admin_id = %s
                    """,
                    (
                        queue_id,
                        service_id,
                        updated_queue.admin_id
                    )
                )

    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
        raise HTTPException(
            status_code=404,
            detail="Queue not found."
        )

    return Queue(**cashe)

    # ===== End Queue Editing =====