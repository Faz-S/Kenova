import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { baseContainerStyle, cardStyle, colors, buttonStyle } from '../styles/theme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const QuizLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
  padding-right: 340px;
  background: #13151a;
  font-family: 'Space Grotesk', sans-serif;
`;

const Sidebar = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #2a2d35;
  height: fit-content;
  position: sticky;
  top: 20px;

  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
    font-size: 1.4rem;
  }
`;

const FileUpload = styled.div`
  margin-bottom: 24px;

  .upload-button {
    width: 100%;
    padding: 12px;
    background: #22252d;
    border: 2px dashed #2a2d35;
    border-radius: 12px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-size: 0.9rem;

    &:hover {
      border-color: #FF61D8;
      background: rgba(255, 97, 216, 0.1);
    }

    input {
      display: none;
    }
  }

  .file-info {
    margin-top: 12px;
    padding: 12px;
    background: #22252d;
    border-radius: 8px;
    color: #6B8AFF;
    font-size: 0.9rem;
  }
`;

const GenerateButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #FF61D8;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;

  &:hover {
    background: #ff7de0;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
    transform: none;
  }
`;

const MainContent = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #2a2d35;
  color: #ffffff;
  min-height: 80vh;

  h1 {
    color: #FF61D8;
    margin-bottom: 24px;
    font-size: 2rem;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #6B8AFF;
    font-size: 1.1rem;
  }

  .error {
    padding: 16px;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid #FF6B6B;
    border-radius: 8px;
    color: #FF6B6B;
    margin-bottom: 20px;
  }
`;

const QuestionContainer = styled.div`
  margin-bottom: 30px;

  .question-text {
    font-size: 1.3rem;
    margin-bottom: 20px;
    line-height: 1.5;
    color: #ffffff;
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const OptionButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #22252d;
  border: 1px solid #2a2d35;
  border-radius: 12px;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  line-height: 1.4;

  &:hover {
    border-color: #6B8AFF;
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #FF61D8;
    background: rgba(255, 97, 216, 0.1);
  }

  &.correct {
    border-color: #00FFA3;
    background: rgba(0, 255, 163, 0.1);
  }

  &.incorrect {
    border-color: #FF6B6B;
    background: rgba(255, 107, 107, 0.1);
  }
`;

const QuestionNav = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 24px;

  button {
    aspect-ratio: 1;
    border: 1px solid #2a2d35;
    border-radius: 8px;
    background: #22252d;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;

    &:hover {
      border-color: #6B8AFF;
      transform: translateY(-2px);
    }

    &.current {
      border-color: #FF61D8;
      background: rgba(255, 97, 216, 0.1);
    }

    &.completed {
      border-color: #00FFA3;
      &::after {
        content: '✓';
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 10px;
        color: #00FFA3;
      }
    }

    &.incorrect {
      border-color: #FF6B6B;
      &::after {
        content: '×';
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 10px;
        color: #FF6B6B;
      }
    }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;

  button {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &.next, &.prev {
      background: #22252d;
      border: 1px solid #2a2d35;
      color: #ffffff;

      &:hover {
        border-color: #6B8AFF;
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }

    &.check {
      background: #FF61D8;
      border: none;
      color: white;

      &:hover {
        background: #ff7de0;
        transform: translateY(-2px);
      }
    }
  }
`;

const Progress = styled.div`
  margin-bottom: 24px;

  .progress-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    color: #6B8AFF;
    font-size: 0.9rem;
  }

  .progress-bar {
    height: 4px;
    background: #22252d;
    border-radius: 2px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: #FF61D8;
      transition: width 0.3s ease;
    }
  }
