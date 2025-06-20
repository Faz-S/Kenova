"use client";
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import { FaYoutube, FaLanguage, FaPlay, FaSearch } from 'react-icons/fa';

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

// Keyframes for animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background-color: #fff;
  margin-top: 80px;
`;

const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  gap: 20px;
  padding: 20px;
  justify-content: center;
  overflow: hidden;
`;

const LeftContainer = styled.div`
  width: 45%;
  background-color: #C5F8FF;
  border: 2px solid black;
  
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;
`;

const RightContainer = styled.div`
  width: 45%;
  background-color: #C5F8FF;
  border: 2px solid black;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const StyledInput = styled.input`

  flex-grow: 1;
  padding: 10px;
  border: 2px solid #000;
  
  font-size: 16px;
  transition: border-color 0.3s ease;
  margin-bottom:1rem;
  &:focus {
    outline: none;
    border-color: #357abd;
  }
`;

const StyledSelect = styled.select`
  padding: 10px;
  border: 2px solid #000;
  
  font-size: 16px;
  transition: border-color 0.3s ease;
  margin-bottom:1rem;
  &:focus {
    outline: none;
    border-color: #357abd;
  }
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: #357abd;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-bottom:1rem;
  &:hover {
    background-color: #357abd;
  }

  &:disabled {
    background-color: #a0c4e8;
    cursor: not-allowed;
  }
`;

const VideoContainer = styled.div`
  width: 100%;
  display: flex;
  margin-top:2rem;
  flex-direction: column;
  gap: 10px;
`;

// Chatbot Styling
const MessageContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
`;

const MessageBox = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 10px;
`;

const Message = styled.div<{ isUser: boolean }>`
  background-color: ${props => props.isUser ? '#357abd' : '#357abd'};
  color: #fff;
  padding: 10px 15px;
  border:2px solid #000;
  max-width: 70%;
  word-wrap: break-word;
`;

const InputContainer = styled.form`
  display: flex;
  gap: 10px;
  padding: 10px;
`;

const ChatInput = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 2px solid #000;
  
`;

const ChatButton = styled.button`
  background-color: #357abd;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
`;

export default function YouTubePage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [language, setLanguage] = useState('ta');
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    transcript: string;
    translated_text: string;
    audio_url: string;
  } | null>(null);

  // Refs for player and audio synchronization
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Chatbot state
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTranslationResult(null);

    try {
      const response = await axios.post('http://127.0.0.1:5000/process', {
        youtube_url: youtubeUrl,
        language: language
      });

      setTranslationResult(response.data);
    } catch (error) {
      console.error('Error processing YouTube URL:', error);
      alert('Failed to process the YouTube URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: question, isUser: true }]);
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/answer', { question });
      
      // Add bot response
      setMessages(prev => [...prev, { 
        text: response.data.answer || "I'm sorry, I couldn't find an answer to your question.", 
        isUser: false 
      }]);
    } catch (error) {
      console.error('Error getting answer from chatbot:', error);
      setMessages(prev => [...prev, { 
        text: 'Error: Could not fetch answer. Please try again later.', 
        isUser: false 
      }]);
    }

    // Clear input
    setQuestion('');
  };

  // Synchronize audio with video
  const syncAudioWithVideo = () => {
    if (audioRef.current && playerRef.current) {
      audioRef.current.currentTime = playerRef.current.getCurrentTime();
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Audio synchronization effect
  useEffect(() => {
    if (audioRef.current && playerRef.current) {
      audioRef.current.addEventListener('timeupdate', syncAudioWithVideo);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', syncAudioWithVideo);
      }
    };
  }, [translationResult]);

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <LeftContainer>
          <form onSubmit={handleTranslate}>
            <InputWrapper>
              <FaYoutube size={24} color="#357abd" />
              <StyledInput
                type="text"
                placeholder="Enter YouTube URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                required
              />
            </InputWrapper>
            
            <InputWrapper>
              <FaLanguage size={24} color="#357abd" />
              <StyledSelect
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
                <option value="en">English</option>
              </StyledSelect>
            </InputWrapper>

            <StyledButton type="submit" disabled={isLoading}>
              <FaPlay />
              {isLoading ? 'Processing...' : 'Translate'}
            </StyledButton>

            {translationResult && (
              <VideoContainer>
                <ReactPlayer 
                  ref={playerRef}
                  url={youtubeUrl} 
                  controls 
                  width="100%" 
                  height="250px"
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
                <audio 
                  ref={audioRef} 
                  src={`http://127.0.0.1:5000${translationResult.audio_url}`} 
                  style={{ display: 'none' }} 
                />
              </VideoContainer>
            )}
          </form>
        </LeftContainer>

        <RightContainer>
          <MessageContainer>
            {messages.map((message, index) => (
              <MessageBox key={index} isUser={message.isUser}>
                <Message isUser={message.isUser}>
                  {message.text}
                </Message>
              </MessageBox>
            ))}
            <div ref={messagesEndRef} />
          </MessageContainer>

          <InputContainer onSubmit={handleQuestionSubmit}>
            <ChatInput
              type="text"
              placeholder="Ask a question about the video"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <ChatButton type="submit">
              <FaSearch />
            </ChatButton>
          </InputContainer>
        </RightContainer>
      </ContentContainer>
    </PageContainer>
  );
}