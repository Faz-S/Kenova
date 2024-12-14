import React, { useState } from 'react';
import styled from 'styled-components';

const FlashcardsLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
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
  margin-bottom: 20px;

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

const FlashcardsContainer = styled.div`
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

const FlashcardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const FlashcardControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  button {
    padding: 8px 16px;
    background: #22252d;
    border: 1px solid #2a2d35;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      border-color: #6B8AFF;
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .icon {
      font-size: 1.2rem;
    }
  }
`;

const Flashcard = styled.div`
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16/10;
  perspective: 1000px;
  cursor: pointer;

  .flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
    transform: ${props => props.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};
  }

  .flashcard-front,
  .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #22252d;
    border: 1px solid #2a2d35;
    border-radius: 12px;
    font-size: 1.2rem;
    line-height: 1.6;

    &:hover {
      border-color: #FF61D8;
    }
  }

  .flashcard-back {
    transform: rotateY(180deg);
    background: #1a1d24;
  }
`;

const Progress = styled.div`
  width: 100%;
  max-width: 600px;
  margin-bottom: 20px;

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

const NoFlashcards = styled.div`
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

export default function AIFlashcards() {
  const [file, setFile] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const generateFlashcards = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/process/flashcards', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json();
      setFlashcards(parseFlashcards(data.response));
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseFlashcards = (response) => {
    try {
      // Extract the JSON string from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No JSON data found in response');
      }

      // Parse the JSON dictionary
      const flashcardsDict = JSON.parse(jsonMatch[1]);

      // Convert dictionary to array of flashcard objects
      return Object.entries(flashcardsDict).map(([question, answer]) => ({
        front: question,
        back: answer
      }));
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      throw new Error('Failed to parse flashcards data');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <FlashcardsLayout>
      <Sidebar>
        <h2>Flashcards</h2>
        <FileUpload>
          <label className="upload-button">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx"
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
          onClick={generateFlashcards}
          disabled={!file || loading}
        >
          {loading ? 'Generating...' : 'Generate Flashcards'}
        </GenerateButton>
      </Sidebar>

      <FlashcardsContainer>
        <h1>Flashcards</h1>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Generating flashcards...</div>
        ) : flashcards.length > 0 ? (
          <FlashcardContent>
            <Progress>
              <div className="progress-text">
                <span>Card {currentIndex + 1} of {flashcards.length}</span>
                <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}% Complete</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>
            </Progress>

            <Flashcard flipped={isFlipped} onClick={toggleFlip}>
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  {flashcards[currentIndex].front}
                </div>
                <div className="flashcard-back">
                  {flashcards[currentIndex].back}
                </div>
              </div>
            </Flashcard>

            <FlashcardControls>
              <button onClick={handlePrevious} disabled={currentIndex === 0}>
                <span className="icon">←</span>
                Previous
              </button>
              <button onClick={toggleFlip}>
                <span className="icon">↻</span>
                Flip
              </button>
              <button onClick={handleNext} disabled={currentIndex === flashcards.length - 1}>
                Next
                <span className="icon">→</span>
              </button>
            </FlashcardControls>
          </FlashcardContent>
        ) : (
          <NoFlashcards>
            <div className="icon">🎴</div>
            <h3>No Flashcards Generated Yet</h3>
            <p>Upload a document and click 'Generate Flashcards' to get started</p>
          </NoFlashcards>
        )}
      </FlashcardsContainer>
    </FlashcardsLayout>
  );
}
