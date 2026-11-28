from backend.REST_API.dbpool import database_cursor
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from fastapi import HTTPException

class Service(BaseModel):
    service_id: Optional[int] = None
    service_name: str
    description: Optional[str] = None
    active: bool = True
    estimated_duration: int = 0
    admin_id: Optional[int] = None


class serviceDAO:
    def add_service3(self, new_service: Service):
        with database_cursor(cursor_factory=DictCursor) as (conn, cur):

          query = """
                  INSERT INTO service
                      (service_name, description, active, estimated_duration, admin_id)
                  VALUES (%s, %s, %s, %s, %s)
                  RETURNING service_id \
                  """

          cur.execute(query, (
              new_service.service_name,
              new_service.description,
              new_service.active,
              new_service.estimated_duration,
              new_service.admin_id
          ))

          cashe = cur.fetchone()
          new_service.service_id = cashe[0]

          conn.commit()

        return new_service

    def get_service_list3(self, admin_id: int):
        service_list: list[Service] = []

        with database_cursor(cursor_factory=DictCursor) as (conn, cur):

          query = """
                  SELECT
                      service_id,
                      service_name,
                      description,
                      active,
                      estimated_duration,
                      admin_id
                  FROM service
                  WHERE admin_id = %s
                  ORDER BY service_id \
                  """

          cur.execute(query, (admin_id,))

          for row in cur:
              service_list.append(Service(**row))


        return service_list

    # ===== Service Editing =====

    def update_service3(self, updated_service: Service):
        with database_cursor(cursor_factory=DictCursor) as (conn, cur):

          # Get the Service's current name and status.
          cur.execute(
              """
              SELECT service_name, active
              FROM service
              WHERE service_id = %s
                AND admin_id = %s
              """,
              (
                  updated_service.service_id,
                  updated_service.admin_id
              )
          )

          current_service = cur.fetchone()

          if current_service is None:

              raise HTTPException(
                  status_code=404,
                  detail="Service not found."
              )

          name_is_changing = (
                  current_service["service_name"] != updated_service.service_name
          )

          if name_is_changing:
              cur.execute(
                  """
                  SELECT EXISTS (
                      SELECT 1
                      FROM queue
                      WHERE service_id = %s
                        AND admin_id = %s
                        AND (
                          active = TRUE
                              OR pending_disable = TRUE
                          )
                  )
                  """,
                  (
                      updated_service.service_id,
                      updated_service.admin_id
                  )
              )

              has_running_queues = cur.fetchone()[0]

          # Service must be Disabled before changing its name.
          if name_is_changing and (
                  current_service["active"] is True
                  or has_running_queues is True
          ):

              raise HTTPException(
                  status_code=409,
                  detail="Service and all of its queues must be disabled before changing its name."
              )

          query = """
                  UPDATE service
                  SET
                      service_name = %s,
                      description = %s,
                      estimated_duration = %s
                  WHERE service_id = %s
                    AND admin_id = %s
                  RETURNING * \
                  """

          cur.execute(query, (
              updated_service.service_name,
              updated_service.description,
              updated_service.estimated_duration,
              updated_service.service_id,
              updated_service.admin_id
          ))

          cashe = cur.fetchone()

          conn.commit()

        if cashe is None:
            raise HTTPException(
                status_code=404,
                detail="Service not found."
            )

        return Service(**cashe)

    # ===== End Service Editing =====

    def set_service_active3(
            self,
            service_id: int,
            admin_id: int,
            make_active: bool
    ):
        with database_cursor(cursor_factory=DictCursor) as (conn, cur):

          cur.execute(
              """
              UPDATE service
              SET active = %s
              WHERE service_id = %s
                AND admin_id = %s
              RETURNING *
              """,
              (
                  make_active,
                  service_id,
                  admin_id
              )
          )

          cashe = cur.fetchone()

          # When disabling the service, its queues must stop accepting new joins.
          if cashe is not None and make_active is False:

              # Queues with active tickets enter Pending Disable.
              cur.execute(
                  """
                  UPDATE queue
                  SET pending_disable = TRUE
                  WHERE service_id = %s
                    AND admin_id = %s
                    AND EXISTS (
                      SELECT 1
                      FROM customer
                      WHERE customer.queue_id = queue.queue_id
                        AND customer.status IN ('waiting', 'called', 'skipped')
                  )
                  """,
                  (service_id, admin_id)
              )

              # Queues without active tickets disable immediately.
              cur.execute(
                  """
                  UPDATE queue
                  SET
                      active = FALSE,
                      pending_disable = FALSE
                  WHERE service_id = %s
                    AND admin_id = %s
                    AND NOT EXISTS (
                      SELECT 1
                      FROM customer
                      WHERE customer.queue_id = queue.queue_id
                        AND customer.status IN ('waiting', 'called', 'skipped')
                  )
                  """,
                  (service_id, admin_id)
              )

          conn.commit()

        if cashe is None:
            raise HTTPException(
                status_code=404,
                detail="Service not found."
            )

        return Service(**cashe)

    def delete_service3(self, service_id: int, admin_id: int):
        with database_cursor(cursor_factory=DictCursor) as (conn, cur):

          # Service must exist, belong to this Admin, and already be Disabled.
          cur.execute(
              """
              SELECT service_id
              FROM service
              WHERE service_id = %s
                AND admin_id = %s
                AND active = FALSE
              """,
              (service_id, admin_id)
          )

          service = cur.fetchone()

          if service is None:

              raise HTTPException(
                  status_code=409,
                  detail="Service must be disabled before it can be deleted."
              )

          # Do not delete a Service while Queues still belong to it.
          cur.execute(
              """
              SELECT COUNT(*)
              FROM queue
              WHERE service_id = %s
                AND admin_id = %s
              """,
              (service_id, admin_id)
          )

          queue_count = cur.fetchone()[0]

          if queue_count > 0:

              raise HTTPException(
                  status_code=409,
                  detail="Delete or reassign this service's queues first."
              )

          cur.execute(
              """
              DELETE FROM service
              WHERE service_id = %s
                AND admin_id = %s
              RETURNING *
              """,
              (service_id, admin_id)
          )

          cashe = cur.fetchone()

          conn.commit()

        return Service(**cashe)