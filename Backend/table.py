import psycopg2
from dotenv import load_dotenv
import os 
load_dotenv()

host=os.getenv("DB_HOST")
dbname=os.getenv("DB_NAME")
user=os.getenv("DB_USER")
password=os.getenv("DB_PASSWORD")
port=os.getenv("DB_PORT")

conn = psycopg2.connect(
    host=host,
    dbname=dbname,
    user=user,
    password=password,
    port=port
)

cur=conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        file_path TEXT UNIQUE NOT NULL,
        file_type TEXT NOT NULL,
        uploaded BOOLEAN NOT NULL,
        upload_id TEXT
    );
""")


cur.execute("""CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    file_path TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    FOREIGN KEY (file_path) REFERENCES files(file_path)
);"""
    
    
)
conn.commit()
cur.close()
conn.close()

