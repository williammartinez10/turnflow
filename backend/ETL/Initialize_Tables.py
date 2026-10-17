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
DROP TABLE IF EXISTS staff_privilege CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

CREATE TABLE queue(
queue_id serial PRIMARY KEY,
queue_code TEXT,
service TEXT
);

CREATE TABLE customer(
customer_id serial PRIMARY KEY,
ticket_id integer,
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

CREATE TABLE admin(
admin_id serial PRIMARY KEY,
full_name TEXT,
email TEXT,
password TEXT,
organization_name TEXT
);
"""
cur.execute(query)
conn.commit()
cur.close()
conn.close()
print("Tables Created")