`;

const ResultsContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  text-align: center;
  padding: 40px;
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease;

  h3 {
    color: #FF61D8;
    font-size: 1.8rem;
    margin-bottom: 24px;
  }

  .score {
    font-size: 1.2rem;
    color: #ffffff;
    margin-bottom: 16px;
  }

  .marks {
    font-size: 1.4rem;
    color: #00FFA3;
    margin-bottom: 16px;
  }

  .percentage {
    font-size: 2.5rem;
    color: #6B8AFF;
    margin: 24px 0;
    font-weight: bold;
  }

  .grade {
    font-size: 1.4rem;
    margin: 24px 0;
    padding: 12px 24px;
    border-radius: 12px;
    display: inline-block;
  }

  .buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 32px;

    button {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &.try-again {
        background: #FF61D8;
        border: none;
        color: white;

        &:hover {
          background: #ff7de0;
          transform: translateY(-2px);
        }
      }

      &.close {
        background: transparent;
        border: 1px solid #2a2d35;
        color: #ffffff;

        &:hover {
          border-color: #6B8AFF;
          transform: translateY(-2px);
        }
      }
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(19, 21, 26, 0.8);
  backdrop-filter: blur(4px);
  z-index: 999;
  animation: ${fadeIn} 0.3s ease;
`;

const ExplanationBox = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: #22252d;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  color: #ffffff;
  animation: ${fadeIn} 0.3s ease;

  h4 {
    color: #6B8AFF;
    margin-bottom: 8px;
  }

  p {
    line-height: 1.6;
    color: #ffffff;
  }
`;

const MarksDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #22252d;
  border-radius: 8px;
  border: 1px solid #2a2d35;

  .marks-label {
    color: #6B8AFF;
    font-size: 0.9rem;
  }

  .marks-value {
    color: #00FFA3;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .total-marks {
    color: #FF61D8;
    font-size: 0.9rem;
    margin-left: auto;
  }
`;

