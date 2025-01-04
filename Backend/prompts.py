PROMPTS = {
            "qa": lambda question: question,
            "notes": lambda _: """
                         Analyze the provided document and generate detailed, well-organized smart notes. Ensure the notes are structured and informative, while capturing the essence of the document. The notes should include the following sections:
                         Overview:
                                 A high-level summary of the content, outlining the main topics and objectives. Provide a clear understanding of the purpose and scope of the material, offering context for the reader.
                         Key Concepts:
                                 A comprehensive list of the most important ideas, terms, or topics discussed in the document. For each concept, include a detailed explanation that clarifies its meaning, relevance, and relationship to other concepts in the document.
                         Critical Points:
                                 A summary of essential takeaways, key facts, and examples that are crucial for understanding the material. Emphasize important details that students must grasp, such as unique insights, data, or case studies.
                         Application:
                                 Provide detailed notes on how the concepts and critical points can be applied in real-world contexts or exams. Offer practical examples, potential use cases, or scenarios where these ideas might be relevant or tested.
                         Additional Insights:
                                 Include any additional important information, such as potential pitfalls, common misconceptions, or advanced topics that provide a deeper understanding of the subject.
                         the notes should contain all the topics listed above without leaving any headings above 
                         Ensure the notes are clear, concise, and easy to scan. Prioritize critical information while making sure that every section is well-explained and free of redundancy.
                         Strictyly dont provide the introductory paragraph as heres a break down and similar to that be oin context start your response from the overview
                    """,

            "flashcards": lambda _: """
                                Analyze the entire content of the provided file and generate as many flashcards as possible, covering all key concepts, definitions, terms, important details, and examples. Be thorough in extracting and identifying all concepts from every section to ensure complete coverage of the material.
                                Each flashcard must follow this schema:
                                Key: The title or heading of the concept (e.g., a term, topic, question, or key idea).
                                Value: A concise yet clear explanation, description, or answer to the concept, including relevant examples or context if needed.
                                Ensure the flashcards capture every possible piece of information that could be useful for learning or revision. The output should be a dictionary where each key-value pair represents a flashcard. Structure the flashcards as:
                            {  
                                "Concept 1 Title": "Brief explanation or description of Concept 1",  
                                "Concept 2 Title": "Brief explanation or description of Concept 2",  
                                ...  
                            }  
                                Be exhaustive and ensure no important concept or detail is left out.
                                Avoid redundancy and ensure that each explanation is clear, relevant, and concise.
                                Your goal is to generate the maximum number of flashcards, making sure every topic, sub-topic, and important detail is covered.
                                                        
                            """,

            "summary": lambda _: """
                            Analyze the entire content of the provided file and generate a summary that includes all headings and their corresponding content. Each heading should be followed by a detailed summary paragraph that captures the key points and essential ideas of that section. Additionally, for each section, provide a brief 150-word bullet-point summary to highlight the most important takeaways. Ensure the summary follows this structure:
                                Headings:
                                    Include every heading or sub-heading from the document to ensure full coverage.
                                For each heading, provide a summary paragraph (around 150 words) that concisely explains the content, focusing on the core ideas, concepts, and important details.
                                Bullet-Point Summary:
                                    Under each heading, list key points as brief bullet points (about 3-5 points).
                                    Each bullet point should capture the most important takeaway, fact, or concept from the section.
                                Overall Organization:
                                    The summary should be logically organized, following the structure of the original document.
                                    Ensure smooth transitions between sections, making the summary suitable for quick revision and easy comprehension by students.
                                Clarity and Simplicity:
                                    Complex ideas should be simplified for clarity without losing essential information.
                            Ensure the content is clear, concise, and free of redundancy.
                        """,

            "keypoints": lambda _: """
                            Analyze the provided file and generate a comprehensive last-minute revision guide, ensuring the following structure:
                            Headings and Two-Liner Summaries(dont include this(wordings) in your response):
                                For each heading or subheadingin the file provided, provide a two-line summary that captures the core essence of that section.
                                The two-liner should succinctly explain the topic, including key concepts, critical points, and important details, ensuring that no significant information is left out.
                            Example format:
                                Machine Learning:
                                Machine learning is a subset of artificial intelligence that enables a system to autonomously learn and improve using neural networks and deep learning, without being explicitly programmed, by feeding it large amounts of data.
                            Formulas Section:
                                If the content includes formulas, create a separate section titled 'Formulas'.
                                List all formulas from the file in a bulleted format, providing the formula name or context (if available).
                                Each formula should be accompanied by a brief description of its relevance or application in the material.
                            Organization:
                                The output should be well-organized and easy to scan. Ensure that each heading and subheading is followed by its two-liner summary.
                                The content should be structured clearly, making it easy for students to revise and grasp key concepts quickly before exams.
                            Clarity and Simplicity:
                                Ensure the content is clear, concise, and free of redundancy.
                            Ensure all topics are covered effectively, with no heading or formula overlooked.
                        """    ,
            "quiz": lambda _: """
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
                   }
               ]
               """
        }