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
DROP TABLE IF EXISTS queue CASCADE;
DROP TABLE IF EXISTS user_log CASCADE;
DROP TABLE IF EXISTS staff_privileges CASCADE;
DROP TABLE IF EXISTS staff_accounts CASCADE;
DROP TABLE IF EXISTS admin_accounts CASCADE;

CREATE TABLE queue(
queue_id serial PRIMARY KEY,
queue_code TEXT,
service TEXT
);

CREATE TABLE customer(
ticket_id serial PRIMARY KEY,
phone_number TEXT,
queue_id integer,
FOREIGN KEY (queue_id) REFERENCES queue(queue_id),
time TIMESTAMPTZ
);

CREATE TABLE user_log(
log_id serial PRIMARY KEY,
phone_number TEXT,
queue_code TEXT,
time TIMESTAMPTZ
);

CREATE TABLE staff_privileges(
staff_priv_id serial PRIMARY KEY,
  staff_privileges TEXT[]
);

CREATE TABLE staff_accounts(
staff_id serial PRIMARY KEY,
email TEXT,
password TEXT,
staff_priv_id integer,
FOREIGN KEY (staff_priv_id) REFERENCES staff_privileges(staff_priv_id)
);

CREATE TABLE admin_accounts(
admin_id serial PRIMARY KEY,
email TEXT,
password TEXT
);
"""
cur.execute(query)
conn.commit()
cur.close()
conn.close()
print("Tables Created")