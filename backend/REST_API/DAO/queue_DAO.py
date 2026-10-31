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
    pending_disable: Optional[bool] = False

    # Service assigned to this queue
    service_id: Optional[int] = None
    service_name: Optional[str] = None

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

      # Verify that the selected Service belongs to this Admin.

      cur.execute(
          """
          SELECT active
          FROM service
          WHERE service_id = %s
            AND admin_id = %s
          """,
          (
              new_queue.service_id,
              new_queue.admin_id
          )
      )

      service = cur.fetchone()

      if service is None:
          cur.close()
          self.pool.putconn(conn)

          raise HTTPException(
              status_code=404,
              detail="Service not found."
          )

      # An Active Queue cannot be created under a Disabled Service.
      if new_queue.active is True and service["active"] is False:
          cur.close()
          self.pool.putconn(conn)

          raise HTTPException(
              status_code=409,
              detail="An active queue cannot be created under a disabled service."
          )

      query = """
      INSERT INTO queue
      (queue_code, queue_name, prefix, description, service_id, active, admin_id)
      VALUES (%s, %s, %s, %s, %s, %s, %s)
      RETURNING queue_id
      """
      #set up query to make call to database
      cur.execute(query, (
          new_queue.queue_code,
          new_queue.queue_name,
          new_queue.prefix,
          new_queue.description,
          new_queue.service_id,
          new_queue.active,
          new_queue.admin_id
      ))
      cashe = cur.fetchone()
      new_queue.queue_id = cashe[0]



      conn.commit()
      cur.close()
      self.pool.putconn(conn)
      #store and return entry just created in database
      return new_queue
  
  def get_withcode_queue3(self, queue_code: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
    SELECT * FROM queue
    WHERE queue_code = %s
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()

    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
        raise HTTPException(
            status_code=404,
            detail="queue missing"
        )

    return Queue(**cashe)

  def get_active_withcode_queue3(self, queue_code: str):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)

      query = """
              SELECT
                  queue.queue_id,
                  queue.queue_code,
                  queue.queue_name,
                  queue.prefix,
                  queue.description,
                  queue.service_id,
                  service.service_name,
                  queue.active,
                  queue.pending_disable,
                  queue.admin_id,
                  admin.organization_name
              FROM queue

                       LEFT JOIN service
                                 ON queue.service_id = service.service_id

                       LEFT JOIN admin
                                 ON queue.admin_id = admin.admin_id

              WHERE queue.queue_code = %s
                AND queue.active = TRUE
                AND queue.pending_disable = FALSE
                AND service.active = TRUE \
              """

      cur.execute(query, (queue_code,))
      cashe = cur.fetchone()

      cur.close()
      self.pool.putconn(conn)

      if cashe is None:
          raise HTTPException(
              status_code=404,
              detail="queue missing"
          )

      return Queue(**cashe)

  def check_withcode_queue3(self, queue_code: str):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)
    query = """
            SELECT queue_id
            FROM queue
            WHERE queue_code = %s \
    """
    #set up query to make call to database
    cur.execute(query, (queue_code,))
    cashe = cur.fetchone()

    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
        return None

    return cashe[0]

  def get_queue_list3(self, admin_id: int):
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
        queue.service_id,
        service.service_name,
        queue.active,
        queue.pending_disable,
        queue.admin_id,
        admin.organization_name
      FROM queue

      LEFT JOIN admin
        ON queue.admin_id = admin.admin_id

      LEFT JOIN service
        ON queue.service_id = service.service_id

      WHERE queue.admin_id = %s

      ORDER BY
        queue.queue_id
        """
      #set up query to make call to database
      cur.execute(query, (admin_id,))
      for row in cur:
        queue_list.append(Queue(**row))
      cur.close()
      self.pool.putconn(conn)
      return queue_list
      #return list of queues, unless it's empty in which case an error is returned

  def delete_queue3(self, queue_code: str, admin_id: int):
      conn = self.pool.getconn()
      cur = conn.cursor(cursor_factory=DictCursor)

      query = """
              DELETE FROM queue
              WHERE queue_code = %s
                AND admin_id = %s
                AND active = FALSE
                AND pending_disable = FALSE
              RETURNING * 
              """

      cur.execute(
          query,
          (
              queue_code,
              admin_id
          )
      )

      cashe = cur.fetchone()

      conn.commit()
      cur.close()
      self.pool.putconn(conn)

      if cashe is None:
          raise HTTPException(
              status_code=409,
              detail="Queue must be disabled before it can be deleted."
          )

      return Queue(**cashe)

  # Counts active queues owned by the admin.
  def count_active_queues3(self, admin_id: int):
    conn = self.pool.getconn()
    cur = conn.cursor()

    query = """
        SELECT COUNT(*)
        FROM queue
        WHERE admin_id = %s
          AND active = TRUE
          AND pending_disable = FALSE \
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

    # Get the queue's current Service and status.
    cur.execute(
        """
        SELECT queue_id, queue_name, prefix, service_id, active, pending_disable
        FROM queue
        WHERE queue_code = %s
          AND admin_id = %s
        """,
        (
            updated_queue.queue_code,
            updated_queue.admin_id
        )
    )

    current_queue = cur.fetchone()

    if current_queue is None:
        cur.close()
        self.pool.putconn(conn)

        raise HTTPException(
            status_code=404,
            detail="Queue not found."
        )

    service_is_changing = (
            current_queue["service_id"] != updated_queue.service_id
    )

    if service_is_changing:
        cur.execute(
            """
            SELECT service_id
            FROM service
            WHERE service_id = %s
              AND admin_id = %s
            """,
            (
                updated_queue.service_id,
                updated_queue.admin_id
            )
        )

        service = cur.fetchone()

        if service is None:
            cur.close()
            self.pool.putconn(conn)
            raise HTTPException(
                status_code=404,
                detail="Service not found."
            )

    name_is_changing = (
            current_queue["queue_name"] != updated_queue.queue_name
    )

    prefix_is_changing = (
            current_queue["prefix"] != updated_queue.prefix
    )

    # A Queue must be fully Disabled before changing its name, prefix, or Service.
    if (service_is_changing or name_is_changing or prefix_is_changing) and (
            current_queue["active"] is True
            or current_queue["pending_disable"] is True
    ):


        cur.close()
        self.pool.putconn(conn)

        raise HTTPException(
            status_code=409,
            detail="Queue must be disabled before changing its name, prefix, or service."
        )

    # Changing the Queue name starts a new history for this Queue.
    if name_is_changing:
        cur.execute(
            """
            DELETE FROM customer
            WHERE queue_id = %s
            """,
            (current_queue["queue_id"],)
        )

    query = """
            UPDATE queue
            SET
                queue_name = %s,
                prefix = %s,
                description = %s,
                service_id = %s
            WHERE queue_code = %s
              AND admin_id = %s
            RETURNING * \
            """

    cur.execute(query, (
        updated_queue.queue_name,
        updated_queue.prefix,
        updated_queue.description,
        updated_queue.service_id,
        updated_queue.queue_code,
        updated_queue.admin_id
    ))

    cashe = cur.fetchone()

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

  def set_queue_active3(
        self,
        queue_code: str,
        admin_id: int,
        make_active: bool
    ):
    conn = self.pool.getconn()
    cur = conn.cursor(cursor_factory=DictCursor)

    # Reactivating a queue is immediate, but only if its Service is Active.
    if make_active:

        # Check whether the Queue's Service is Active.
        cur.execute(
            """
            SELECT service.active
            FROM queue
                     JOIN service
                          ON queue.service_id = service.service_id
            WHERE queue.queue_code = %s
              AND queue.admin_id = %s
            """,
            (queue_code, admin_id)
        )

        service_status = cur.fetchone()

        if service_status is None:
            cur.close()
            self.pool.putconn(conn)

            raise HTTPException(
                status_code=404,
                detail="Queue not found."
            )

        if service_status["active"] is False:
            cur.close()
            self.pool.putconn(conn)

            raise HTTPException(
                status_code=409,
                detail="Queue cannot be activated while its service is disabled."
            )

        # Service is Active, so the Queue can be activated.
        cur.execute(
            """
            UPDATE queue
            SET
                active = TRUE,
                pending_disable = FALSE
            WHERE queue_code = %s
              AND admin_id = %s
            RETURNING *
            """,
            (queue_code, admin_id)
        )

    else:

        # Check whether this specific Queue still has active tickets.
        cur.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM customer
                         JOIN queue
                              ON customer.queue_id = queue.queue_id
                WHERE queue.queue_code = %s
                  AND queue.admin_id = %s
                  AND customer.status IN ('waiting', 'called', 'skipped')
            )
            """,
            (queue_code, admin_id)
        )

        has_active_tickets = cur.fetchone()[0]

        if has_active_tickets:

            # Stop accepting new customers, but let current tickets finish.
            cur.execute(
                """
                UPDATE queue
                SET pending_disable = TRUE
                WHERE queue_code = %s
                  AND admin_id = %s
                RETURNING *
                """,
                (queue_code, admin_id)
            )

        else:

            # Nobody depends on the Queue, so disable immediately.
            cur.execute(
                """
                UPDATE queue
                SET
                    active = FALSE,
                    pending_disable = FALSE
                WHERE queue_code = %s
                  AND admin_id = %s
                RETURNING *
                """,
                (queue_code, admin_id)
            )

    cashe = cur.fetchone()

    conn.commit()
    cur.close()
    self.pool.putconn(conn)

    if cashe is None:
        raise HTTPException(
            status_code=404,
            detail="Queue not found."
        )

    return Queue(**cashe)