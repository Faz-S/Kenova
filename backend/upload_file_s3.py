import os
import boto3
import psycopg2
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError


load_dotenv()


AWS_ACCESS_KEY = "AKIAS2VS4IQSFGM2PUA5"
AWS_SECRET_KEY = "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"
AWS_BUCKET_NAME = "edusage-bucket"
AWS_REGION = "ap-south-1"


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:DanielDas2004@edusage-database.cp6gyg0soaec.ap-south-1.rds.amazonaws.com:5432/edusage-database")


s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)


def upload_file_to_s3(file_path, bucket_name, object_name):
    try:
        s3.upload_file(file_path, bucket_name, object_name)
        s3_url = f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
        print(f"File uploaded successfully: {s3_url}")
        return s3_url
    except FileNotFoundError:
        print("The file was not found")
        return None
    except NoCredentialsError:
        print("Credentials not available")
        return None


def insert_file_path_to_rds(file_url, file_type):
    try:
        # Connect to PostgreSQL RDS
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Ensure the table exists
        cur.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            file_path TEXT UNIQUE NOT NULL,
            file_type TEXT NOT NULL,
            uploaded BOOLEAN NOT NULL,
            upload_id TEXT
        );
        """)
        
        # Insert the file URL into the table
        cur.execute("""
        INSERT INTO files (file_path, file_type, uploaded) 
        VALUES (%s, %s, %s)
        ON CONFLICT (file_path) DO NOTHING;
        """, (file_url, file_type, True))
        conn.commit()
        
        print(f"File URL inserted into RDS: {file_url}")
        
        # Close the connection
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error inserting into RDS: {e}")

def retrieve_s3_file_content(bucket_name, s3_file_key):

    try:
     
        s3 = boto3.client('s3')
        
        # Get the object from S3
        response = s3.get_object(Bucket=bucket_name, Key=s3_file_key)
        
        # Read the file content
        file_content = response['Body'].read()
        print("File content retrieved successfully.")
        
        return file_content
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


if __name__ == "__main__":

    file_path = "a.pdf"
    object_name = "s.pdf"  

    s3_url = upload_file_to_s3(file_path, AWS_BUCKET_NAME, object_name)
    
    if s3_url:
        insert_file_path_to_rds(s3_url,"text")
    content = retrieve_s3_file_content(AWS_BUCKET_NAME, object_name)
    print(content)