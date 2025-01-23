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

const AssistantHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const AvatarContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 2px solid ${colors.primary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const AssistantInfo = styled.div`
  flex: 1;

  h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: ${colors.accent};
    font-size: 0.9rem;
  }
`;

const ChatContainer = styled.div`
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

const ChatInput = styled.input`
  ${inputStyle}
  flex: 1;
`;

const SendButton = styled.button`
  ${buttonStyle}
  min-width: 100px;
`;
  const AIAssistant = ({ uploadedFile }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
      if (!inputValue.trim()) return;

      const userMessage = inputValue.trim();
      setInputValue('');
      setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('message', userMessage);

        const response = await fetch('http://localhost:5002/process/qa', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        setMessages(prev => [...prev, { text: data.response, isUser: false }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isUser: false }]);
      } finally {
        setLoading(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return (
      <AssistantContainer>
        <AssistantHeader>
          <AvatarContainer>
            <img src="/avatar.png" alt="AI Assistant" />
          </AvatarContainer>
          <AssistantInfo>
            <h2>AI Assistant</h2>
            <p>Always here to help</p>
          </AssistantInfo>
        </AssistantHeader>
        <ChatContainer ref={chatContainerRef}>
          {messages.map((message, index) => (
            <Message key={index} isUser={message.isUser}>
              {message.text}
            </Message>
          ))}
        </ChatContainer>
        <InputContainer>
          <ChatInput
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <SendButton onClick={handleSendMessage} disabled={loading || !inputValue.trim()}>
            Send
          </SendButton>
        </InputContainer>
      </AssistantContainer>
    );
  };

  export default AIAssistant;