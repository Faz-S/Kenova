import React, { useState, useEffect } from 'react';
import './AIKeypoints.css';

const AIKeypoints = ({ uploadedFile }) => {
    const [keypoints, setKeypoints] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKeypoints = async () => {
        if (!uploadedFile) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://localhost:5001/process/keypoints', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch keypoints');
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
                    trimmed.startsWith("here's a last minute guide") ||
                    trimmed.startsWith("here's the keypoints")
                );
            });

            console.log('Filtered lines:', lines);

            // Process the filtered lines into sections
            const sections = [];
            if (!lines.some(line => line.includes(':'))) {
                sections.push({
                    title: 'Key Points',
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
            setKeypoints(sections);
        } catch (error) {
            console.error('Error fetching keypoints:', error);
            setError('Failed to load keypoints. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (uploadedFile) {
            fetchKeypoints();
        }
    }, [uploadedFile]);

    if (isLoading) {
        return (
            <div className="keypoints-loading">
                <div className="loading-spinner"></div>
                <p>Generating Key Points...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="keypoints-error">
                <p>{error}</p>
                <button onClick={fetchKeypoints} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!uploadedFile) {
        return (
            <div className="no-file-message">
                <p>Upload a file to generate key points</p>
            </div>
        );
    }

    return (
        <div className="ai-keypoints">
            {keypoints && keypoints.length > 0 ? (
                keypoints.map((section, index) => (
                    <div key={index} className="keypoints-section">
                        <h2 className="section-title">{section.title}</h2>
                        <ul className="keypoints-points">
                            {section.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="keypoint-point">{point}</li>
                            ))}
                        </ul>
                        <button className="explain-more-button">
                            <span className="explain-more-icon">✨</span>
                            Explain More
                        </button>
                    </div>
                ))
            ) : (
                <div className="no-keypoints-message">
                    <p>No key points available for this file yet.</p>
                </div>
            )}
        </div>
    );
};

export default AIKeypoints;
