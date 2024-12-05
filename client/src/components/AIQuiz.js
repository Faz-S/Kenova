import React, { useState, useEffect } from 'react';
import './AIQuiz.css';

const AIQuiz = ({ uploadedFile }) => {
    const [quiz, setQuiz] = useState({
        questions: [],
        error: null,
        loading: true
    });
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showAnswers, setShowAnswers] = useState({});

    const parseQuizResponse = (response) => {
        try {
            // Handle the specific response format
            let quizData;
            
            // If response is an object with 'response' key
            if (typeof response === 'object' && response.response) {
                // Extract the JSON string from the response
                const jsonMatch = response.response.match(/```json\n([\s\S]*)\n```/);
                
                if (jsonMatch) {
                    // Parse the extracted JSON string
                    quizData = JSON.parse(jsonMatch[1]);
                } else {
                    // Fallback to parsing the entire response string
                    quizData = JSON.parse(response.response);
                }
            } 
            // If response is a string
            else if (typeof response === 'string') {
                // Try to parse as JSON directly
                const jsonMatch = response.match(/```json\n([\s\S]*)\n```/);
                
                if (jsonMatch) {
                    quizData = JSON.parse(jsonMatch[1]);
                } else {
                    quizData = JSON.parse(response);
                }
            }
            // If response is already an array
            else if (Array.isArray(response)) {
                quizData = response;
            }
            else {
                throw new Error('Unrecognized response format');
            }

            // Validate quiz data structure
            if (!Array.isArray(quizData)) {
                throw new Error('Invalid quiz response format. Expected an array.');
            }

            // If the response is empty
            if (quizData.length === 0) {
                return {
                    questions: [],
                    error: 'No quiz questions could be generated.'
                };
            }

            // Map and validate each question
            const parsedQuestions = quizData.map((q, index) => {
                // Validate question structure
                if (!q.question) {
                    throw new Error(`Invalid question structure at index ${index}: Missing question text`);
                }

                if (!q.options || 
                    !q.options.A || 
                    !q.options.B || 
                    !q.options.C || 
                    !q.options.D) {
                    throw new Error(`Invalid options structure at index ${index}`);
                }

                if (!q.correct_answer) {
                    throw new Error(`Invalid question structure at index ${index}: Missing correct answer`);
                }

                return {
                    id: index + 1,
                    text: q.question,
                    options: [
                        { label: 'A', text: q.options.A },
                        { label: 'B', text: q.options.B },
                        { label: 'C', text: q.options.C },
                        { label: 'D', text: q.options.D }
                    ],
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation || 'No additional explanation provided.'
                };
            });

            return {
                questions: parsedQuestions,
                error: null
            };
        } catch (error) {
            console.error('Full quiz parsing error:', error);
            return {
                questions: [],
                error: `Failed to parse quiz questions: ${error.message}`
            };
        }
    };

    const fetchQuiz = async () => {
        if (!uploadedFile) {
            setQuiz({
                questions: [],
                error: 'No file selected. Please upload a document to generate a quiz.',
                loading: false
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://localhost:5001/process/quiz', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Full backend response:', data);
            console.log('Response type:', typeof data.response);
            console.log('Response:', data.response);

            const parsedQuiz = parseQuizResponse(data.response);

            setQuiz({
                ...parsedQuiz,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching quiz:', error);
            setQuiz({
                questions: [],
                error: error.message || 'Failed to generate quiz',
                loading: false
            });
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, [uploadedFile]);

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        // Create a new state object to trigger re-render
        const updatedSelectedAnswers = {
            ...selectedAnswers,
            [questionIndex]: selectedOption
        };
        
        setSelectedAnswers(updatedSelectedAnswers);
        
        // Automatically show explanation when an answer is selected
        const updatedShowAnswers = {
            ...showAnswers,
            [questionIndex]: true
        };
        
        setShowAnswers(updatedShowAnswers);
    };

    const toggleShowAnswer = (questionIndex) => {
        setShowAnswers(prev => ({
            ...prev,
            [questionIndex]: !prev[questionIndex]
        }));
    };

    // Render loading state
    if (quiz.loading) {
        return <div className="quiz-loading">Generating quiz...</div>;
    }

    // Render error state
    if (quiz.error) {
        return <div className="quiz-error">{quiz.error}</div>;
    }

    // Render empty state
    if (!quiz.questions || quiz.questions.length === 0) {
        return <div className="quiz-error">No quiz questions available.</div>;
    }

    return (
        <div className="content-container">
            <div className="quiz-list">
                <div className="quiz-header">
                    <h2>Quiz</h2>
                    <p>Select the best answer for each question.</p>
                </div>
                
                {quiz.questions.map((question, index) => (
                    <div key={question.id} className="quiz-item">
                        <div className="question">
                            {index + 1}. {question.text}
                        </div>
                        <div className="options">
                            {question.options.map((option) => (
                                <button
                                    key={option.label}
                                    className={`option-button 
                                        ${selectedAnswers[index] === option.label 
                                            ? (option.label === question.correctAnswer 
                                                ? 'correct' 
                                                : 'incorrect') 
                                            : ''}`}
                                    onClick={() => handleAnswerSelect(index, option.label)}
                                    disabled={selectedAnswers[index] !== undefined}
                                >
                                    <span className="option-label">{option.label}</span>
                                    <span className="option-text">{option.text}</span>
                                </button>
                            ))}
                        </div>

                        {selectedAnswers[index] && (
                            <div 
                                className={`feedback-box ${
                                    selectedAnswers[index] === question.correctAnswer 
                                        ? 'correct' 
                                        : 'incorrect'
                                }`}
                            >
                                {selectedAnswers[index] === question.correctAnswer 
                                    ? 'Correct!' 
                                    : `Incorrect. The correct answer is ${question.correctAnswer}.`}
                            </div>
                        )}

                        <button 
                            className="show-answer-button"
                            onClick={() => toggleShowAnswer(index)}
                        >
                            {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                        </button>

                        {showAnswers[index] && (
                            <div className="answer">
                                <div>
                                    <strong>Correct Answer:</strong> {question.correctAnswer}
                                </div>
                                <div className="explanation">
                                    <strong>Explanation:</strong> {question.explanation}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIQuiz;
