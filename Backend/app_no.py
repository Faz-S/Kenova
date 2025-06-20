# NEW CODE PUSH BY ME

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from content_no_s3 import ContentProcessorNew
import os
from dotenv import load_dotenv
import google.generativeai as genai
from collections import OrderedDict
import psycopg2
import json
from aws import retrieve_s3_file_content
from qa import QuestionPaperGenerator
from image_case import ImageCaseStudyGenerator
from evaluate import AnswerEvaluator
from werkzeug.utils import secure_filename
import re
import time
from website import WebsiteAnalyzer
import threading
import jwt
import datetime
from functools import wraps
import boto3

load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'danny')
DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

# Cache for file processing
cache = {}

# Initialize components
processor = None
conn = None
cursor = None
evaluator = AnswerEvaluator()
website_analyzer = WebsiteAnalyzer()

ALLOWED_EXTENSIONS = {'pdf'}
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            cursor.execute("SELECT id FROM users WHERE id = %s", (data['user_id'],))
            current_user = cursor.fetchone()
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            return f(*args, **kwargs, user_id=current_user[0])
        except Exception as e:
            return jsonify({'message': 'Invalid token'}), 401
    return decorated

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db():
    global processor, conn, cursor, evaluator
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                token TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Files table
            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                uploaded BOOLEAN NOT NULL,
                upload_id TEXT,
                s3_uploaded BOOLEAN DEFAULT FALSE,
                UNIQUE (user_id, file_path)
            );

            -- Responses table
            CREATE TABLE IF NOT EXISTS responses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_path TEXT NOT NULL,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Lab documents table
            CREATE TABLE IF NOT EXISTS lab_documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_hash TEXT NOT NULL,
                summary_text TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, file_hash)
            );

            -- Lab notes table
            CREATE TABLE IF NOT EXISTS lab_notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                doc_id INTEGER REFERENCES lab_documents(id) ON DELETE CASCADE,
                file_hash TEXT NOT NULL,
                note_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_lab_notes_file_hash ON lab_notes(file_hash);
            CREATE INDEX IF NOT EXISTS idx_lab_documents_file_hash ON lab_documents(file_hash);
            CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
            CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
            CREATE INDEX IF NOT EXISTS idx_lab_documents_user_id ON lab_documents(user_id);
            CREATE INDEX IF NOT EXISTS idx_lab_notes_user_id ON lab_notes(user_id);
        """)
        conn.commit()
        
        processor = ContentProcessorNew(
            api_key=os.getenv("GOOGLE_API_KEY"),
            user_id=1,
            cursor=cursor,
            conn=conn,
        )
        
    except Exception as e:
        print(f"Database initialization error: {str(e)}")
        raise

init_db()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not all([username, email, password]):
        return jsonify({'message': 'Missing required fields'}), 400
        
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (username, email, password_hash)
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, app.config['SECRET_KEY'])
        
        return jsonify({'token': token}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'message': 'Username or email already exists'}), 409

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    cursor.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user and bcrypt.check_password_hash(user[1], password):
        token = jwt.encode({
            'user_id': user[0],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, app.config['SECRET_KEY'])
        return jsonify({'token': token}), 200
    
    return jsonify({'message': 'Invalid credentials'}), 401

def upload_file_to_s3(file_path, bucket_name, s3_file_path, user_id):
    s3_file_path = f"users/{user_id}/{s3_file_path}"
    s3_client = boto3.client('s3')
    try:
        s3_client.upload_file(file_path, bucket_name, s3_file_path)
        print(f"File uploaded to S3: s3://{bucket_name}/{s3_file_path}")
        return f"s3://{bucket_name}/{s3_file_path}"
    except Exception as e:
        print(f"Error uploading file to S3: {e}")
        return None

# def process_file_request(file_path, prompt, user_id):
#     try:
#         if not file_path:
#             return {"error": "file_path is required"}, 400

#         if file_path in cache:
#             cached_data = cache[file_path]
#             uploaded_file = cached_data["uploaded_file"]
#             file_type = cached_data["file_type"]
#             check_file_path = cached_data["full_file_path"]
#             upload_id = cached_data["upload_id"]
#         else:
#             if processor.youtube_handler.is_youtube_url(file_path):
#                 s3_file_path = f"db/users/{user_id}/videos/{re.sub(r'[^a-zA-Z0-9]', '_', file_path)}.webm"
#                 file_type = "video"
#             elif processor.youtube_handler.is_website_url(file_path):
#                 file_type="web_url"
#                 website_output= website_analyzer.process_url(file_path, prompt)
#                 processor._save_response(file_path=file_path,prompt=prompt,response=website_output)
                
#                 return website_output
#             else:
#                 print("came into else")
#                 # s3_file_path = f"db/users/{user_id}/files/{file_path}"
#                 s3_file_path=file_path
#                 file_type = processor.file_handler.determine_file_type(file_path)

#             check_file_path = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_file_path}"
            
#             cursor.execute(
#                 "SELECT file_path, uploaded, upload_id, file_type, s3_uploaded ,file_hash FROM files WHERE file_path = %s AND user_id = %s",
#                 (check_file_path, user_id)
#             )
#             existing_file = cursor.fetchone()

#             if existing_file:
#                 full_file_path = existing_file[0]
#                 upload_id = existing_file[2]
#                 file_type = existing_file[3]
#                 s3_uploaded = existing_file[4]
#                 file_hash=existing_file[5]
#                 uploaded_file = genai.get_file(upload_id)
#             else:
                
#                 uploaded_file, upload_id, file_type = processor.upload_file(file_path,s3_file_path)
#                 print(uploaded_file)
#                 print("recieved from upload_file")
#                 if not uploaded_file:
#                     return {"error": "File upload/processing failed"}, 500
#                 print("generating hash")
#                 if processor.youtube_handler.is_youtube_url(file_path):
#                     file_hash=processor._generate_file_hash(s3_file_path)
#                 else:
#                 #here file path in future need to change into cache 
#                     file_hash=processor. _generate_file_hash(file_path)
#                 print("gonna insert into dvb")
#                 cursor.execute(
#                     "INSERT INTO files (user_id,file_hash, file_path, file_type, uploaded, upload_id, s3_uploaded) VALUES (%s,%s, %s, %s, %s, %s, %s)",
#                     (user_id, file_hash,check_file_path, file_type, True, upload_id, False)
#                 )
#                 conn.commit()

#                 cache[file_path] = {
#                     "uploaded_file": uploaded_file,
#                     "file_type": file_type,
#                     "full_file_path": check_file_path,
#                     "upload_id": upload_id
#                 }

#         start=time.time()
#         response = processor.process_prompt(uploaded_file, prompt, file_type, check_file_path)
#         end=time.time()
#         print(f"Time taken for response is {end-start:.4f} seconds")
#         print(response)
#         if not response:
#             return {"error": "Content generation failed"}, 500

#         if not existing_file or not existing_file[4]:  # If file doesn't exist or isn't uploaded to S3
#             def background_upload():
#                 s3_upload_path = upload_file_to_s3(
#                     file_path=s3_file_path,
#                     bucket_name=AWS_BUCKET_NAME,
#                     s3_file_path=s3_file_path,
#                     user_id=user_id
#                 )
#                 if s3_upload_path:
#                     cursor.execute(
#                         "UPDATE files SET s3_uploaded = %s WHERE file_path = %s AND user_id = %s",
#                         (True, check_file_path, user_id)
#                     )
#                     conn.commit()
#                     if file_path in cache:
#                         cache[file_path]["s3_uploaded"] = True

#             threading.Thread(target=background_upload).start()

#         return response, 200

#     except Exception as e:
#         print(f"Error in process_file_request: {str(e)}")
#         return {"error": str(e)}, 500


import re

def process_file_request(file_path, prompt, user_id):
    try:
        if not file_path:
            return {"error": "file_path is required"}, 400

        # Determine the type of input
        is_youtube = processor.youtube_handler.is_youtube_url(file_path)
        is_web = not is_youtube and processor.youtube_handler.is_website_url(file_path)

        sanitized_path = None
        file_hash = None
        file_type = None
        response = None

        # Common variables for later use
        upload_id = None
        full_file_path = None
        uploaded_file = None

        if is_youtube or is_web:
            # For both YouTube and website URLs, we use the urls table.
            sanitized_path = re.sub(r'[^a-zA-Z0-9]', '_', file_path)
            file_type = 'video' if is_youtube else 'web_url'
            
            # Query the 'urls' table for an existing entry based on user_id and sanitized URL.
            cursor.execute(
                "SELECT upload_id, url FROM urls WHERE user_id = %s AND url = %s",
                (user_id, sanitized_path)
            )
            existing = cursor.fetchone()
            if existing:
                upload_id, full_file_path = existing
                # Process accordingly if it's a YouTube URL or a generic web URL.
                if is_youtube:
                    uploaded_file = genai.get_file(upload_id)
                    response = processor.process_prompt(uploaded_file, prompt, file_type, full_file_path)
                else:
                    print(upload_id)
                    response = website_analyzer.process_url(file_path, prompt,full_file_path)
            else:
                # If no record exists, process the URL first and then save it.
                if is_youtube:
                    uploaded_file, upload_id, _ = processor.upload_file(file_path, sanitized_path)
                    full_file_path = sanitized_path
                    response = processor.process_prompt(uploaded_file, prompt, file_type, full_file_path)
                else:
                   
                    response = website_analyzer.process_url(file_path, prompt,file_path)
                    print(response)
                    full_file_path = file_path # you may decide to store the sanitized version here
                    

                # Insert a new record into the 'urls' table.
                cursor.execute(
                    "INSERT INTO urls (user_id, url, upload_id) VALUES (%s, %s, %s)",
                    (user_id, sanitized_path, upload_id)
                )
                conn.commit()

            # Use the sanitized URL as the unique key for responses.
            media_key = sanitized_path
            cursor.execute(
                "INSERT INTO responses_new (user_id, file_type, prompt, response, media_key) VALUES (%s, %s, %s, %s, %s)",
                (user_id, file_type, prompt, response, media_key)
            )
            conn.commit()
            return response, 200

        else:
            # Handling local files.
            file_hash = processor._generate_file_hash(file_path)
            file_type = processor.file_handler.determine_file_type(file_path)
            cursor.execute(
                "SELECT upload_id, file_path FROM files_new WHERE user_id = %s AND file_hash = %s",
                (user_id, file_hash)
            )
            existing = cursor.fetchone()
            if existing:
                print("got into the files existing in process file request")
                upload_id, full_file_path = existing
                uploaded_file = genai.get_file(upload_id)
                
            else:
                uploaded_file, upload_id, _ = processor.upload_file(file_path, file_path)
                full_file_path = file_path
                cursor.execute(
                    "INSERT INTO files_new (user_id, file_path, file_hash, upload_id) VALUES (%s, %s, %s, %s)",
                    (user_id, full_file_path, file_hash, upload_id)
                )
                conn.commit()

            response = processor.process_prompt(uploaded_file, prompt, file_type, full_file_path)
            print(response)
            # For local files, use the file_hash as the media_key.
            cursor.execute(
                "INSERT INTO responses_new (user_id, file_type, prompt, response, media_key) VALUES (%s, %s, %s, %s, %s)",
                (user_id, file_type, prompt, response, file_hash)
            )
            conn.commit()
            return response, 200

    except Exception as e:
        print(f"Error in process_file_request: {str(e)}")
        return {"error": str(e)}, 500

    
@app.route('/process/<action>', methods=['POST'])
# @login_required
def process_action(action, user_id=1):
    try:
        time_start = time.time()
        file = request.files.get('file')
        question = request.form.get('message')
        url = request.form.get('url')

        if action not in ['qa', 'flashcards', 'quiz']:
            return jsonify({"error": "Invalid action"}), 400

        if not file and not url:
            return jsonify({"error": "File is missing"}), 400

        if file:
            file_path = f"/tmp/uploads/{secure_filename(file.filename)}"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            print(file_path)
            file.save(file_path)

        elif url:
            file_path = url

        prompts ={
            # "qa": f"Provide a consice and accurate answer to the provided question, the answer should be perfectly correct and apt you can give examples if necessary to make the answer more clear: {question}",
           "qa":f"""Remember your name is W.W and you are an AI assistant for the given content .For math and science queries, answer with sums and problems along with detailed explanations in your style. For contents, if they contain math/science problems, avoid theoretical responses and explain the problem's solution with a step by step solution in your style ; if they are theoretical, provide detailed explanations..Answer with the confidence and charisma of a world-class mentor—clear, engaging, and slightly playful, making even complex ideas effortless to grasp. Keep it sharp, insightful, and full of personality, like a mix of Sherlock Holmes’ precision, Feynman’s clarity, and Tyrion Lannister’s charm.
                    After answering, enhance the learning experience by:*
                    -Recommending other Key Topics apart from the topic in which question is asked like "Topics you might need to look up on 🧐" (3–5 essential concepts).
                    -Providing Follow-Up Questions apart from the topic in which question is asked like "Try to know about these questions!"(2–4 for deeper understanding).
                    -Suggest a structured learning path, outlining topics to study in a logical flow—from foundational concepts to advanced understanding for the particular question user asked like "W.W’s Blueprint: Dominate This Lesson Like a Pro! 🚀 ".
                    Make every response feel like an experience, not just an answer. Question:{question}"""
            ,"flashcards" : """
                   Analyze the entire content of the provided file and generate as many flashcards as possible, covering all key concepts, definitions, terms, important details, and examples. Be thorough in extracting and identifying all concepts from every section to ensure complete coverage of the material.
                                Each flashcard must follow this schema:
                                Generate a list of flashcards in JSON format for the given topic. Each flashcard should have a "front" containing a concise question or topic and a corresponding "back" with a clear and accurate answer. Structure the output strictly in the following format:

                        {
                        "fronts": ["front topic 1", "front topic 2", "front topic 3", "front topic 4", ...],
                        "back": ["answer of topic 1", "answer of topic 2", "answer of topic 3", "answer of topic 4", ...]
                        }
                        Example Input: "Basics of Machine Learning"

                        Example Output:

                        {
                        "fronts": ["What is supervised learning?", "What is unsupervised learning?", "Define overfitting.", "What is a training dataset?"],
                        "backS": ["A type of machine learning where the model is trained on labeled data.", "A type of machine learning where the model finds patterns in unlabeled data.", "When a model performs well on training data but poorly on new data.", "A dataset used to train a machine learning model."]
                        }
                                Be exhaustive and ensure no important concept or detail is left out.
                                Avoid redundancy and ensure that each explanation is clear, relevant, and concise.
                                Your goal is to generate the maximum number of flashcards, making sure every topic, sub-topic, and important detail is covered.
                    """,
  
            "quiz": """
               Analyze the provided file and generate at least 10 multiple-choice questions (MCQs) in strict JSON format. 
               Each question MUST follow this exact structure:
               {
                   "question": "A clear, concise question based on key concepts from the file",
                   "options": {
                       "A": "First option text",
                       "B": "Second option text", 
                       "C": "Third option text",
                       "D": "Fourth option text"
                   },
                   "correct_answer": "The letter of the correct option (A, B, C, or D)"
                   "explanation": "An explanation of the correct answer and how it relates to the question"
               }
               Guidelines:
               - Generate questions that cover different aspects of the document
               - Ensure questions are challenging but fair
               - Provide plausible distractors for incorrect options
               - If no clear content is available, return a JSON array with an error message object
               Analyze the provided file and generate at least 10 multiple-choice questions (MCQs) in strict JSON format. 
               Each question MUST follow this exact structure:

               Format the output as a JSON array within markdown code blocks, like this:
               json

               {
                   "question": "A clear, concise question based on key concepts from the file",
                   "options": {
                       "A": "First option text",
                       "B": "Second option text", 
                       "C": "Third option text",
                       "D": "Fourth option text"
                   },
                   "correct_answer": "The letter of the correct option (A, B, C, or D)"
                   "explanation": "An explanation of the correct answer and how it relates to the question"
                   "marks":2
               }
               Example output:
               [
                   {
                       "question": "What is the primary purpose of machine learning?",
                       "options": {
                           "A": "To replace human programmers",
                           "B": "To learn and improve from data",
                           "C": "To create complex algorithms",
                           "D": "To generate random predictions"
                       },
                       "correct_answer": "B"
                       "explanation": "Machine learning uses data to learn patterns and make predictions without being explicitly programmed."
                       "marks":2
                   }
               ]
               
               """
        }

        prompt = prompts.get(action)
        if not prompt:
            return jsonify({"error": "Invalid action"}), 400

        result = process_file_request(file_path, prompt, user_id)
        print("this is the result",result)
       
        return jsonify(result[0]), result[1]

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/lab/process', methods=['POST'])
# @login_required
def process_lab_document(user_id=1):
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file provided"}), 400

        temp_path = f"temp_lab_{user_id}_{secure_filename(file.filename)}"
        file.save(temp_path)

        result = processor.process_pdf(temp_path)
        print(result)
        
        if result:
            if result.get('new_summary', True):
                print('Storing if it is new -')
                cursor.execute("""
                    INSERT INTO lab_documents (
                        user_id,
                        file_hash,
                        summary_text,
                        status
                    ) VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, file_hash) DO UPDATE 
                    SET status = 'updated'
                    RETURNING id
                """, (
                    user_id,
                    result["file_hash"],
                    result["summary"],
                    "processed"
                ))
            
                doc_id = cursor.fetchone()[0]
                conn.commit()
                print("got doc_id",doc_id)
            
            else:
                print("got into else")
                # Get existing document ID
                cursor.execute(
                    "SELECT id FROM lab_documents WHERE file_hash = %s",
                    (result['file_hash'],)
                )
                
                doc_id = cursor.fetchone()[0]
                print("got doc_id")

            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)

            result["doc_id"] = doc_id
            
            return jsonify({
                "status": "success",
                "data": result
            })
        else:
            return jsonify({"error": "Failed to process document"}), 500

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route('/lab/revise', methods=['POST'])
# @login_required
def generate_lab_revision_notes(user_id=1):
    try:
        data = request.json
        summary_text = data.get("summary")
        print(summary_text)
        file_hash = data.get("file_hash")
        print(file_hash)
        doc_id = data.get("doc_id")
        print(doc_id)
        
        if not all([summary_text, file_hash, doc_id]):
            return jsonify({"error": "Missing required parameters"}), 400
        print("jus befre the cursor ")
        # Check for existing notes for this user
        cursor.execute(
            "SELECT content FROM lab_notes WHERE file_hash = %s AND user_id = %s AND note_type = 'revise'",
            (file_hash, user_id)
        )
        print("came before existing notes")
        existing_notes = cursor.fetchone()
        # doubt
        if existing_notes:
            print("there is existing notes")
            try:
                notes = {}
                notes["content"] = existing_notes[0]
            except json.JSONDecodeError as e:
                print("Error parsing JSON:", e)
                return jsonify({"error": "Error retrieving existing notes"}), 500
        else:
            print("no i came to generate revise ")
            notes = processor.generate_notes(summary_text, note_type="revision")
            if notes:
                cursor.execute("""
                    INSERT INTO lab_notes (
                        user_id,
                        doc_id,
                        file_hash,
                        note_type,
                        content
                    ) VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_id,
                    doc_id,
                    file_hash,
                    'revise',
                    notes["content"]
                ))
                
                note_id = cursor.fetchone()[0]
                conn.commit()
                
                return jsonify({
                    "status": "success",
                    "data": {
                        "note_id": note_id,
                        "notes": notes["content"]
                    }
                })
            else:
                return jsonify({"error": "Failed to generate revision notes"}), 500

        return jsonify({
            "status": "success",
            "data": {
                "notes": notes["content"]
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/lab/smart-notes', methods=['POST'])
# @login_required
def generate_lab_smart_notes(user_id=1):
    try:
        data = request.json
        summary_text = data.get("summary")
        file_hash = data.get("file_hash")
        doc_id = data.get("doc_id")
        
        if not all([summary_text, file_hash, doc_id]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Check for existing smart notes
        cursor.execute(
            "SELECT content FROM lab_notes WHERE file_hash = %s AND user_id = %s AND note_type = 'smart'",
            (file_hash, user_id)
        )
        existing_notes = cursor.fetchone()
        
        if existing_notes:
            try:
                notes = {}
                notes["content"] = existing_notes[0]
            except json.JSONDecodeError as e:
                print("Error parsing JSON:", e)
                return jsonify({"error": "Error retrieving existing notes"}), 500
        else:
            start_generate_smart = time.time()
            notes = processor.generate_notes(summary_text, note_type="smart-notes")
            end_generate_notes = time.time()
            print(f"Time taken to generate smart notes: {end_generate_notes - start_generate_smart:.4f} seconds")

            if notes:
                try:
                    cursor.execute("""
                        INSERT INTO lab_notes (
                            user_id,
                            doc_id,
                            file_hash,
                            note_type,
                            content
                        ) VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        user_id,
                        doc_id,
                        file_hash,
                        'smart',
                        notes["content"]
                    ))
                    note_id = cursor.fetchone()[0]
                    conn.commit()
                except Exception as db_error:
                    print("Database error:", db_error)
                    raise
            else:
                return jsonify({"error": "Failed to generate smart notes"}), 500

        return jsonify({
            "status": "success",
            "data": {
                "notes": notes["content"]
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/evaluate', methods=['POST'])
# @login_required
def evaluate_answers(user_id):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        print("Received Data:", data)
        raw_result = evaluator.batch_evaluate(data)

        if isinstance(raw_result, str):
            result = clean_json_response(raw_result)
        else:
            result = raw_result

        if "responses" not in result:
            return jsonify({"error": "Invalid response format"}), 500

        parsed_responses = [
            {
                "question_number": response.get("question_number"),
                "Correctness": response.get("Correctness"),
                "Score": response.get("Score"),
                "Feedback": response.get("Feedback")
            }
            for response in result.get("responses", [])
        ]

        # Store evaluation results
        cursor.execute(
            "INSERT INTO responses (user_id, file_path, prompt, response) VALUES (%s, %s, %s, %s)",
            (user_id, "evaluation", "evaluate", json.dumps(parsed_responses))
        )
        conn.commit()

        return jsonify({
            'status': 'success',
            'responses': parsed_responses
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/images/<path:filename>')
# @login_required
def serve_image(filename, user_id):
    # Ensure the requested image belongs to the user
    image_path = os.path.join('images', str(user_id), filename)
    if os.path.exists(image_path):
        return send_from_directory('images', os.path.join(str(user_id), filename))
    return jsonify({"error": "Image not found"}), 404

def clean_json_response(result):
    # try:
    #     response_string = re.sub(r'^.*?json\s*|\s*.*$', '', result, flags=re.MULTILINE | re.DOTALL).strip()
    #     print("Response String:", response_string)
    #     return response_string
    # except Exception as e:
    #     return {"error": f"An error occurred: {str(e)}"}
    print(type(result))
    start_index = result.find('{')  # Find the first '{'
    end_index = result.rfind('}')  # Find the last '}'

    if start_index != -1 and end_index != -1:
        # Extract the JSON substring
        result = result[start_index:end_index + 1]
    return result

# def clean_json_response(result):
#     # Check if the input is a tuple and extract the string (assuming the first element is the string)
#     if isinstance(result, tuple):
#         result_str = result[0]  # Adjust index if the string is in a different position
#     else:
#         result_str = str(result)  # Ensure it's a string even if it's not a tuple

#     # Extract JSON substring between the first '{' and last '}'
#     start_index = result_str.find('{')
#     end_index = result_str.rfind('}')

#     if start_index != -1 and end_index != -1:
#         cleaned_json = result_str[start_index:end_index + 1]
#     else:
#         cleaned_json = '{}'  # Return empty JSON or handle the error as needed

#     return cleaned_json
            

def process_file(file_path, user_id):
    image_dir = f"/tmp/image/{user_id}/"
    os.makedirs(image_dir, exist_ok=True)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")

    if os.path.exists(image_dir) and os.path.isdir(image_dir):
        image_files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        if image_files:
            image_path = os.path.join(image_dir, image_files[4])
            image_generator = ImageCaseStudyGenerator(file_path, image_path)
            return image_generator.generate_paper()
    
    text_generator = QuestionPaperGenerator(file_path)
    return text_generator.generate_paper()

@app.route('/generate', methods=['POST'])
# @login_required
def generate_questions(user_id=1):
    try:
        time_start = time.time()
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400

        upload_dir = f"/tmp/uploads/{user_id}"
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, secure_filename(file.filename))
        file.save(file_path)
        file_hash = processor. _generate_file_hash(file_path)
        
        result = process_file(file_path, user_id)
        
        import shutil
        shutil.rmtree(upload_dir)
        
        time_end = time.time()
        print("Time taken:", time_end - time_start)
        
        result = clean_json_response(result)
        file_type="Question paper"
        # Store generation results
        print("got the result and it is this --")
        print(result)
        print(user_id,"user_id")
        print(file_hash,"file_path")
        print(file_type,"file_type")

        cursor.execute(
            "INSERT INTO responses_new (user_id, media_key, file_type,prompt, response) VALUES (%s, %s, %s, %s, %s)",
            (user_id, file_hash, file_type, "generate qp", result)
        )
        conn.commit()
        print("result stored successfully")
        
        return jsonify({
            "final_output": result
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Please check your input files and try again"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)