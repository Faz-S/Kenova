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

class CustomEmbeddingFunction:
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model

    def __call__(self, input: list) -> list:
        return self.embedding_model.embed_documents(input)

class ImageCaseStudyGenerator:

    def __init__(self, file,image_path,config_path="OAI_CONFIG_LIST.json"):
        load_dotenv()
        self.file = file
        self.encoded_image = self.encode_image_to_base64(image_path)
        self.uuid = uuid.uuid4()
        self.CHROMA_DB_PATH = f"./chroma_db-{self.uuid}"
        self.CHROMA_COLLECTION = "autogen-docs"
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
        os.makedirs(self.CHROMA_DB_PATH, exist_ok=True)
        try:
            self.chroma_client = chromadb.PersistentClient(path=self.CHROMA_DB_PATH)
            self.collection = self.chroma_client.get_or_create_collection(name=self.CHROMA_COLLECTION)

            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=os.getenv("EMBEDDING"),
                google_api_key=os.getenv("GOOGLE_API_KEY"),
            )
            self.custom_embedding = CustomEmbeddingFunction(embedding_model=self.embeddings)
            self.vector_db = Chroma(embedding_function=self.custom_embedding)
        except Exception as e:
            print(f"Error setting up ChromaDB: {str(e)}")
            raise


    @staticmethod
    def termination_msg(x):
        return isinstance(x, dict) and "TERMINATE" == str(x.get("content", ""))[-9:].upper()


    def encode_image_to_base64(self, image_path):

        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")


    def create_agents(self,image_path):
        print(self.file,"*"* 1000)
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
            system_message="Based on the retrieved content for the topics: [List of Retrieved Topics and Content], generate 2-mark short-answer questions focusing on *Remembering* and *Understanding*.",
            llm_config=self.llm_config,
        )
        
        self.long_answer =AssistantAgent(
            name="10_marks",
            is_termination_msg=self.termination_msg,
            system_message="Based on the retrieved content for the topics: [List of Retrieved Topics and Content], generate 13-mark long-answer questions that require *Evaluation* or *Creation*.",
            llm_config=self.llm_config,
        )
        

        self.molecular_analyst_agent =  AssistantAgent(
            name="Molecular_Structure_Analyst",
            system_message=f"""
            You are an advanced molecular structure analysis agent specializing in Bloom's Taxonomy 
            APPLY and CREATE levels of learning.

            Bloom's Taxonomy Guidelines:
            - APPLY Level Objectives:
              * Translate structural observations into practical scenarios
              * Demonstrate how molecular features influence real-world applications
              * Develop problem-solving questions that require applying molecular knowledge

            - CREATE Level Objectives:
              * Design innovative scenarios that extend beyond direct observation
              * Encourage hypothetical thinking and novel applications
              * Generate questions that challenge learners to synthesize and innovate

            Image Analysis Requirements:
            - Carefully analyze the provided molecular structure image: {self.encoded_image[:100]}...
            
            Specific Analysis Approach:
            1. APPLY: Transform structural insights into practical challenges
               - How can the molecular structure inform industrial or research applications?
               - What real-world problems can be solved using this molecular understanding?

            2. CREATE: Develop forward-thinking, innovative scenarios
               - Propose novel research directions inspired by the molecular structure
               - Design hypothetical applications that push current technological boundaries

            Constraints:
            - Questions must directly derive from the molecular structure image
            - Demonstrate scientific creativity and critical thinking
            - Balance between rigorous analysis and imaginative exploration
            - You can include as many questions as needed(not necessarily)
            """,
            llm_config=self.llm_config
        )


        self.final_paper  = AssistantAgent(
            name="Question_format",
            system_message="""Organize the following questions into a finalized question paper. The paper should include:
            Instuctions: Provide Basic instuctions to the students to write the exam and the marks distribution.
            1. *Short-Answer Questions (2 Marks)* focusing on Remember and Understand.(10 Questions)
            2. *Long-Answer Questions (13 Marks)* focusing on Evaluate and Create.(5 Questions)
            3. *Case Study (15 Marks)* focusing on Apply and Create.(1 Question)
            Ensure the questions are categorized, formatted appropriately, and distributed according to Bloom's Taxonomy, with a logical structure.""",
            llm_config=self.llm_config
        )
        self.json_formater = AssistantAgent(
                        name="json_formater",
                        system_message=f"""You are a JSON formatting assistant. Your task is to take the structured question paper and convert it into a well-organized JSON format. 
                        The JSON should include the following structure (Example), and the response should only be in this format without any additional quotes or text:
                        {{
                            "title": "Exam Title",
                            "instructions": [
                                "Instruction 1",
                                "Instruction 2",
                                "..."
                            ],
                            "total_marks": 100,
                            "sections": [
                                {{
                                    "section_title": "Short-Answer Questions",
                                    "total_marks": 20,
                                    "questions": [
                                        {{
                                            "question_number": 1,
                                            "question_text": "What is the general form of a quadratic polynomial in x with real coefficients?",
                                            "marks": 2
                                        }},
                                        ...
                                    ]
                                }},
                                {{
                                    "section_title": "Long-Answer Questions",
                                    "total_marks": 65,
                                    "questions": [
                                        {{
                                            "question_number": 1,
                                            "question_text": "A student claims that the relationship between the zeroes and coefficients of a polynomial is only applicable to quadratic polynomials. Evaluate this claim, using examples from the text to support your reasoning.",
                                            "marks": 13
                                        }},
                                        ...
                                    ]
                                }},
                                {{
                                    "section_title": "Case Study",
                                    "total_marks": 15,
                                    "image": "images/[molecule_image.png]",
                                    "background": "A group of students is preparing for a chemistry competition. They are reviewing concepts related to number theory, including prime factorization, HCF, LCM, and irrational numbers. They encounter a problem that requires them to apply these concepts in a practical scenario.",
                                    "problem_statement": "The students are tasked with organizing a school event. They need to arrange chairs in rows and columns such that each row has the same number of chairs, and each column has the same number of chairs. They also need to determine the minimum number of chairs required to accommodate a specific number of students. Additionally, they are exploring the properties of numbers and need to prove the irrationality of a given number.",
                                    "supporting_data": [
                                        "The total number of chairs available is 360.",
                                        "The number of students attending the event is 120.",
                                        "The students are also working on proving that √5 is an irrational number."
                                    ],
                                    "questions": [
                                        {{
                                            "question_number": 1,
                                            "question_text": "Question with specific scenario, chemical context, and clear application",
                                            "marks": X
                                        }},
                                        ...
                                    ]
                                }}
                            ]
                        }}

                        Rules and Instructions for JSON Formatting:

                        - Extract the exam title and include it as the value for "title".
                        - Include all instructions as an array under "instructions".
                        - The total marks for the exam should be added as the value for "total_marks".
                        - For each section (e.g., Short-Answer Questions, Long-Answer Questions, Case Study), create a corresponding object in the "sections" array:
                            - Use the section name as "section_title".
                            - Add the total marks for the section as "total_marks".
                            - Include all questions in the section under the "questions" array, with each question formatted as:
                                "question_number": The question number.
                                "question_text": The text of the question.
                                "marks": The marks allocated for the question.

                        STRICT FORMATTING RULES for Case Study:
                        1. TOTAL MARKS MUST EQUAL 15.
                        2. Include BOTH APPLY and CREATE level type of questions.
                        3. Each question MUST have:
                            - Clear question text.
                            - Specific marks allocation.
                        4. Use "Case Study" in "section_title".
                        5. Include the actual image filename.

                        CRITICAL CONSTRAINTS:
                        - NO additional text or explanation.
                        - PURE JSON output.
                        - VALIDATE JSON structure before outputting.
                        - Use the specific molecule image: {os.path.basename(image_path)}.

                        - Ensure all text is properly escaped to make the JSON valid.
                        - Validate the JSON output to ensure it adheres to the structure.
                        - Always maintain clear, consistent formatting. If there is any ambiguity in the question paper, use your best judgment to organize the content logically.
                        """,
                        llm_config=self.llm_config
                    )


    def setup_group_chat(self):
        self.groupchat = autogen.GroupChat(
            agents=[self.ragproxyagent, self.short_answer, self.long_answer, 
                   self.molecular_analyst_agent, self.final_paper, self.json_formater],
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