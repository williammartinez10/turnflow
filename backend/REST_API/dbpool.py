from contextlib import contextmanager
from threading import BoundedSemaphore, Lock

from psycopg2 import Error
from psycopg2.extensions import TRANSACTION_STATUS_IDLE
from psycopg2.pool import ThreadedConnectionPool

from backend.REST_API.dbconfig import PG_DB_CONFIG, POOL_CONFIG


_pool_lock = Lock()
_slots = BoundedSemaphore(POOL_CONFIG["maxconn"])
_pool = None


def _get_pool():
    global _pool
    with _pool_lock:
        if _pool is None:
            _pool = ThreadedConnectionPool(
                POOL_CONFIG["minconn"], POOL_CONFIG["maxconn"], **PG_DB_CONFIG
            )
        return _pool


@contextmanager
def database_cursor(**cursor_options):
    """Borrow a connection and discard any transaction the caller did not commit."""
    with _slots:
        pool = _get_pool()
        connection = pool.getconn()
        try:
            with connection.cursor(**cursor_options) as cursor:
                yield connection, cursor
        finally:
            try:
                if not connection.closed and connection.info.transaction_status != TRANSACTION_STATUS_IDLE:
                    connection.rollback()
            except Error:
                pool.putconn(connection, close=True)
            else:
                pool.putconn(connection)
