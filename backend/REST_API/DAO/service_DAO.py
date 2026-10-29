from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG
from pydantic import BaseModel
from typing import Optional
from psycopg2.extras import DictCursor
from psycopg2.pool import SimpleConnectionPool
from fastapi import HTTPException

class Service(BaseModel):
    service_id: Optional[int] = None
    service_name: str
    description: Optional[str] = None
    active: bool = True
    estimated_duration: int = 0
    admin_id: Optional[int] = None


class serviceDAO:
    def __init__(self):

        self.pool = SimpleConnectionPool(
            POOL_CONFIG["minconn"],
            POOL_CONFIG["maxconn"],
            **PG_DB_CONFIG
        )

    def add_service3(self, new_service: Service):
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)

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
        cur.close()
        self.pool.putconn(conn)

        return new_service

    def get_service_list3(self, admin_id: int):
        service_list: list[Service] = []

        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)

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

        cur.close()
        self.pool.putconn(conn)

        return service_list

    # ===== Service Editing =====

    def update_service3(self, updated_service: Service):
        conn = self.pool.getconn()
        cur = conn.cursor(cursor_factory=DictCursor)

        query = """
                UPDATE service
                SET
                    service_name = %s,
                    description = %s,
                    active = %s,
                    estimated_duration = %s
                WHERE service_id = %s
                  AND admin_id = %s
                RETURNING * \
                """

        cur.execute(query, (
            updated_service.service_name,
            updated_service.description,
            updated_service.active,
            updated_service.estimated_duration,
            updated_service.service_id,
            updated_service.admin_id
        ))

        cashe = cur.fetchone()

        if cashe is not None and updated_service.active is False:
            cur.execute(
                """
                UPDATE queue
                SET active = FALSE
                WHERE service_id = %s
                  AND admin_id = %s
                """,
                (
                    updated_service.service_id,
                    updated_service.admin_id
                )
            )

        conn.commit()
        cur.close()
        self.pool.putconn(conn)

        if cashe is None:
            raise HTTPException(
                status_code=404,
                detail="Service not found."
            )

        return Service(**cashe)

    # ===== End Service Editing =====