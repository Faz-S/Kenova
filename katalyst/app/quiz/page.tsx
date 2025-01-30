'use client';
import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Plus } from 'lucide-react';

interface Question {
  question: string;
  options: Record<string, string>;
  correct_answer?: string;
  explanation?: string;
  marks?: number;
}

interface Answer {
  questionId: number;
  answer: string;
  feedback?: string;
}

const QuizPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSource = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const handleGenerate = async () => {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5002/process/quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let datas = data.response;
      if (datas && typeof datas === 'string') {
        datas = datas.trim().slice(7, -3);
      }

      let parsedData;
      try {
        parsedData = JSON.parse(datas);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        throw new Error('Failed to parse the server response.');
      }

      // Validate the parsed data structure
      if (Array.isArray(parsedData) && 
          parsedData.length > 0 && 
          parsedData.every((q: any) => 
            typeof q === 'object' &&
            'question' in q &&
            'options' in q &&
            'correct_answer' in q
          )) {
        setQuestions(parsedData);
      } else {
        throw new Error('Invalid quiz format');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedAnswer(option);
    
    // Local evaluation of the answer
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_answer;
    
    // Generate local feedback
    const feedback = isCorrect 
      ? "Correct! " + (currentQuestion.explanation || "Great job!")
      : "Incorrect. " + (currentQuestion.explanation || "The selected answer is not correct.");
    
    setFeedback(feedback);
    
    // Store the answer
    setAnswers(prev => [...prev, {
      questionId: currentQuestionIndex,
      answer: option,
      feedback: feedback
    }]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setFeedback('');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer('');
      setFeedback('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 lg:pt-[6.3rem] px-4 md:px-8 text-sm md:text-base lg:text-lg " style={{ fontFamily: 'var(--font-courier-prime)' }}>
        <div className="max-w-[1500px] mx-auto ">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 max-w-[1400px] mx-auto ">
            {/* Left Sidebar */}
            <div className="border-2 border-black bg-[#FFE3E0] p-4">
              <h2 className="text-base sm:text-lg font-bold mb-4">Sources</h2>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              /> 
              <button 
                  onClick={handleAddSource}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium"
                >
                <Plus size={18} />
                  Add Source
              </button>
              {file && (
                <>
                  <div className="mt-4 p-3 border-2 border-black bg-[#FF6958]">
                    <p className="text-sm truncate ">{file.name}</p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full mt-4 py-2.5 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </button>
                </>
              )}
            </div>

            {/* Main Content */}
            <div className="border-2 border-black bg-[#FFE3E0] p-4 min-h-[600px] flex items-center justify-center">
              {isLoading ? (
                <p className="text-lg">Generating questions...</p>
              ) : !file ? (
                <p className="text-lg">Please upload a PDF file first</p>
              ) : questions.length > 0 ? (
                <div className="w-full space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 border-2 border-black disabled:opacity-50 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-base sm:text-lg">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <button 
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="px-4 py-2 border-2 border-black disabled:opacity-50 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Next
                    </button>
                  </div>

                  <div className="p-4 border-2 border-black bg-[#FF6958]">
                    <p className="font-medium text-base sm:text-lg mb-3 ">{questions[currentQuestionIndex].question}</p>
                    <div className="grid grid-cols-2 gap-3 ">
                      {Object.entries(questions[currentQuestionIndex].options).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => handleOptionSelect(key)}
                          className={`p-2 border-2 border-black transition-all ${
                            selectedAnswer === key 
                              ? (selectedAnswer === questions[currentQuestionIndex].correct_answer 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white') 
                              : 'hover:bg-gray-100 bg-white'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{key}: {value}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {feedback && (
                    <div className="p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]  transition-all">
                      <h3 className="font-bold text-base sm:text-lg mb-2">Feedback:</h3>
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{feedback}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
