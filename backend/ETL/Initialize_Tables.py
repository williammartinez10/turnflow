import pandas as pd
import os
import psycopg2

DB_CONFIG = {
    "dbname": "TurnFlow_Database",
    "user": "dbuser",
    "password": "Medical@ffice20",
    "host": "localhost",
    "port": 8982,
}  # server config

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
query = """
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS queue_service CASCADE;
DROP TABLE IF EXISTS queue CASCADE;
DROP TABLE IF EXISTS user_log CASCADE;
DROP TABLE IF EXISTS staff_privilege CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS service CASCADE;
DROP TABLE IF EXISTS admin CASCADE;


CREATE TABLE admin(
admin_id serial PRIMARY KEY,
full_name TEXT,
email TEXT,
password TEXT,
organization_name TEXT
);

CREATE TABLE service(
service_id SERIAL PRIMARY KEY,
service_name TEXT NOT NULL,
description TEXT,
active BOOLEAN NOT NULL DEFAULT TRUE,
estimated_duration INTEGER NOT NULL DEFAULT 0,
admin_id INTEGER NOT NULL REFERENCES admin(admin_id),

UNIQUE (admin_id, service_name)
);

CREATE TABLE queue (
queue_id SERIAL PRIMARY KEY,
queue_code TEXT UNIQUE,
queue_name TEXT,
prefix TEXT,
description TEXT,
service TEXT,
active BOOLEAN NOT NULL DEFAULT TRUE,
admin_id INTEGER REFERENCES admin(admin_id)
);

CREATE TABLE queue_service(
queue_id INTEGER NOT NULL REFERENCES queue(queue_id) ON DELETE CASCADE,
service_id INTEGER NOT NULL REFERENCES service(service_id) ON DELETE CASCADE,

PRIMARY KEY (queue_id, service_id)
);

CREATE TABLE customer(
customer_id serial PRIMARY KEY,
ticket_id integer,
phone_number TEXT,
queue_id integer,
FOREIGN KEY (queue_id) REFERENCES queue(queue_id),
time TIMESTAMPTZ,
status TEXT NOT NULL DEFAULT 'waiting'
);

-- Allow only one active ticket per phone number in each queue.
CREATE UNIQUE INDEX customer_unique_active_phone_per_queue
ON customer (queue_id, phone_number)
WHERE status IN ('waiting', 'called', 'skipped');

CREATE TABLE user_log(
log_id serial PRIMARY KEY,
phone_number TEXT,
queue_code TEXT,
time TIMESTAMPTZ
);

CREATE TABLE staff_privilege(
staff_priv_id serial PRIMARY KEY,
staff_privilege TEXT,
staff_with_priv integer[]
);

CREATE TABLE staff(
staff_id serial PRIMARY KEY,
full_name TEXT,
email TEXT,
password TEXT
);
"""
cur.execute(query)
conn.commit()
cur.close()
conn.close()
print("Tables Created")