import React, { useState, useEffect } from 'react';
import './AIFlashcards.css';

function AIFlashcards({ uploadedFile }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [flashcards, setFlashcards] = useState([]);
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [fileName, setFileName] = useState('');

    const fetchFlashcards = async () => {
        if (!uploadedFile) return;
        
        setIsLoading(true);
        setError(null);
        setFileName(uploadedFile.name);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://127.0.0.1:5001/process/flashcards', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (data.error) {
                if (data.error.includes('rate limit exceeded')) {
                    setError('Rate limit exceeded. Please try again in about an hour.');
                } else {
                    setError('Failed to generate flashcards. Please try again.');
                }
                setFlashcards([]);
                return;
            }

            const parsedCards = parseFlashcards(data);
            if (parsedCards.length === 0) {
                setError('No flashcards could be generated from this content.');
            } else {
                setFlashcards(parsedCards);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching flashcards:', err);
            setError('Failed to generate flashcards. Please try again.');
            setFlashcards([]);
        } finally {
            setIsLoading(false);
        }
    };

    const parseFlashcards = (data) => {
        try {
            console.log('Raw response:', data);

            if (!data.response) {
                throw new Error('Invalid response format');
            }

            const responseText = data.response;
            console.log('Response text:', responseText);

            // Find the dictionary string in the response
            const dictionaryMatch = responseText.match(/\{[^{]*"[^"]+"\s*:\s*"[^"]+\"[^}]*\}/);
            if (dictionaryMatch) {
                const dictionaryString = dictionaryMatch[0];
                console.log('Found dictionary:', dictionaryString);

                try {
                    // Parse the dictionary string into an object
                    const flashcardsData = JSON.parse(dictionaryString);
                    
                    // Convert the object into an array of flashcards
                    const cards = Object.entries(flashcardsData).map(([key, value]) => ({
                        question: key,
                        answer: value.toString()
                    }));

                    console.log('Generated flashcards:', cards);
                    return cards;
                } catch (e) {
                    console.error('Error parsing dictionary:', e);
                }
            }

            // Fallback: Try to find key-value pairs in the text
            const pairs = responseText.match(/"([^"]+)"\s*:\s*"([^"]+)"/g);
            if (pairs) {
                const cards = pairs.map(pair => {
                    const [key, value] = pair.split(':').map(s => 
                        s.trim().replace(/"/g, '')
                    );
                    return {
                        question: key,
                        answer: value
                    };
                });

                console.log('Generated flashcards from pairs:', cards);
                return cards;
            }

            throw new Error('No valid flashcard data found');
        } catch (error) {
            console.error('Error parsing flashcards:', error);
            return [];
        }
    };

    useEffect(() => {
        if (uploadedFile) {
            fetchFlashcards();
        }
    }, [uploadedFile]);

    const toggleCard = (e) => {
        if (!e.target.closest('.nav-button')) {
            const newFlippedCards = new Set(flippedCards);
            if (newFlippedCards.has(currentIndex)) {
                newFlippedCards.delete(currentIndex);
            } else {
                newFlippedCards.add(currentIndex);
            }
            setFlippedCards(newFlippedCards);
        }
    };

    const goToNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNavDotClick = (index) => {
        setCurrentIndex(index);
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    };

    if (isLoading) {
        return (
            <div className="flashcards-loading">
                <p>Generating flashcards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flashcards-error">
                <p>{error}</p>
            </div>
        );
    }

    if (!uploadedFile) {
        return (
            <div className="flashcards-empty">
                <p>Please upload a file to generate flashcards.</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="flashcards-empty">
                <p>No flashcards available for this file yet.</p>
            </div>
        );
    }

    return (
        <div className="ai-flashcards">
            <div className="flashcard-header">
                <h2>Flashcards: {fileName}</h2>
                <button className="save-button">Save</button>
            </div>
            
            <div className="flashcard-progress">
                {currentIndex + 1} of {flashcards.length}
                <button 
                    className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
                    onClick={toggleFavorite}
                >
                    ★
                </button>
            </div>

            <div className="flashcard-content">
                <button 
                    className="nav-button prev" 
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                >
                    ←
                </button>
                
                <div className="flashcard" onClick={toggleCard}>
                    {flashcards.length > 0 && (
                        <div className={`flashcard-inner ${flippedCards.has(currentIndex) ? 'flipped' : ''}`}>
                            <div className="flashcard-front">
                                <h3>{flashcards[currentIndex].question}</h3>
                                <div className="flashcard-hint">Click to flip</div>
                            </div>
                            <div className="flashcard-back">
                                <p>{flashcards[currentIndex].answer}</p>
                                <div className="flashcard-hint">Click to flip back</div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    className="nav-button next" 
                    onClick={goToNext}
                    disabled={currentIndex === flashcards.length - 1}
                >
                    →
                </button>
            </div>

            <div className="flashcard-navigation">
                {flashcards.map((_, index) => (
                    <button
                        key={index}
                        className={`nav-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => handleNavDotClick(index)}
                    />
                ))}
            </div>
        </div>
    );
}

export default AIFlashcards;
