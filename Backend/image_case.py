import os
import base64
import json
import autogen
from autogen import AssistantAgent, UserProxyAgent
from autogen import config_list_from_json
from dotenv import load_dotenv
import os
import io
from textwrap import wrap
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS 
import chromadb
import autogen
import uuid
from autogen import AssistantAgent
from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent
from autogen import config_list_from_json
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
import time

class CustomEmbeddingFunction:
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model

    def __call__(self, input: list) -> list:
        return self.embedding_model.embed_documents(input)

class ImageCaseStudyGenerator:

    def __init__(self, file, image_path, config_path="OAI_CONFIG_LIST.json"):
        load_dotenv()
        self.file = file
        self.encoded_image = self.encode_image_to_base64(image_path)
        self.uuid = str(uuid.uuid4())
        self.CHROMA_DB_PATH = f"./chroma_db_{self.uuid}"
        self.CHROMA_COLLECTION = f"autogen_docs_{self.uuid}"
        
        # Ensure database directory exists
        try:
            os.makedirs(self.CHROMA_DB_PATH, exist_ok=True)
        except OSError as e:
            print(f"Error creating ChromaDB directory: {e}")
            raise
            
        self.setup_config()
        self.setup_database()   
        self.create_agents(image_path)  
        self.setup_group_chat()

    def setup_config(self):
        """Setup basic configurations for the agents."""
        self.gemini_config_list = config_list_from_json(
            "OAI_CONFIG_LIST.json",
            filter_dict={"model": [os.getenv("MODEL")]},
        )
        
        self.llm_config = {
            "config_list": self.gemini_config_list,
            "cache_seed": 42,
            "temperature": 0,
            "timeout": 300,
        }


    def setup_database(self):
        """Setup ChromaDB with unique collection and persistent storage"""
        try:
            # Initialize ChromaDB client with retry mechanism
            max_retries = 3
            retry_delay = 1  # seconds
            
            for attempt in range(max_retries):
                try:
                    self.chroma_client = chromadb.PersistentClient(path=self.CHROMA_DB_PATH)
                    self.collection = self.chroma_client.get_or_create_collection(
                        name=self.CHROMA_COLLECTION,
                        metadata={"uuid": self.uuid}
                    )
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    print(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
            
            # Setup embeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=os.getenv("EMBEDDING"),
                google_api_key=os.getenv("GOOGLE_API_KEY"),
            )
            self.custom_embedding = CustomEmbeddingFunction(embedding_model=self.embeddings)
            self.vector_db = Chroma(
                embedding_function=self.custom_embedding,
                collection_name=self.CHROMA_COLLECTION,
                persist_directory=self.CHROMA_DB_PATH
            )
            
        except Exception as e:
            print(f"Error setting up ChromaDB: {str(e)}")
            # Cleanup on failure
            if hasattr(self, 'chroma_client'):
                try:
                    self.chroma_client.delete_collection(self.CHROMA_COLLECTION)
                except:
                    pass
            raise

    def __del__(self):
        """Cleanup ChromaDB resources on object destruction"""
        try:
            if hasattr(self, 'chroma_client'):
                self.chroma_client.delete_collection(self.CHROMA_COLLECTION)
            if os.path.exists(self.CHROMA_DB_PATH):
                import shutil
                shutil.rmtree(self.CHROMA_DB_PATH)
        except:
            pass


    @staticmethod
    def termination_msg(x):
        return isinstance(x, dict) and "TERMINATE" == str(x.get("content", ""))[-9:].upper()


    def encode_image_to_base64(self, image_path):

        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")


    def create_agents(self, image_path):
        text_splitter = RecursiveCharacterTextSplitter(separators=["\n\n", "\n", "\r", "\t"])
       
 
        self.ragproxyagent = RetrieveUserProxyAgent(
            name="ragproxyagent",
            human_input_mode="NEVER",
            code_execution_config=False,
            llm_config = self.llm_config,
            retrieve_config={
                "model": self.gemini_config_list[0]["model"],
                "task": "qa",
                "update_context": True,
                "n_results": 3,
                "docs_path": [self.file],
                "chunk_token_size": 3000,
                "chunk_mode": "one_line",
                "client": self.chroma_client,
                "get_or_create": True,
                "overwrite": True,
                "vector_db": self.vector_db,
                "collection_name": self.CHROMA_COLLECTION,
                "embedding_function": self.custom_embedding,
                "custom_text_split_function": text_splitter.split_text,
            },
        )


        self.short_answer = AssistantAgent(
            name="2_marks",
            is_termination_msg=self.termination_msg,
            system_message="""Generate exactly 10 short-answer questions worth 2 marks each, focusing on Remember and Understand levels of Bloom's Taxonomy.
            Each question should be directly related to the content in the document.
            Format each question as(from pdf):
            {
                "question_number": <number>,
                "question_text": "<question>",
                "marks": 2
            }
            """,
            llm_config=self.llm_config,
        )
        
        self.long_answer = AssistantAgent(
            name="long_answer",
            is_termination_msg=self.termination_msg,
            system_message="""Generate exactly 5 long-answer questions worth 13 marks each. Mix different types of questions(From PDF).

            Example question types:
            1. Numerical: "Calculate the mass percentage of aspirin (C9H8O4) in acetonitrile (CH3CN) when 6.5 g of C9H8O4 is dissolved in 450 g of CH3CN."
            2. Theory: "Explain the factors affecting the solubility of gases in liquids and their significance in everyday life."
            3. Application: "How does the concept of vapor pressure explain the process of distillation? Illustrate with suitable examples."
            4. Analysis: "Compare and contrast the behavior of ideal and non-ideal solutions with respect to Raoult's law."
            5. Evaluation: "Assess the importance of colligative properties in determining molecular masses of substances."

            Follow this structure exactly:
            {
                "section_title": "Long-Answer Questions",
                "total_marks": 65,
                "questions": [
                    {
                        "question_number": 1,
                        "question_text": "<question>",
                        "marks": 13
                    }
                ]
            }

            Rules:
            1. Generate a MIX of different question types (numerical, theoretical, analytical)
            2. Generate the questions based on the content of the document
            3. Each question should be directly related to the content in the document
            4. Focus on questions that test the student's ability to: Remember and Understand levels of Bloom's Taxonomy
            5. Questions must be focused on Evaluate and Create levels of Bloom's Taxonomy
            6. NO phrases like "based on the text" or "discuss" or "Based on the provided text" ...
            7. Make questions direct and specific
            8. Each question = 13 marks
            9. Total = 65 marks
            10. Generate exactly 5 questions
            11. Include numerical values ONLY when relevant to the question
            12. Questions should test different cognitive skills""",
            llm_config=self.llm_config
        )
    
        self.case_study = AssistantAgent(
            name="case_study",
            is_termination_msg=self.termination_msg,
            system_message=f"""You are a specialized image analysis agent. Your task is to create a case study based SOLELY on the provided image.
            DO NOT use any content from the document text. Focus ONLY on what you can see in the image.Focus on the Blooms Taxonomy levels: Apply and Create(Don't add this in the response).
            
            Generate exactly 1 case study worth 15 marks that follows this structure:
            {{
                "section_title": "Case Study",
                "total_marks": 15,
                "image": "image/[image_filename.png]",
                "background": "<describe what you observe in the image>",
                "problem_statement": "<pose a problem based on the visual elements in the image>",
                "supporting_data": [
                    "<observable fact 1 from the image>",
                    "<observable fact 2 from the image>",
                    "<observable fact 3 from the image>"
                ],
                "questions": [
                    {{
                        "question_number": 1,
                        "question_text": "<question that requires analyzing the image>",
                        "marks": 15,
                        ...

                    }}
                ]
            }}
            
            Important Rules:
            1. ONLY use information visible in this image
            2. DO NOT reference any text or content from the document
            3. ALL questions must be answerable by analyzing the image
            4. You can generate as many questions as you like but be mindful on the total marks(15 marks)
            5. Questions must be focused on Apply and Create levels of Bloom's Taxonomy
            6. Focus on visual elements like:
               - Structure and components visible in the image
               - Relationships between different parts
               - Visual patterns or arrangements
               - Observable characteristics
            7. The case study should test the student's ability to:
               - Analyze visual information
               - Apply concepts to what they see
               - Make connections between visual elements
               - Draw conclusions from visual data
            8. Total = 15 marks""",
            llm_config=self.llm_config,
                # "message_format": "multimodal"
            
        )

        self.final_paper = AssistantAgent(
            name="Question_format",
            system_message="""Organize the questions into a finalized question paper with exactly this structure:
            {
                "title": "<subject> Examination",
                "instructions": [
                    "All questions are compulsory",
                    "<other relevant instructions>"
                ],
                "total_marks": 100,
                "sections": [
                    {
                        "section_title": "Short-Answer Questions",
                        "total_marks": 20,
                        "questions": [<questions from short_answer agent>]
                    },
                    {
                        "section_title": "Long-Answer Questions",
                        "total_marks": 65,
                        "questions": [<questions from long_answer agent>]
                    },
                    {
                        "section_title": "Case Study",
                        "total_marks": 15,
                        "image": "images/[image_filename.png]",
                        "background": "<brief scenario background>",
                        "problem_statement": "<clear problem description>",
                        "supporting_data": [
                            "<data point 1>",
                            "<data point 2>",
                            "<data point 3>"
                        ],
                        "questions": [
                            {
                                "question_number": 1,
                                "question_text": "<question>",
                                "marks": 15
                            }
                        ]
                    }
                ]
            }
            """,
            llm_config=self.llm_config
        )

        self.json_formater = AssistantAgent(
            name="json_formater",
            system_message="""Format the question paper into valid JSON. Do not add any additional text or quotes around the JSON.
            The output should be exactly in this format:
            {
                "title": string,
                "instructions": string[],
                "total_marks": number,
                "sections": [
                    {
                        "section_title": string,
                        "total_marks": number,
                        "questions": [
                            {
                                "question_number": number,
                                "question_text": string,
                                "marks": number
                            }
                        ]
                    },
                    {
                        "section_title": "Case Study",
                        "total_marks": number,
                        "image": "images/[image_filename.png]",
                        "background": string,
                        "problem_statement": string,
                        "supporting_data": string[],
                        "questions": [
                            {
                                "question_number": number,
                                "question_text": string,
                                "marks": number
                            }
                        ]
                    }
                ]
            }
            
            Do not include any additional text, quotes, or formatting. Just return the raw JSON object.""",
            llm_config=self.llm_config
        )


    def setup_group_chat(self):
        self.groupchat = autogen.GroupChat(
            agents=[self.ragproxyagent, self.short_answer, self.long_answer, 
                   self.case_study, self.final_paper, self.json_formater],
            messages=[],
            max_round=9,
            speaker_selection_method="round_robin"
        )
        self.manager = autogen.GroupChatManager(groupchat=self.groupchat, llm_config=self.llm_config)


    def generate_paper(self,image_path):
        self.manager.reset()
    
        output = self.ragproxyagent.initiate_chat(
            self.manager,
            problem=self.get_problem(self,image_path),
            message=self.ragproxyagent.message_generator,
            n_results=3,
        )
        
        final_output = None
        for message in output.chat_history:
            if 'content' in message:
                final_output = message['content']
        
        return final_output


    @staticmethod
    def get_problem(self,image_path):
        return f"""From the provided document or image, extract the most relevant topics, subtopics, and content. Generate a comprehensive output tailored to the input type as follows:
                Extract key topics, definitions, and related content spanning factual, conceptual, and analytical levels.
                For mathematical content, identify equations and concepts to create short-answer, long-answer, and problem-solving questions with balanced difficulty, totaling 100 marks.
                For non-mathematical content, create a mix of factual, application, and analysis questions, including diagrams and scenarios, with clear categorization by type and difficulty, totaling 100 marks.
            Generate a JSON-structured case study using the image {os.path.basename(image_path)}.
            Incorporate Bloom's Taxonomy APPLY and CREATE levels.
            Include both APPLY and CREATE questions with a total of 15 marks, ensuring specific mark allocations for each question.
            Provide a Base64 preview of the image: {self.encoded_image[:50]}....
"""


# def main():
#     image_path = "images/aceticAcid.png"
#     file = "Electric_charges_and_fields.pdf"
#     generator = ImageCaseStudyGenerator(file,image_path)
#     case_study = generator.generate_paper(image_path)
#     print(case_study)
#     return case_study


# if __name__ == "__main__":
#     main()