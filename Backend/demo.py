# import os
# from flask import Flask, request, jsonify, send_from_directory
# from yt_dlp import YoutubeDL
# import whisper
# import torch
# import subprocess
# from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
# from deep_translator import GoogleTranslator
# from gtts import gTTS
# import requests
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_community.vectorstores import FAISS
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.chains.question_answering import load_qa_chain
# from langchain.prompts import PromptTemplate

# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes
# GOOGLE_GEMINI_KEY='AIzaSyC130_sBUXuWRMAzK4CfQT45SGLpq6-_As'
# # Ensure that the Whisper model runs on GPU if available
# device = "cuda" if torch.cuda.is_available() else "cpu"
# model = whisper.load_model("base").to(device)
# os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
# # Create a directory to serve static files
# STATIC_DIR = 'static'
# os.makedirs(STATIC_DIR, exist_ok=True)

# def get_text_chunks(text):
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
#     chunks = text_splitter.split_text(text)
#     return chunks

# def get_vector_store(text_chunks):
#     embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_GEMINI_KEY)
#     vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
#     vector_store.save_local("saiss_index")
# def get_conversational_chain():
#     prompt_template = """   
#     Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
#     provided context try to relate it with context and provide answer, but don't provide the wrong answer.\n\n
#     Context:\n {context}?\n
#     Question: \n{question}\n

#     Answer:
#     """

#     model = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3, google_api_key=GOOGLE_GEMINI_KEY)
#     prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
#     chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

#     return chain

# def user_input(user_question):
#     embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_GEMINI_KEY)
   
#     new_db_files = FAISS.load_local("saiss_index", embeddings, allow_dangerous_deserialization=True)
    
#     docs = new_db_files.similarity_search(user_question, k=10)
    
#     chain = get_conversational_chain()

#     response = chain(
#         {"input_documents": docs, "question": user_question}, return_only_outputs=True
#     )

#     return response["output_text"]
# def translate_fn(lang, text):
#     try:
#         # Use transformers for more accurate translation
#         from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

#         # Mapping of language codes
#         lang_map = {
#             'ta': 'tamil',
#             'hi': 'hindi',
#             'en': 'english'
#         }

#         # Select appropriate model based on language
#         if lang == 'ta':
#             model_name = "Helsinki-NLP/opus-mt-en-ta"
#         elif lang == 'hi':
#             model_name = "Helsinki-NLP/opus-mt-en-hi"
#         else:
#             return text  # Return original text if language not supported

#         # Load tokenizer and model
#         tokenizer = AutoTokenizer.from_pretrained(model_name)
#         model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

#         # Prepare input
#         inputs = tokenizer(text, return_tensors="pt", max_length=512, truncation=True)

#         # Generate translation
#         outputs = model.generate(**inputs, max_length=512)
#         translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

#         print(f"Translation to {lang_map.get(lang, lang)} successful")
#         print(f"Original text length: {len(text)}")
#         print(f"Translated text length: {len(translated_text)}")

#         return translated_text
#     except Exception as e:
#         print(f"Advanced translation error: {e}")
#         # Fallback to GoogleTranslator if advanced translation fails
#         try:
#             from deep_translator import GoogleTranslator
#             translator = GoogleTranslator(source='auto', target=lang)
#             translated_text = translator.translate(text)
#             return translated_text
#         except Exception as fallback_error:
#             print(f"Fallback translation error: {fallback_error}")
#             return text  # Return original text if all translation methods fail

# def download_audio_from_youtube(url, output_path='.'):
#     if not os.path.exists(output_path):
#         os.makedirs(output_path)
    
#     ydl_opts = {
#         'format': 'bestaudio/best',
#         'outtmpl': f'{output_path}/sample.%(ext)s',
#         'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'wav'}],
#     }

#     with YoutubeDL(ydl_opts) as ydl:
#         ydl.download([url])
    
#     return os.path.join(output_path, "sample.wav")

# def convert_audio_for_transcription(input_filename):
#     output_filename = os.path.join(os.path.dirname(input_filename), "temp_converted.wav")
#     try:
#         subprocess.run(['ffmpeg', '-i', input_filename, '-ar', '16000', '-ac', '1', output_filename], check=True)
#         return output_filename
#     except subprocess.CalledProcessError as e:
#         print(f"Error converting audio: {e}")
#         return None

