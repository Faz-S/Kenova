import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { baseContainerStyle, cardStyle, colors, buttonStyle, inputStyle } from '../styles/theme';

const AssistantContainer = styled.div`
  ${baseContainerStyle}
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 20px;
  align-items: flex-start;
`;

const MessagesContainer = styled.div`
  ${cardStyle}
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 1200px;
  align-self: flex-start;
`;

const Message = styled.div`
  ${cardStyle}
  padding: 1.5rem;
  background: ${props => props.isUser ? colors.lightGlass : colors.primary};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 95%;
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${colors.text};
  margin-left: ${props => props.isUser ? 'auto' : '0'};
  margin-right: ${props => props.isUser ? '0' : 'auto'};
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1.2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${colors.border};
  width: 100%;
  max-width: 1200px;
  align-self: flex-start;
`;

const MessageInput = styled.input`
  ${inputStyle}
  flex: 1;
`;

const SendButton = styled.button`
  ${buttonStyle}
  min-width: 100px;
`;

const AIAssistant = ({ uploadedFile }) => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim() || !uploadedFile) return;

    try {
      setLoading(true);
      const formData = new FormData();
      
      if (uploadedFile.type === 'youtube') {
        formData.append('url', uploadedFile.url);
        formData.append('question', userMessage.trim());
      } else {
        formData.append('file', uploadedFile);
        formData.append('question', userMessage.trim());
      }

      setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
      setUserMessage('');

      const response = await fetch('http://127.0.0.1:5001/process/qa', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to chat
      setMessages(prev => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        isUser: false 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AssistantContainer>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.isUser}>
            {message.text}
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer>
        <MessageInput
          placeholder={uploadedFile ? "Ask me anything about the content..." : "Upload content first to start chatting..."}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!uploadedFile || loading}
        />
        <SendButton 
          onClick={handleSubmit}
          disabled={!uploadedFile || !userMessage.trim() || loading}
        >
          {loading ? '⏳' : '✉️'}
        </SendButton>
      </InputContainer>
    </AssistantContainer>
  );
};

export default AIAssistant;