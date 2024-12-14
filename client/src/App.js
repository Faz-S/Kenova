import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Content from './components/Content';
import AINotes from './components/AINotes';
import AISummary from './components/AISummary';
import AIKeypoints from './components/AIKeypoints';
import AIFlashcards from './components/AIFlashcards';
import AIQuiz from './components/AIQuiz';
import QuizAnalysis from './components/QuizAnalysis';
import './App.css';

function App() {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route path="/" element={<Content onFileSelect={handleFileSelect} />} />
                    <Route path="/notes" element={<AINotes uploadedFile={selectedFile} />} />
                    <Route path="/summary" element={<AISummary uploadedFile={selectedFile} />} />
                    <Route path="/keypoints" element={<AIKeypoints uploadedFile={selectedFile} />} />
                    <Route path="/flashcards" element={<AIFlashcards uploadedFile={selectedFile} />} />
                    <Route path="/quiz" element={<AIQuiz uploadedFile={selectedFile} />} />
                    <Route path="/quiz-analysis" element={<QuizAnalysis />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
