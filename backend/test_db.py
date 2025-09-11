import os
from dotenv import load_dotenv
import mysql.connector as mc

# Load .env from current directory
load_dotenv(".env")

cfg = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

print("Config:", {k: (v if k != 'password' else '***') for k, v in cfg.items()})

try:
    conn = mc.connect(**cfg)
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("Ping result:", cur.fetchone())
    cur.close()
    conn.close()
    print("SUCCESS: Connected to MySQL via tunnel and query executed.")
except Exception as e:
    print("ERROR:", repr(e))
    raise
