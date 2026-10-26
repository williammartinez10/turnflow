8982

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
DROP TABLE IF EXISTS next_customer CASCADE;
DROP TABLE IF EXISTS queue CASCADE;
DROP TABLE IF EXISTS staff_privilege CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

CREATE TABLE admin(
admin_id serial PRIMARY KEY,
full_name TEXT,
email TEXT,
password TEXT,
organization_name TEXT
);

CREATE TABLE queue(
queue_id serial PRIMARY KEY,
queue_code TEXT,
service TEXT,
admin_id integer,
FOREIGN KEY (admin_id) REFERENCES admin(admin_id),
time_list integer[]
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

CREATE TABLE next_customer(
next_customer_id integer PRIMARY KEY,
FOREIGN KEY (next_customer_id) REFERENCES customer(customer_id),
queue_id integer,
FOREIGN KEY (queue_id) REFERENCES queue(queue_id),
time TIMESTAMPTZ
);

-- Allow only one active ticket per phone number in each queue.
CREATE UNIQUE INDEX customer_unique_active_phone_per_queue
ON customer (queue_id, phone_number)
WHERE status IN ('waiting', 'called', 'skipped');

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

# unused
# DROP TABLE IF EXISTS user_log CASCADE;
# CREATE TABLE user_log(
# log_id serial PRIMARY KEY,
# phone_number TEXT,
# queue_code TEXT,
# time TIMESTAMPTZ
# );