# def transcribe_audio_file(audio_filename):
#     temp_filename = convert_audio_for_transcription(audio_filename)
#     if temp_filename:
#         try:
#             result = model.transcribe(temp_filename, fp16=torch.cuda.is_available(),verbose=True)
#             os.remove(temp_filename)
#             return result['text']
#         except Exception as e:
#             print(f"Error transcribing audio file {audio_filename}: {e}")
#             os.remove(temp_filename)
#             return "[Error processing the audio file]"
#     else:
#         return "[Conversion failed, no transcription performed]"

# def text_to_speech(text, lang_code):
#     # Language code mapping for gTTS and alternative TTS libraries
#     gtts_lang_map = {
#         'ta': 'ta',   # Tamil
#         'hi': 'hi',   # Hindi
#         'en': 'en'    # English
#     }
    
#     # Default to English if language not supported
#     mapped_lang_code = gtts_lang_map.get(lang_code, 'en')
    
#     try:
#         print(f"Generating TTS for language: {mapped_lang_code}")
        
#         # Try gTTS first
#         tts = gTTS(text=text, lang=mapped_lang_code, slow=False)
#         output_file = os.path.join(STATIC_DIR, f"output_{mapped_lang_code}.mp3")
#         tts.save(output_file)
#         print(f"TTS file saved: {output_file}")
#         return output_file
    
#     except Exception as gtts_error:
#         print(f"gTTS error: {gtts_error}")
        
#         try:
#             # Fallback to alternative TTS libraries if gTTS fails
#             from TTS.utils.manage import ModelManager
#             from TTS.utils.synthesizer import Synthesizer
            
#             # Download and use a multilingual model
#             model_manager = ModelManager()
#             model_path, config_path, _ = model_manager.download_model("tts_models/multilingual/multi-dataset/your_tts")
#             synthesizer = Synthesizer(
#                 model_path, 
#                 config_path, 
#                 use_cuda=torch.cuda.is_available()
#             )
            
#             # Generate speech with language specification
#             wav = synthesizer.tts(text, language=mapped_lang_code)
#             output_file = os.path.join(STATIC_DIR, f"output_{mapped_lang_code}_tts.wav")
#             synthesizer.save_wav(wav, output_file)
#             print(f"Alternative TTS file saved: {output_file}")
#             return output_file
        
#         except Exception as alternative_error:
#             print(f"Alternative TTS error: {alternative_error}")
            
#             # Final fallback: return a default English audio
#             try:
#                 fallback_tts = gTTS(text=text, lang='en', slow=False)
#                 fallback_file = os.path.join(STATIC_DIR, "output_fallback.mp3")
#                 fallback_tts.save(fallback_file)
#                 print("Fallback to English TTS")
#                 return fallback_file
#             except Exception as final_error:
#                 print(f"Final TTS fallback error: {final_error}")
#                 return None

# @app.route('/process', methods=['POST'])
# def process():
#     print("Processing YouTube URL")
#     data = request.json
    
#     youtube_url = data.get("youtube_url")
#     # Use the passed language code, default to Tamil if not specified
#     language_code = data.get("language", "ta")
#     print(f"Selected Language Code: {language_code}")

#     if youtube_url:
#         # Download and transcribe
#         audio_file = download_audio_from_youtube(youtube_url)
#         transcript = transcribe_audio_file(audio_file)
#         print("Original Transcript:", transcript)
        
#         # Translate to the specified language
#         translated_text = translate_fn(language_code, transcript)
#         print(f"Translated Transcript ({language_code}):", translated_text)
        
#         # Generate text chunks and vector store (optional, can be removed if not needed)
#         text = get_text_chunks(transcript)
#         get_vector_store(text)
        
#         # Convert translated text to speech in the specified language
#         output_audio_file = text_to_speech(translated_text, language_code)
#         print(f'TTS completed for language: {language_code}')
#         print(f'Output audio file: {output_audio_file}')
        
#         return jsonify({
#             "transcript": transcript,
#             "translated_text": translated_text,
#             "audio_url": f"/static/{os.path.basename(output_audio_file)}"
#         })

#     return jsonify({"error": "YouTube URL not provided"}), 400

# @app.route('/answer', methods=['POST'])
# def answer():
#     # Get question from frontend
#     data = request.json
#     user_question = data.get("question")

#     if user_question:
#         # Generate an answer
#         try:
#             answer = user_input(user_question)
#             return jsonify({"answer": answer})
#         except Exception as e:
#             return jsonify({"error": str(e)}), 500

