import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';

const AIAssistant = ({ uploadedFile }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (uploadedFile) {
            setMessages([
                {
                    type: 'ai',
                    content: `Hey bestie! 👋 I've got your file "${uploadedFile.name}" ready to analyze. What would you like to know about it?`
                }
            ]);
        }
    }, [uploadedFile]);

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !uploadedFile) return;

        // Add user message
        const userMessage = { type: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Create form data with file and question
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('question', inputMessage);

            // Send request to backend
            const response = await fetch('http://127.0.0.1:5001/process/qa', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();

            // Ensure the response key matches the backend's response (check if it is 'response' or 'answer')
            setMessages(prev => [
                ...prev,
                {
                    type: 'ai',
                    content: data.response || data.answer || "Sorry bestie, I couldn't process that! 😅 Try asking something else?"
                }
            ]);

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                type: 'ai',
                content: "Oops! Something went wrong on my end bestie! 🙈 Let's try that again?"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="ai-assistant">
            <div className="chat-header">
                <div className="ai-info">
                    <div className="ai-avatar">🤖</div>
                    <div>
                        <div className="ai-name">Kenova AI</div>
                        <div className="ai-status">
                            <div className={`status-dot ${isTyping ? 'typing' : ''}`}></div>
                            {isTyping ? 'Typing...' : 'Online'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}-message`}>
                        <div className="message-content">
                            <div className="message-avatar">
                                {message.type === 'ai' ? '🤖' : '👤'}
                            </div>
                            <div className="message-text">{message.content}</div>
                        </div>
                        <div className="message-timestamp">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder={uploadedFile ? "Ask me anything about your file! ✨" : "Upload a file to start chatting! 📁"}
                    disabled={!uploadedFile}
                />
                <button 
                    type="submit" 
                    disabled={!uploadedFile || !inputMessage.trim() || isTyping}
                    className={(!uploadedFile || !inputMessage.trim() || isTyping) ? 'disabled' : ''}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default AIAssistant;
