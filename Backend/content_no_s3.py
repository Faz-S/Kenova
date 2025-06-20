import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
import autogen
import PyPDF2
from aws import upload_file_to_s3, retrieve_s3_file_content
import hashlib
import time
from autogen import config_list_from_json
from file_handler import FileHandler
from youtube_handler import YouTubeHandler
from uploader import Uploader
import fitz
import re
import ast
import psycopg2
from psycopg2.extras import Json

class ContentProcessorNew:
    def __init__(self, api_key, user_id, cursor=None, conn=None):
        self.api_key = api_key
        self.user_id = user_id
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
        self.cursor = cursor
        self.conn = conn
        self.file_handler = FileHandler()
        self.youtube_handler = YouTubeHandler()
        self.uploader = Uploader(api_key)
        self.llm_config = {
            "config_list": self._load_gemini_config(),
            "seed": 53,
            "temperature": 0.7,
        }

    def _load_gemini_config(self):
        """Load Gemini configuration"""
        gemini_config_list = config_list_from_json(
            "OAI_CONFIG_LIST.json",
            filter_dict={"model": ["deepseek-r1-distill-llama-70b"]},
        )
        return gemini_config_list

    def _generate_file_hash(self, file_path):
        """Generate a unique hash for the file content"""
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hasher.update(chunk)
        return hasher.hexdigest()[:12]

    def _check_existing_summary(self, file_hash):
        """Check if summary already exists for this file"""
        if self.cursor:
            try:
                self.cursor.execute("""
                    SELECT summary_text, status 
                    FROM lab_documents 
                    WHERE file_hash = %s AND user_id = %s
                """, (file_hash, self.user_id))
                return self.cursor.fetchone()
            except Exception as e:
                print(f"Error checking existing summary: {str(e)}")
                return None
        return None

    def _save_file_record(self, file_path, file_type, upload_id=None):
        """Save file record to database"""
        if self.cursor and self.conn:
            try:
                self.cursor.execute("""
                    INSERT INTO files 
                    (user_id, file_path, file_type, uploaded, upload_id)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, file_path) 
                    DO UPDATE SET 
                        file_type = EXCLUDED.file_type,
                        uploaded = EXCLUDED.uploaded,
                        upload_id = EXCLUDED.upload_id
                    RETURNING id
                """, (self.user_id, file_path, file_type, True if upload_id else False, upload_id))
                file_id = self.cursor.fetchone()[0]
                self.conn.commit()
                return file_id
            except Exception as e:
                print(f"Error saving file record: {str(e)}")
                self.conn.rollback()
                return None

   

    def _save_response(self, file_path, prompt, response):
        """Save chat response to database"""
        if self.cursor and self.conn:
            try:
                self.cursor.execute("""
                    INSERT INTO responses 
                    (user_id,file_path, prompt, response)
                    VALUES (%s, %s, %s,%s)
                """, (self.user_id, file_path, prompt, response))
                self.conn.commit()
            except Exception as e:
                print(f"Error saving response: {str(e)}")
                self.conn.rollback()

    def extract_text_from_pdf(self,pdf_path):
        doc = fitz.open(pdf_path)
        text = "\n".join(page.get_text("text") for page in doc)
        return text

    def chunk_text(self,text, max_length=5000, overlap=1000):
        """Splits text into chunks with overlap to preserve context"""
        chunks = []
        for i in range(0, len(text), max_length - overlap):
            chunks.append(text[i:i + max_length])
        return chunks

    def summarize_text(self,text):
        # prompt = f'''"Classify the given study material as Science, Mathematics, Literature, or Social Science. Then, summarize the key topics and relevant details concisely. Output only the summary without headings or subtopics. Input: {text}'''
        # prompt=f'''Classify the input as Science, Math, Literature, or Social Science. Extract only category-specific details-if 1)Math: Key problem types (e.g., integrals, linear equations) and core formulas/theorems. or 2)Science: Equations, laws, or experiments (e.g., Newton’s laws, redox reactions). or 3)Social Science: Major events, dates, and their significance. or 4)Literature: Themes, symbols, and literary devices. Exclude irrelevant details. Summarize concisely Input: {text} as instructed'''
        prompt=f'''Summarize the given text chunk by identifying its academic domain and extracting the most critical, domain-specific insights using a targeted approach. For each subject (Mathematics, Science, Literature, Social Science), systematically extract key definitions, theories, methodological frameworks, cause-effect relationships, and essential examples that capture the intellectual core of the content. Prioritize clarity, academic rigor, and knowledge transfer, ensuring the summary is concise, informative, and tailored to facilitate efficient student learning.Input-{text}
        Generate the summary within 4-5 lines ,should be in raw text and shouldn't be in json format'''
        response = self.model.generate_content([prompt])
        return response.text
    
    def is_image_based_pdf(self,pdf_path, text_threshold=50):
    
        text = self.extract_text_from_pdf(pdf_path)
        return len(text) < text_threshold 
    
   
    def summarize_pdf(self, pdf_path):
        if self.is_image_based_pdf(pdf_path):
            print("Detected image-based PDF. Sending entire PDF to Gemini for processing...")
            uploaded_file = genai.upload_file(pdf_path)
            prompt = """Summarize: 1. Topics & visuals. 2. Observations. 3. Analysis. Keep concise for study."""
            response = self.model.generate_content([prompt, uploaded_file])
            return response.text
        else:
            print("Detected text-based PDF. Extracting and summarizing text...")
            text = self.extract_text_from_pdf(pdf_path)
            
            # Calculate dynamic chunk size based on total text length
            total_length = len(text)
            MAX_CHUNKS = 9
            
            # If text is small enough, process it as a single chunk
            if total_length <= 7000:
                return self.summarize_text(text)
                
            # Calculate optimal chunk size to stay within MAX_CHUNKS limit
            # Add 10% to chunk_size to account for overlap
            optimal_chunk_size = min(7000, int((total_length / MAX_CHUNKS) * 1.1))
            
            # Ensure chunk size doesn't exceed max_length
            chunk_size = min(optimal_chunk_size, 7000)
            
            # Calculate overlap based on chunk size (smaller chunks = smaller overlap)
            overlap = int(chunk_size * 0.05)  # 5% overlap
            
            print(f"Processing text with chunk size: {chunk_size}, overlap: {overlap}")
            chunks = self.chunk_text(text, max_length=chunk_size, overlap=overlap)
            
            # Verify number of chunks
            if len(chunks) > MAX_CHUNKS:
                # Recalculate chunk size to force MAX_CHUNKS
                chunk_size = int(total_length / MAX_CHUNKS)
                overlap = int(chunk_size * 0.05)
                chunks = self.chunk_text(text, max_length=chunk_size, overlap=overlap)
            
            print(f"Created {len(chunks)} chunks for processing")
            
            summaries = []
            for i, chunk in enumerate(chunks):
                print(f"Summarizing chunk {i+1}/{len(chunks)}...")
                summary = self.summarize_text(chunk)
                summaries.append(summary)
            
            final_summary = " ".join(summaries)
            print("got final_Summary")
            return final_summary
        
    def process_pdf(self, input_pdf_path):
        file_hash = self._generate_file_hash(input_pdf_path)
        
        # Check existing summary
        existing_summary = self._check_existing_summary(file_hash)
        print("got existing summary")
        
        if existing_summary and existing_summary[0] and existing_summary[0].strip():
            # Return existing summary only if it exists and is not empty
            return {
                "file_hash": file_hash,
                "summary": existing_summary[0],
                "status": existing_summary[1],
                "new_summary": False
            }
        
        # Generate new summary if needed
        import time
        start = time.time()
        print("came here")
        
        # Generate new summary
        summary = self.summarize_pdf(input_pdf_path)
        end = time.time()
        print(f"{end-start:.4f} secs")
        
        # Save summary
        
        
        
        return {
            "file_hash": file_hash,
            "summary": summary,
            "status": "completed",
            "new_summary": True
        }
        

  
    def fetch_history(self, file_path):
   
        if self.cursor is None:
            return []

        try:
            self.cursor.execute("""
                SELECT prompt, response 
                FROM responses_new 
                WHERE user_id = %s AND media_key= %s
                ORDER BY created_at DESC LIMIT 5
            """, (self.user_id,file_path))  # <-- Add comma to create a tuple
            return self.cursor.fetchall()
        except Exception as e:
            print(f"Error fetching history: {str(e)}")
            return []

    def process_prompt(self, uploaded_file, prompt, file_type, full_file_path):
        """Process general prompts for AI assistant"""
        if not uploaded_file:
            print("Error: No file provided.")
            return None
        try:
            
            print("got full file path as ",full_file_path)
            # Get chat history
            history = self.fetch_history(full_file_path)
            
            # Process prompt and generate response
            prompt_history = self._process_history(history)
            prompt_template = self.get_prompt_template(file_type, prompt, prompt_history)
            print("no problem till response ")
            
            response = self.model.generate_content([prompt_template, uploaded_file])
            
            
            
            # Save response
            # self._save_response(full_file_path, prompt, response.text)
            
            return response.text
        except Exception as e:
            print(f"Failed to process prompt: {e}")
            return None

    def _process_history(self, history):
        """Process chat history for prompt context"""
        prompt_history = []
        if len(history) > 3:
            old_history = self.load_old_history(history[3:])
            summary = self.summarize_content(old_history)
            prompt_history.append(summary)
            for i in history[:3]:
                prompt_history.append({"User": i[0], "AI": i[1]})
        else:
            for i in history:
                prompt_history.append({"User": i[0], "AI": i[1]})
        return prompt_history

    def load_old_history(self, history):
        """Load and format old chat history"""
        input_history = []
        for record in history:
            input_history.append({"User": record[0], "AI": record[1]})
        return input_history

    def summarize_content(self, input_history):
        """Summarize chat history"""
        prompt_template_summarize = f'''
            You are an assistant tasked with summarizing chat conversations while retaining specific details and context.Retain all mathematical equations, problems, and user-answered questions in the summary, along with key educational content. 
            Summarize the following conversations between User and AI in 2-3 lines each:
            Input List: {input_history}
            Return in Python list format with "User" and "AI" roles.
            '''
        try:
            summarized_history = self.model.generate_content([prompt_template_summarize])
            return self.clean_and_parse_output(summarized_history.text)
        except Exception as e:
            print(f"Error summarizing content: {str(e)}")
            return input_history

    def clean_and_parse_output(self, llm_output):
        """Clean and parse LLM output"""
        try:
            match = re.search(r'\[.*\]', llm_output, re.DOTALL)
            if match:
                json_like_content = match.group(0)
                return ast.literal_eval(json_like_content)
            else:
                return None
        except Exception as e:
            print(f"Error parsing LLM output: {e}")
            return None

    def get_prompt_template(self, file_type, prompt, prompt_history):
        """Get appropriate prompt template based on file type"""
        base_template = f"""
        Chat history of previous conversation's context:
        {prompt_history}
        
        Analyze the above given chat history between the user and AI related to educational content thoroughly and answer the question below-
        Current question: {prompt}
        
        Provide a clear, concise response focusing on the specific question while considering the conversation history.
        Keep the response within 3-4 lines unless more detail is explicitly requested.
        """
        
        type_specific_templates = {
            "video": """Analyze the video content including visual elements, audio, and any text.
                    Provide educational insights and clear explanations.""",
            "image": """Analyze the image thoroughly, considering all visible details, text, and context.
                    Provide clear educational insights.""",
            "pdf": """Analyze the document content thoroughly while maintaining focus on the specific question.
                    Provide accurate, relevant information from the text."""
        }
        
        return base_template + "\n" + type_specific_templates.get(file_type, "")

    def upload_file(self, file_path, s3_file_path=None):
        """Handle file upload process"""
        try:
            # Determine file type and handle YouTube videos
            if self.youtube_handler.is_youtube_url(file_path):
                print("Processing YouTube video...")
                dir_yt = s3_file_path   
                print(dir_yt)  
                file_path = self.youtube_handler.download_youtube_video(file_path, output_filename=dir_yt)
                
                file_path=file_path+".webm"
                print("corrected file path-")
                print(file_path)
                file_type = "video"
                with open(file_path, 'rb') as file_stream:
                    uploaded_file = self.uploader.upload_file_stream(file_stream, file_type, file_path)
                    print("came before split uri ")
                    upload_id = uploaded_file.uri.split("/")[-1]
                return uploaded_file, upload_id, file_type

            else:
                file_type = self.file_handler.determine_file_type(file_path)
                if not file_type:
                    raise ValueError("Unsupported file type")

            
                with open(file_path, 'rb') as file_stream:
                    uploaded_file = self.uploader.upload_file_stream(file_stream, file_type, file_path)
                    print("came before split uri ")
                    upload_id = uploaded_file.uri.split("/")[-1]

                

                return uploaded_file, upload_id, file_type

        except Exception as e:
            print(f"Error in upload_file: {str(e)}")
            return None, None, None

    def generate_notes(self, summary_text, note_type="revision"):
        """Generate different types of notes"""
        try:
            if note_type == "revision":
                agents = self._setup_revision_agents()
                result = self._run_revision_workflow(agents, summary_text)
            else:  # smart notes
                print("came to smart ntoes")
                agents = self._setup_smart_notes_agents()
                result = self._run_smart_notes_workflow(agents, summary_text)

            if result:
                return result
            return None

        except Exception as e:
            print(f"Error generating {note_type} notes: {str(e)}")
            return None

    def _setup_revision_agents(self):
        """Setup agents for revision notes generation"""
        
        initializer = autogen.UserProxyAgent(
        name="Initializer",
        human_input_mode="NEVER",  # Automate the process without human input
        max_consecutive_auto_reply=10,
        code_execution_config=False,
        is_termination_msg=lambda msg: "json" in msg["content"].lower(),  # Termination condition
    )
        
        concept_simplification_agent = autogen.AssistantAgent( 
            name="Concept_Simplification_Agent",
        llm_config=self.llm_config,
    
        system_message='''""Generate revision notes with exam-critical content:  Lesson title, a number of topics with topic name and questions under that like 
- *Math/Science (Physics/Chem): List key formulas/theories + 2-3 **problem-solving questions* (e.g., calculations, derivations) with *step-by-step solutions*.  
- *Science (Bio/Chem/Geo) & Humanities: Highlight 2-3 **conceptual questions* (e.g., 'Explain X') with *structured answers* (flow: definition → process → example).  
Prioritize high-weightage topics. Avoid fluff."    ''',
    )

        revision_notes_agent = autogen.AssistantAgent(
                name="Revision_Notes_Agent",
                llm_config=self.llm_config,
                system_message="""""Based on the content provided by Concept_Simplification_Agent format it into this JSON (minimal spaces, no syntax bloat):  
{'lesson_title':'Title','topics': List of topics, each with:[{'topic_name':'Name','key_concepts':['List'],'qa_pairs':[{'question':'Q','answer':{'steps':['For math/science'],'key_points':['For bio/social'],'example':'Relevant case/formula'}}]},..]}  
- For math/science: Use steps and example.  
- For others: Use key_points and example.  
Exclude empty fields.Also, don't add extra context in the output provided; just give the JSON of the output """,
            )


        return [initializer,concept_simplification_agent,revision_notes_agent]

    def _setup_smart_notes_agents(self):
        """Setup agents for smart notes"""
        initializer = autogen.UserProxyAgent(
            name="Initializer",
            human_input_mode="NEVER",  # Automate the process without human input
            max_consecutive_auto_reply=10,
            code_execution_config=False,
            is_termination_msg=lambda msg: "json" in msg["content"].lower(),  # Termination condition
        )

        content_generation_agent = autogen.AssistantAgent(name="Content_Generation_Agent",
            llm_config=self.llm_config,
            system_message="""Simplify all the concepts, provide examples, create mnemonics, and generate inspecific exam tips  for each topic. Use 1-2 sentences for concepts, 1-2 examples, 1 mnemonic, and 2-3 exam tips per topic.The topic name must be a specific concept from the lesson summary, not a general one.  Respond concisely with bullet points.""",
            )

        smart_notes_agent = autogen.AssistantAgent(name="Smart_Notes_Agent",
        llm_config=self.llm_config,
        system_message="""Structure smart notes into JSON format. Include:
        - "lesson_title": Lesson title.
        - "lesson_summary": 2-3 line summary.
        - "topics": List of topics, each with:
        - "topic_name": Topic name.
        - "summary": 1-2 line summary.
        - "simplified_concept": Simplified explanation.
        - "key_points": List of key points.
        - "real_time_examples": List of examples with "description" and "application".
        - "mnemonics": List of mnemonics with "phrase" and "explanation".
        - "exam_tips": List of tips for studying and exams.
        Respond only with the JSON structure.Remember only provide the json dont add any context extra in the output provided *only* json.""",
        )

        
        return [initializer,content_generation_agent,smart_notes_agent]

  
    
    
    def _run_revision_workflow(self, agents, content):
        print("Agents received:", [agent.name for agent in agents])  # Debugging: Print agent names

        # Extract agents from the list and map them to their roles
        agent_roles = {
            "Initializer": None,
            "Concept_Simplification_Agent": None,
              # Fixed case sensitivity
            "Revision_Notes_Agent": None,  # Fixed case sensitivity
        }

        # Map agents to their roles
        for agent in agents:
            if agent.name in agent_roles:
                agent_roles[agent.name] = agent
            else:
                print(f"Warning: Agent '{agent.name}' not found in agent_roles.")  # Debugging: Print unmapped agents

        # Ensure all agents are found
        if None in agent_roles.values():
            missing_agents = [key for key, value in agent_roles.items() if value is None]
            raise ValueError(f"One or more agents are missing in the list: {missing_agents}")

        # Assign agents to variables for easier access
        initializer = agent_roles["Initializer"]
        concept_simplification_agent = agent_roles["Concept_Simplification_Agent"]
          # Fixed case sensitivity
        revision_notes_agent = agent_roles["Revision_Notes_Agent"]  # Fixed case sensitivity

        # Define the state transition function
        def rev_state_transition(last_speaker, groupchat):
            if last_speaker is initializer:
                return concept_simplification_agent
            elif last_speaker is concept_simplification_agent:
                return revision_notes_agent
            elif last_speaker is revision_notes_agent:
                return None
            else:
                return None

        # Run the group chat
        groupchat = GroupChat(
            agents=agents,
            messages=[],
            max_round=5,
            speaker_selection_method=rev_state_transition,
        )
        manager = GroupChatManager(groupchat=groupchat, llm_config=self.llm_config)

        # Initiate the chat with the initializer
        initializer.initiate_chat(
            manager,
            message=f"Generate revision notes for the following content:\n\n{content}",
        )

        # Extract the final JSON output from the last message
        result = groupchat.messages[-1]["content"]

        print("revise-",result)
        
        
        
        
        # Extract JSON from the result
        start_index = result.find('{')  # Find the first '{'
        end_index = result.rfind('}')  # Find the last '}'

        if start_index != -1 and end_index != -1:
            # Extract the JSON substring
            result = result[start_index:end_index + 1]
            
            print("came to format")
            # Parse JSON
            

        # Format and return the output
        return self._format_output(raw_output=result, note_type="revision_notes")
        
    

        # Define the state transition function
    def _run_smart_notes_workflow(self, agents, content):
    # Extract agents from the list and map them to their roles
        for agent in agents:
            print(agent)
        agent_roles = {
            "Initializer": None,
            "Content_Generation_Agent":None,
            "Smart_Notes_Agent": None,
        }

        for agent in agents:
            if agent.name in agent_roles:
                agent_roles[agent.name] = agent

        # Ensure all agents are found
        if None in agent_roles.values():
            raise ValueError("One or more agents are missing in the list.")

        # Assign agents to variables for easier access
        initializer = agent_roles["Initializer"]
        content_generation_agent=agent_roles["Content_Generation_Agent"]
        smart_notes_agent = agent_roles["Smart_Notes_Agent"]

        # Define the state transition function
        def state_transition(last_speaker, groupchat):
            if last_speaker is initializer:
                # Initializer -> Concept Simplification Agent
                return content_generation_agent
            elif last_speaker is content_generation_agent:
                # Concept Simplification Agent -> Examples Agent
                return smart_notes_agent
            elif last_speaker is smart_notes_agent:
                # Smart Notes Agent -> Terminate
                return None
            else:
                # Default termination
                return None

        # Run the group chat
        groupchat = GroupChat(
            agents=agents,
            messages=[],
            max_round=3,
            speaker_selection_method=state_transition,
        )
        manager = GroupChatManager(groupchat=groupchat, llm_config=self.llm_config)

        # Initiate the chat with the initializer
        print("Started to intiate chat")
        initializer.initiate_chat(
            manager,
            message=f"Generate smart notes for the following content:\n\n{content}",
        )

        # Extract the final JSON output from the last message
        result = groupchat.messages[-1]["content"]

        start_index = result.find('{')  # Find the first '{'
        end_index = result.rfind('}')  # Find the last '}'

        if start_index != -1 and end_index != -1:
            # Extract the JSON substring
            result = result[start_index:end_index + 1]
            
        
            return self._format_output(raw_output=result, note_type="smart_notes")

        # If no valid JSON found, return an appropriate error
        raise ValueError("No valid JSON found in the response.")

    def _format_output(self, raw_output, note_type):
        """Format the output with metadata"""
        try:
            # print("result that got into format function-",raw_output)
            return {
                "type": note_type,
                "content": raw_output,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception as e:
            return {"error": f"Failed to format {note_type} output: {str(e)}"}