#     return jsonify({"error": "No question provided"}), 400

# @app.route('/static/<path:filename>', methods=['GET'])
# def serve_static(filename):
#     return send_from_directory(STATIC_DIR, filename, mimetype='audio/mpeg')

# if __name__ == '__main__':
#     app.run(debug=True)

import os
from flask import Flask, request, jsonify, send_from_directory
from yt_dlp import YoutubeDL
import whisper
import torch
import subprocess
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from googletrans import Translator
from gtts import gTTS
import requests
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate

from langchain.text_splitter import RecursiveCharacterTextSplitter
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
GOOGLE_GEMINI_KEY='AIzaSyC130_sBUXuWRMAzK4CfQT45SGLpq6-_As'
# Ensure that the Whisper model runs on GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("base").to(device)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
# Create a directory to serve static files
STATIC_DIR = 'static'
os.makedirs(STATIC_DIR, exist_ok=True)

def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    chunks = text_splitter.split_text(text)
    return chunks

def get_vector_store(text_chunks):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_GEMINI_KEY)
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local("saiss_index")
def get_conversational_chain():
    prompt_template = """   
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
    provided context try to relate it with context and provide answer, but don't provide the wrong answer.\n\n
    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3, google_api_key=GOOGLE_GEMINI_KEY)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain

def user_input(user_question):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_GEMINI_KEY)
   
    new_db_files = FAISS.load_local("saiss_index", embeddings, allow_dangerous_deserialization=True)
    
    docs = new_db_files.similarity_search(user_question, k=10)
    
    chain = get_conversational_chain()

    response = chain(
        {"input_documents": docs, "question": user_question}, return_only_outputs=True
    )

    return response["output_text"]
def translate_fn(lang,text):
    translator = Translator()
    translate=translator.translate(text=text, dest=lang)
    return translate.text

def download_audio_from_youtube(url, output_path='.'):
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_path}/sample.%(ext)s',
        'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'wav'}],
    }

    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    return os.path.join(output_path, "sample.wav")

def convert_audio_for_transcription(input_filename):
    output_filename = os.path.join(os.path.dirname(input_filename), "temp_converted.wav")
    try:
        subprocess.run(['ffmpeg', '-i', input_filename, '-ar', '16000', '-ac', '1', output_filename], check=True)
        return output_filename
    except subprocess.CalledProcessError as e:
        print(f"Error converting audio: {e}")
        return None

def transcribe_audio_file(audio_filename):
    temp_filename = convert_audio_for_transcription(audio_filename)
    if temp_filename:
        try:
            result = model.transcribe(temp_filename, fp16=torch.cuda.is_available(),verbose=True)
            os.remove(temp_filename)
            return result['text']
        except Exception as e:
            print(f"Error transcribing audio file {audio_filename}: {e}")
            os.remove(temp_filename)
            return "[Error processing the audio file]"
    else:
        return "[Conversion failed, no transcription performed]"

def text_to_speech(text, lang_code):
    tts = gTTS(text=text, lang=lang_code, slow=False)
    output_file = os.path.join(STATIC_DIR, f"output_{lang_code}.mp3")
    tts.save(output_file)
    return output_file

@app.route('/process', methods=['POST'])
def process():
    print("hello")
    data = request.json
    
    youtube_url = data.get("youtube_url")
    print("hello")

    if youtube_url:
        # Download and transcribe
        audio_file = download_audio_from_youtube(youtube_url)
        transcript = transcribe_audio_file(audio_file)
        print(transcript)
        text = get_text_chunks(transcript)
        get_vector_store(text)
                                             
        # Translate
        
        translated_text = translate_fn('ta',transcript)
        # Convert to speech
        output_audio_file = text_to_speech(translated_text, 'ta')
        print('tts done')
        return jsonify({
            "transcript": transcript,
            "translated_text": translated_text,
            "audio_url": f"/static/{os.path.basename(output_audio_file)}"
        })

    return jsonify({"error": "YouTube URL not provided"}), 400
@app.route('/answer', methods=['POST'])
def answer():
    # Get question from frontend
    data = request.json
    user_question = data.get("question")

    if user_question:
        # Generate an answer
        try:
            answer = user_input(user_question)
            return jsonify({"answer": answer})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "No question provided"}), 400

@app.route('/static/<path:filename>', methods=['GET'])
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename, mimetype='audio/mpeg')

if __name__ == '__main__':
    app.run(debug=True)
