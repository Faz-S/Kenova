import React, { useState, useEffect } from 'react';
import './AISummary.css';

const AISummary = ({ uploadedFile }) => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSummary = async () => {
        if (!uploadedFile) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://localhost:5001/process/summary', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }

            const data = await response.json();
            console.log('Raw response data:', data);

            if (!data || !data.response) {
                throw new Error('Invalid response format');
            }

            // Remove all asterisks from the response text
            const responseText = data.response.trim().replace(/\*/g, '');
            console.log('Response text without asterisks:', responseText);

            // Filter out introductory text
            const lines = responseText.split('\n').filter(line => {
                const trimmed = line.trim().toLowerCase();
                return !(
                    trimmed.startsWith("here's a breakdown") ||
                    trimmed.startsWith("here's a summary") ||
                    trimmed.startsWith("here's the summary")
                );
            });

            console.log('Filtered lines:', lines);

            // Process the filtered lines into sections
            const sections = [];
            if (!lines.some(line => line.includes(':'))) {
                sections.push({
                    title: 'Summary',
                    points: [lines.join(' ').trim()],
                });
            } else {
                let currentSection = null;

                for (const line of lines) {
                    const trimmedLine = line.trim();

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
                    } else if (currentSection && trimmedLine) {
                        // This is content for the current section
                        currentSection.points.push(trimmedLine);
                    }
                }
            }

            console.log('Final processed sections:', sections);
            setSummary(sections);
        } catch (error) {
            console.error('Error fetching summary:', error);
            setError('Failed to load summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (uploadedFile) {
            fetchSummary();
        }
    }, [uploadedFile]);

    if (isLoading) {
        return (
            <div className="summary-loading">
                <div className="loading-spinner"></div>
                <p>Generating AI Summary...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="summary-error">
                <p>{error}</p>
                <button onClick={fetchSummary} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!uploadedFile) {
        return (
            <div className="no-file-message">
                <p>Upload a file to generate AI summary</p>
            </div>
        );
    }

    return (
        <div className="ai-summary">
            {summary && summary.length > 0 ? (
                summary.map((section, index) => (
                    <div key={index} className="summary-section">
                        <h2 className="section-title">{section.title}</h2>
                        <ul className="summary-points">
                            {section.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="summary-point">{point}</li>
                            ))}
                        </ul>
                        <button className="explain-more-button">
                            <span className="explain-more-icon">✨</span>
                            Explain More
                        </button>
                    </div>
                ))
            ) : (
                <div className="no-summary-message">
                    <p>No summary available for this file yet.</p>
                </div>
            )}
        </div>
    );
};

export default AISummary;
