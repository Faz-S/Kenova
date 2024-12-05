
import React, { useState, useEffect } from 'react';
import './AINotes.css';

const AINotes = ({ uploadedFile }) => {
    const [notes, setNotes] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotes = async () => {
        if (!uploadedFile) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://localhost:5001/process/notes', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }

            const data = await response.json();
            console.log('Raw response data:', data);

            if (!data || !data.response) {
                throw new Error('Invalid response format');
            }

            const responseText = data.response.trim();
            console.log('Response text:', responseText);

            // Filter out the introductory paragraph
            const lines = responseText.split('\n').filter(line => {
                const trimmed = line.trim().toLowerCase();
                return !(
                    trimmed.startsWith("here's a breakdown") ||
                    trimmed.includes("provided document") ||
                    trimmed.includes("formatted as requested")
                );
            });

            console.log('Filtered lines:', lines);

            // Process the filtered lines into sections
            const sections = [];
            if (!lines.some(line => line.includes(':'))) {
                sections.push({
                    title: 'Overview',
                    points: [lines.join(' ').replace(/\*\*/g, '').trim()],
                });
            } else {
                let currentSection = null;

                for (const line of lines) {
                    const trimmedLine = line.trim().replace(/\*\*/g, ''); // Remove asterisks

                    if (trimmedLine.includes(':')) {
                        // This is a section header
                        const [title, ...contentParts] = trimmedLine.split(':');
                        const content = contentParts.join(':').trim();

                        currentSection = {
                            title: title.trim(),
                            points: [],
                        };
                        sections.push(currentSection);

                        if (content) {
                            currentSection.points.push(content);
                        }
                    } else if (currentSection) {
                        // This is content for the current section
                        currentSection.points.push(trimmedLine);
                    }
                }
            }

            console.log('Final processed sections:', sections);
            setNotes(sections);
        } catch (error) {
            console.error('Error fetching notes:', error);
            setError('Failed to load notes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (uploadedFile) {
            fetchNotes();
        }
    }, [uploadedFile]);

    if (isLoading) {
        return (
            <div className="notes-loading">
                <div className="loading-spinner"></div>
                <p>Generating AI Notes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notes-error">
                <p>{error}</p>
                <button onClick={fetchNotes} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!uploadedFile) {
        return (
            <div className="no-file-message">
                <p>Upload a file to generate AI-powered notes</p>
            </div>
        );
    }

    return (
        <div className="ai-notes">
            {notes && notes.length > 0 ? (
                notes.map((section, index) => (
                    <div key={index} className="note-section">
                        <h2 className="section-title">{section.title}</h2>
                        <ul className="note-points">
                            {section.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="note-point">{point}</li>
                            ))}
                        </ul>
                        <button className="explain-more-button">
                            <span className="explain-more-icon">✨</span>
                            Explain More
                        </button>
                    </div>
                ))
            ) : (
                <div className="no-notes-message">
                    <p>No notes available for this file yet.</p>
                </div>
            )}
        </div>
    );
};

export default AINotes;