const ShowAnswerButton = styled.button`
  padding: 12px 24px;
  background: #6B8AFF;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 12px;

  &:hover {
    background: #8ba1ff;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const TotalMarksPanel = styled.div`
  position: fixed;
  top: 100px;
  right: 40px;
  width: 280px;
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  padding: 24px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .marks-title {
    color: #FF61D8;
    font-size: 1.2rem;
    margin-bottom: 16px;
    text-align: center;
  }

  .marks-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 20px;
  }

  .marks-item {
    background: #22252d;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      color: #6B8AFF;
      font-size: 0.9rem;
    }

    .value {
      color: #00FFA3;
      font-weight: 600;
      font-size: 1.1rem;
    }
  }

  .percentage-circle {
    width: 120px;
    height: 120px;
    margin: 20px auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: conic-gradient(
      #00FFA3 ${props => props.percentage}%,
      #22252d ${props => props.percentage}% 100%
    );
    border-radius: 50%;

    &::before {
      content: '';
      position: absolute;
      width: 100px;
      height: 100px;
      background: #1a1d24;
      border-radius: 50%;
    }

    .percentage-text {
      position: relative;
      z-index: 1;
      color: #00FFA3;
      font-size: 1.5rem;
      font-weight: bold;
    }
  }

  .grade-display {
    text-align: center;
    margin-top: 16px;
    font-size: 1.8rem;
    font-weight: bold;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6B8AFF;

  h3 {
    margin-bottom: 16px;
    color: #FF61D8;
  }

  p {
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #FF61D8;
  }
`;

const AIQuiz = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [earnedMarks, setEarnedMarks] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
    resetQuiz();
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setQuestionStatus([]);
    setScore(0);
    setEarnedMarks(0);
    setTotalMarks(0);
    setShowExplanation(false);
    setShowResults(false);
  };

  const generateQuiz = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/process/quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      const parsedQuestions = parseQuestions(data.response);
      setQuestions(parsedQuestions);
      setQuestionStatus(new Array(parsedQuestions.length).fill('pending'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseQuestions = (response) => {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No JSON data found in response');
      }

      const questionsData = JSON.parse(jsonMatch[1]);
      const parsedQuestions = questionsData.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        marks: q.marks || 1 // Default to 1 mark if not specified
      }));

      // Calculate total possible marks
      const total = parsedQuestions.reduce((sum, q) => sum + q.marks, 0);
      setTotalMarks(total);
      setEarnedMarks(0);

      return parsedQuestions;
    } catch (error) {
      console.error('Error parsing questions:', error);
      throw new Error('Failed to parse quiz data');
    }
  };

  const handleAnswerSelect = (answer) => {
    if (questionStatus[currentIndex] !== 'pending') return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentIndex].correctAnswer;
    
    const newStatus = [...questionStatus];
    newStatus[currentIndex] = isCorrect ? 'completed' : 'incorrect';
    setQuestionStatus(newStatus);
    setShowExplanation(true);

    if (isCorrect) {
      const questionMarks = questions[currentIndex].marks;
      setScore(prev => prev + 1);
      setEarnedMarks(prev => prev + questionMarks);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#00FFA3' };
    if (percentage >= 80) return { grade: 'A', color: '#00FFA3' };
    if (percentage >= 70) return { grade: 'B', color: '#6B8AFF' };
    if (percentage >= 60) return { grade: 'C', color: '#FF61D8' };
    if (percentage >= 50) return { grade: 'D', color: '#FFA500' };
    return { grade: 'F', color: '#FF4444' };
  };

  const handleQuizComplete = () => {
    // Save quiz results when quiz is completed
    const quizResult = {
      date: new Date().toISOString(),
      score,
      totalQuestions: questions.length,
      earnedMarks,
      totalMarks,
      percentage: ((earnedMarks / totalMarks) * 100).toFixed(1),
      grade: calculateGrade((earnedMarks / totalMarks) * 100).grade
    };

    // Get existing quiz results or initialize empty array
    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    
    // Add new result
    existingResults.push(quizResult);
    
    // Save back to localStorage
    localStorage.setItem('quizResults', JSON.stringify(existingResults));

    setShowResults(true);
  };

  const closeResults = () => {
    // Navigate to quiz analysis page
    navigate('/quiz-analysis', { 
      state: { 
        lastQuizResult: {
          date: new Date().toISOString(),
          score,
          totalQuestions: questions.length,
          earnedMarks,
          totalMarks,
          percentage: ((earnedMarks / totalMarks) * 100).toFixed(1),
          grade: calculateGrade((earnedMarks / totalMarks) * 100).grade
        }
      }
    });
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      closeResults();
    }
  };

  return (
    <QuizLayout>
      <Sidebar>
        <h2>Quiz Generator</h2>
        <FileUpload>
          <label className="upload-button">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx,.mp4,.webm,.ogg,.mov,.avi,.ogg,.odt,.rtf,.js,.json,.css,.html"
            />
            {file ? ' Change File' : ' Upload Document'}
          </label>
          {file && (
            <div className="file-info">
              Selected: {file.name}
            </div>
          )}
        </FileUpload>
        <GenerateButton
          onClick={generateQuiz}
          disabled={!file || loading}
        >
          {loading ? 'Generating Quiz...' : 'Generate Quiz'}
        </GenerateButton>

        {questions.length > 0 && (
          <QuestionNav>
            {questions.map((_, index) => (
              <button
                key={index}
                className={`
                  ${index === currentIndex ? 'current' : ''}
                  ${questionStatus[index] === 'completed' ? 'completed' : ''}
                  ${questionStatus[index] === 'incorrect' ? 'incorrect' : ''}
                `}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </QuestionNav>
        )}
      </Sidebar>

      <MainContent>
        <h1>Quiz</h1>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Generating quiz questions...</div>
        ) : questions.length > 0 ? (
          <>
            <Progress>
              <div className="progress-text">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </Progress>

            <QuestionContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="question-text">{questions[currentIndex].question}</h3>
                <span style={{ color: '#FF61D8', fontSize: '0.9rem' }}>
                  Marks: {questions[currentIndex].marks}
                </span>
              </div>
              <OptionsGrid>
                {Object.entries(questions[currentIndex].options).map(([key, value]) => (
                  <OptionButton
                    key={key}
                    className={`
                      ${selectedAnswer === key ? 'selected' : ''}
                      ${questionStatus[currentIndex] !== 'pending' && key === questions[currentIndex].correctAnswer ? 'correct' : ''}
                      ${questionStatus[currentIndex] !== 'pending' && selectedAnswer === key && key !== questions[currentIndex].correctAnswer ? 'incorrect' : ''}
                    `}
                    onClick={() => handleAnswerSelect(key)}
                    disabled={questionStatus[currentIndex] !== 'pending'}
                  >
                    {key}. {value}
                  </OptionButton>
                ))}
              </OptionsGrid>

              {!showExplanation && questionStatus[currentIndex] === 'pending' && (
                <Controls>
                  <ShowAnswerButton onClick={() => setShowExplanation(true)}>
                    Show Answer
                  </ShowAnswerButton>
                </Controls>
              )}

              {showExplanation && (
                <ExplanationBox>
                  <h4>Explanation</h4>
                  <p>{questions[currentIndex].explanation}</p>
                  {questionStatus[currentIndex] === 'pending' && (
                    <p style={{ color: '#6B8AFF', marginTop: '12px' }}>
                      Correct Answer: {questions[currentIndex].correctAnswer}
                    </p>
                  )}
                  <MarksDisplay>
                    <span className="marks-label">Your Marks:</span>
                    <span className="marks-value">{earnedMarks}</span>
                    <span className="total-marks">
                      Total Available: {totalMarks} ({((earnedMarks / totalMarks) * 100).toFixed(1)}%)
                    </span>
                  </MarksDisplay>
                </ExplanationBox>
              )}

              <Controls>
                <button
                  className="prev"
                  onClick={prevQuestion}
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  className="next"
                  onClick={nextQuestion}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                </button>
              </Controls>

              {questionStatus.every(status => status !== 'pending') && !showResults && (
                handleQuizComplete()
              )}
            </QuestionContainer>

          </>
        ) : (
          <EmptyState>
            <div className="icon">📝</div>
            <h3>No Quiz Generated Yet</h3>
            <p>Upload a document and click 'Generate Quiz' to get started</p>
          </EmptyState>
        )}
      </MainContent>

      {questions.length > 0 && (
        <TotalMarksPanel percentage={(earnedMarks / totalMarks) * 100 || 0}>
          <div className="marks-title">Quiz Progress</div>
          
          <div className="percentage-circle">
            <div className="percentage-text">
              {((earnedMarks / totalMarks) * 100 || 0).toFixed(1)}%
            </div>
          </div>

          <div className="marks-grid">
            <div className="marks-item">
              <span className="label">Questions Completed</span>
              <span className="value">{questionStatus.filter(status => status !== 'pending').length} / {questions.length}</span>
            </div>
            <div className="marks-item">
              <span className="label">Marks Earned</span>
              <span className="value">{earnedMarks} / {totalMarks}</span>
            </div>
            <div className="marks-item">
              <span className="label">Correct Answers</span>
              <span className="value">{score} / {questions.length}</span>
            </div>
          </div>

          <div className="grade-display" style={{ color: calculateGrade((earnedMarks / totalMarks) * 100).color }}>
            {calculateGrade((earnedMarks / totalMarks) * 100).grade}
          </div>
        </TotalMarksPanel>
      )}

      {showResults && (
        <>
          <Overlay onClick={handleOverlayClick} />
          <ResultsContainer>
            <h3>Quiz Complete! 🎉</h3>
            <div className="score">
              Questions: {score} / {questions.length} Correct
            </div>
            <div className="marks">
              Marks: {earnedMarks} / {totalMarks}
            </div>
            <div className="percentage">
              {((earnedMarks / totalMarks) * 100).toFixed(1)}%
            </div>
            {totalMarks > 0 && (
              <div 
                className="grade"
                style={{ 
                  backgroundColor: `${calculateGrade((earnedMarks / totalMarks) * 100).color}20`,
                  color: calculateGrade((earnedMarks / totalMarks) * 100).color 
                }}
              >
                Grade: {calculateGrade((earnedMarks / totalMarks) * 100).grade}
              </div>
            )}
            <div className="buttons">
              <button className="try-again" onClick={resetQuiz}>Try Again</button>
              <button className="close" onClick={closeResults}>View Analysis</button>
            </div>
          </ResultsContainer>
        </>
      )}
    </QuizLayout>
  );
};

export default AIQuiz;
