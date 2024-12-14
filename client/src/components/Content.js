import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styled, { keyframes, css } from 'styled-components';
import AIAssistant from './AIAssistant';
import AINotes from './AINotes';
import AISummary from './AISummary';
import AIKeypoints from './AIKeypoints';
import AIFlashcards from './AIFlashcards';
import AIQuiz from './AIQuiz';

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const shine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const gradientBg = css`
  background: linear-gradient(45deg, #FF61D8, #6B8AFF, #00FFA3, #FFB800);
  background-size: 400% 400%;
  animation: ${shine} 15s ease infinite;
`;

const floatWithRotate = keyframes`
  0% { 
    transform: translateY(0px) rotate(0deg);
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: translateY(-10px) rotate(2deg);
    filter: hue-rotate(180deg);
  }
  100% { 
    transform: translateY(0px) rotate(0deg);
    filter: hue-rotate(360deg);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 97, 216, 0.2), 0 0 10px rgba(255, 97, 216, 0.2), 0 0 15px rgba(255, 97, 216, 0.2); }
  50% { box-shadow: 0 0 10px rgba(255, 97, 216, 0.5), 0 0 20px rgba(255, 97, 216, 0.3), 0 0 30px rgba(255, 97, 216, 0.3); }
  100% { box-shadow: 0 0 5px rgba(255, 97, 216, 0.2), 0 0 10px rgba(255, 97, 216, 0.2), 0 0 15px rgba(255, 97, 216, 0.2); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Styled Components with Gen Z aesthetics
const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #13151a 0%, #1a1d24 100%);
  color: #FFFFFF;
  font-family: 'Space Grotesk', sans-serif;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(107, 138, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    animation: ${pulse} 10s ease-in-out infinite;
  }
`;

const TabsNav = styled.nav`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(20, 22, 28, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 97, 216, 0.2);
  overflow-x: auto;
  position: sticky;
  top: 0;
  z-index: 10;
  
  &::-webkit-scrollbar {
    height: 4px;
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #FF61D8, #6B8AFF);
    border-radius: 4px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, #FF61D8, #6B8AFF, #00FFA3);
    animation: ${shimmer} 3s linear infinite;
  }
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.active ? 'rgba(255, 97, 216, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.active ? '#FF61D8' : '#FFFFFF'};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-shadow: ${props => props.active ? '0 0 10px rgba(255, 97, 216, 0.5)' : 'none'};

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.active ? 'rgba(255, 97, 216, 0.25)' : 'rgba(255, 255, 255, 0.1)'};
    animation: ${glowPulse} 2s infinite;
  }

  &:active {
    transform: translateY(1px);
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #FF61D8, #6B8AFF, #00FFA3);
    z-index: -1;
    opacity: ${props => props.active ? 0.5 : 0};
    transition: opacity 0.3s ease;
    border-radius: 14px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 2rem;
  padding: 2rem;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at top right, rgba(107, 138, 255, 0.1), transparent 50%),
      radial-gradient(circle at bottom left, rgba(255, 97, 216, 0.1), transparent 50%);
    pointer-events: none;
    animation: ${pulse} 8s ease-in-out infinite;
  }
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  background: rgba(26, 29, 36, 0.7);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(255, 97, 216, 0.2),
      0 0 40px rgba(107, 138, 255, 0.2);
  }
`;

const AIAssistantContainer = styled.div`
  width: 350px;
  flex-shrink: 0;
  animation: ${floatWithRotate} 8s ease-in-out infinite;
  transform-origin: center center;
  perspective: 1000px;
`;

const UploadSection = styled.div`
  height: 100%;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed ${props => props.isDragging ? '#FF61D8' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props => props.isDragging ? 'rgba(255, 97, 216, 0.1)' : 'transparent'};
  position: relative;
  overflow: hidden;

  ${props => props.isDragging && css`
    transform: scale(1.02);
    box-shadow: 
      0 0 30px rgba(255, 97, 216, 0.3),
      0 0 60px rgba(107, 138, 255, 0.2);
  `}

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: rotate(45deg);
    animation: ${shimmer} 3s linear infinite;
  }
`;

const UploadContainer = styled.div`
  text-align: center;
  max-width: 500px;
  width: 100%;
  z-index: 1;
`;

const InputMethodToggle = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;

  button {
    padding: 0.75rem 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: ${props => props.active ? 'rgba(255, 97, 216, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.active ? '#FFFFFF' : '#FFFFFF'};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    text-shadow: ${props => props.active ? '0 0 10px rgba(255, 97, 216, 0.5)' : 'none'};

    &:hover {
      transform: translateY(-2px);
      border-color: #FF61D8;
      animation: ${glowPulse} 2s infinite;
    }

    &:active {
      transform: translateY(0);
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: 0.5s;
    }

    &:hover::after {
      left: 100%;
    }
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadLabel = styled.label`
  display: block;
  cursor: pointer;
  padding: 2.5rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(255, 97, 216, 0.2),
      0 0 40px rgba(107, 138, 255, 0.2);
  }

  h3 {
    font-size: 1.8rem;
    margin: 1rem 0;
    background: linear-gradient(45deg, #FF61D8, #6B8AFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${pulse} 3s ease-in-out infinite;
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 1rem 0;
    line-height: 1.6;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: 0.6s;
  }

  &:hover::after {
    left: 100%;
  }
`;

const UploadIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: ${floatWithRotate} 4s ease-in-out infinite;
  display: inline-block;
  filter: drop-shadow(0 0 10px rgba(255, 97, 216, 0.5));
`;

const FileTypesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 2rem;
  perspective: 1000px;
`;

const FileTypeTag = styled.span`
  padding: 1rem;
  background: rgba(107, 138, 255, 0.1);
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 500;
  color: #6B8AFF;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(107, 138, 255, 0.2);

  &:hover {
    transform: translateY(-4px) rotateX(10deg);
    background: rgba(107, 138, 255, 0.15);
    border-color: rgba(107, 138, 255, 0.4);
    box-shadow: 
      0 10px 20px rgba(0, 0, 0, 0.2),
      0 0 15px rgba(107, 138, 255, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover::before {
    transform: translateX(100%);
  }
`;

const YoutubeUrlForm = styled.form`
  width: 100%;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-4px);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.2),
      0 0 20px rgba(255, 97, 216, 0.2);
  }
`;

const YoutubeInputContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
`;

const YoutubeUrlInput = styled.input`
  flex: 1;
  padding: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #FFFFFF;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);

  &:focus {
    border-color: #FF61D8;
    outline: none;
    background: rgba(255, 97, 216, 0.1);
    box-shadow: 
      0 0 20px rgba(255, 97, 216, 0.2),
      0 0 40px rgba(255, 97, 216, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }

  &:focus::placeholder {
    color: rgba(255, 97, 216, 0.6);
  }
`;

const YoutubeUrlSubmit = styled.button`
  padding: 1.2rem 2rem;
  ${gradientBg}
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 10px 20px rgba(255, 97, 216, 0.3),
      0 0 30px rgba(107, 138, 255, 0.3);
    animation: ${glowPulse} 2s infinite;
  }

  &:active {
    transform: translateY(1px) scale(0.98);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
`;

const ValidationError = styled.p`
  color: #FF6B6B;
  margin-top: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 12px;
  animation: ${pulse} 2s ease-in-out infinite;

  &::before {
    content: '⚠️';
    font-size: 1.2rem;
  }
`;

const FilePreviewContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 24px;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-weight: 600;
    font-size: 1.2rem;
    background: linear-gradient(45deg, #FF61D8, #6B8AFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${pulse} 3s ease-in-out infinite;
  }
`;

const ClosePreviewButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.8rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  position: relative;
  overflow: hidden;

  &:hover {
    color: #FF61D8;
    transform: rotate(90deg);
    background: rgba(255, 97, 216, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255, 97, 216, 0.2), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #FF61D8, #6B8AFF);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FF61D8, #6B8AFF);
    border: 1px solid transparent;
  }
`;

const TextPreview = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Fira Code', monospace;
  color: #00FFA3;
  line-height: 1.6;
  padding: 1rem;
  background: rgba(0, 255, 163, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 163, 0.1);

  &::selection {
    background: rgba(0, 255, 163, 0.3);
    color: #FFFFFF;
  }
`;

const ChatContainer = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow-y: auto;
  max-height: 300px;
`;

const Message = styled.p`
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 12px;
  background: ${props => props.isUser ? 'rgba(255, 97, 216, 0.1)' : 'rgba(107, 138, 255, 0.1)'};
  color: ${props => props.isUser ? '#FF61D8' : '#6B8AFF'};
  font-weight: 500;
  font-size: 1rem;
  width: fit-content;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const ChatInput = styled.textarea`
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #FFFFFF;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  resize: none;

  &:focus {
    border-color: #FF61D8;
    outline: none;
    background: rgba(255, 97, 216, 0.1);
    box-shadow: 
      0 0 20px rgba(255, 97, 216, 0.2),
      0 0 40px rgba(255, 97, 216, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }

  &:focus::placeholder {
    color: rgba(255, 97, 216, 0.6);
  }
`;

const GenerateButton = styled.button`
  padding: 1.2rem 2rem;
  ${gradientBg}
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 10px 20px rgba(255, 97, 216, 0.3),
      0 0 30px rgba(107, 138, 255, 0.3);
    animation: ${glowPulse} 2s infinite;
  }

  &:active {
    transform: translateY(1px) scale(0.98);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
`;

function Content({ onFileSelect }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileContent, setFileContent] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [inputMethod, setInputMethod] = useState('file');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const isValidYouTubeURL = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
        return youtubeRegex.test(url);
    };

    const handleYouTubeUrlSubmit = async (e) => {
        e.preventDefault();
        if (!youtubeUrl) {
            setPreviewError('Please enter a valid YouTube URL');
            return;
        }

        if (!isValidYouTubeURL(youtubeUrl)) {
            setPreviewError('Please enter a valid YouTube URL');
            return;
        }

        try {
            setLoading(true);
            setPreviewError(null);

            // Send to /process/qa endpoint
            const formData = new FormData();
            formData.append('url', youtubeUrl);
            formData.append('type', 'youtube');

            const response = await fetch('http://127.0.0.1:5001/process/qa', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process YouTube URL');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update UI state
            setFileType('youtube');
            setFileContent(youtubeUrl);
            setSelectedFile({ name: 'YouTube Video', type: 'youtube', url: youtubeUrl });
            onFileSelect({ type: 'youtube', url: youtubeUrl });
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error processing YouTube URL:', error);
            setPreviewError(error.message || 'Unable to process the YouTube URL. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleYouTubeUrlSubmit();
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            onFileSelect(file);
            await processFile(file);
        }
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            onFileSelect(file);
            await processFile(file);
        }
    };

    const getFileExtension = (filename) => {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    };

    const processFile = async (file) => {
        try {
            setPreviewError(null);
            const extension = getFileExtension(file.name);
            setFileType(extension);

            switch (extension) {
                case 'pdf':
                    const pdfUrl = URL.createObjectURL(file);
                    setFileContent(pdfUrl);
                    break;

                case 'txt':
                case 'json':
                case 'js':
                case 'css':
                case 'html':
                    const text = await file.text();
                    setFileContent(text);
                    break;

                case 'doc':
                case 'docx':
                    const arrayBuffer = await file.arrayBuffer();
                    const container = document.createElement('div');
                    await renderAsync(arrayBuffer, container);
                    setFileContent(container.innerHTML);
                    break;

                case 'odt':
                case 'rtf':
                    const buffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                    setFileContent(result.value);
                    break;

                case 'mp4':
                case 'webm':
                case 'ogg':
                case 'mov':
                case 'avi':
                    const videoUrl = URL.createObjectURL(file);
                    setFileContent(videoUrl);
                    break;

                default:
                    throw new Error('Unsupported file type');
            }


            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error processing file:', error);
            setPreviewError(error.message || 'Unable to process this file. Please try another file.');
            setFileContent(null);
        }
    };

    const renderFilePreview = () => {
        if (previewError) {
            return (
                <PreviewContent>
                    <ValidationError>😕 {previewError}</ValidationError>
                </PreviewContent>
            );
        }

        if (!fileContent) return null;

        switch (fileType) {
            case 'pdf':
                return (
                    <PreviewContent>
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <Viewer
                                fileUrl={fileContent}
                                plugins={[defaultLayoutPluginInstance]}
                            />
                        </Worker>
                    </PreviewContent>
                );

            case 'mp4':
            case 'webm':
            case 'ogg':
            case 'mov':
            case 'avi':
            case 'youtube':
                return (
                    <PreviewContent>
                        <ReactPlayer
                            url={fileContent}
                            controls={true}
                            width="100%"
                            height="100%"
                            pip={true}
                            stopOnUnmount={false}
                            playsinline={true}
                        />
                    </PreviewContent>
                );

            case 'doc':
            case 'docx':
            case 'odt':
            case 'rtf':
                return (
                    <PreviewContent dangerouslySetInnerHTML={{ __html: fileContent }} />
                );

            case 'txt':
            case 'json':
            case 'js':
            case 'css':
            case 'html':
                return (
                    <PreviewContent>
                        <TextPreview>{fileContent}</TextPreview>
                    </PreviewContent>
                );

            default:
                return (
                    <PreviewContent>
                        <p>✨ This file type isn't supported yet!</p>
                        <p>Try uploading a PDF, DOC, DOCX, ODT, RTF, TXT, or video file</p>
                    </PreviewContent>
                );
        }
    };

    const tabs = [
        { id: 'original', label: 'Original', path: '/' },
        { id: 'notes', label: 'Smart Notes', path: '/notes' },
        { id: 'summary', label: 'AI Summary', path: '/summary' },
        { id: 'flashcards', label: 'Flashcards', path: '/flashcards' },
        { id: 'keypoints', label: 'AI Keypoints', path: '/keypoints' },
        { id: 'quiz', label: 'Quiz Me', path: '/quiz' }
    ];

    useEffect(() => {
        if (location.pathname === '/') {
            navigate('/');
        }
    }, [location.pathname, navigate]);

    const handleTabClick = (path) => {
        navigate(path);
    };

    const renderFileUploadSection = () => (
        <UploadSection isDragging={isDragging}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <UploadContainer>
                <InputMethodToggle>
                    <button 
                        className={inputMethod === 'file' ? 'active' : ''}
                        onClick={() => setInputMethod('file')}
                    >
                        📁 File Upload
                    </button>
                    <button 
                        className={inputMethod === 'youtube' ? 'active' : ''}
                        onClick={() => setInputMethod('youtube')}
                    >
                        🎥 YouTube URL
                    </button>
                </InputMethodToggle>

                {inputMethod === 'file' ? (
                    <>
                        <FileInput
                            type="file"
                            id="file-upload"
                            onChange={handleFileInput}
                            accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.mp4,.webm,.ogg,.mov,.avi,.json,.js,.css,.html"
                        />
                        <UploadLabel htmlFor="file-upload">
                            <UploadIcon>
                                {isDragging ? '✨' : '📥'}
                            </UploadIcon>
                            <h3>Drop Your Content Here!</h3>
                            <p>
                                {isDragging 
                                    ? "Yasss! Drop it like it's hot 🔥" 
                                    : "Drag & drop or tap to level up ⚡️"}
                            </p>
                            <FileTypesGrid>
                                <FileTypeTag>📄 PDFs</FileTypeTag>
                                <FileTypeTag>📝 Docs</FileTypeTag>
                                <FileTypeTag>📹 Videos</FileTypeTag>
                                <FileTypeTag>📋 Text</FileTypeTag>
                            </FileTypesGrid>
                        </UploadLabel>
                    </>
                ) : (
                    <div>
                        <YoutubeUrlForm onSubmit={handleYouTubeUrlSubmit}>
                            <YoutubeInputContainer>
                                <YoutubeUrlInput 
                                    type="text"
                                    placeholder="Enter YouTube URL"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                />
                                <GenerateButton
                                    type="submit"
                                    disabled={!youtubeUrl || loading}
                                >
                                    {loading ? 'Loading Video...' : 'Load Video'}
                                </GenerateButton>
                            </YoutubeInputContainer>
                        </YoutubeUrlForm>
                    </div>
                )}
            </UploadContainer>
        </UploadSection>
    );

    const renderContent = () => {
        const currentPath = location.pathname === '/' ? '/' : location.pathname;

        switch (currentPath) {
            case '/':
                return (
                    <MainContentWrapper>
                        <MainContent>
                            {!selectedFile || !fileContent ? (
                                renderFileUploadSection()
                            ) : (
                                <FilePreviewContainer>
                                    <PreviewHeader>
                                        <h3>📑 {selectedFile.name}</h3>
                                        <ClosePreviewButton 
                                            onClick={() => {
                                                setFileContent(null);
                                                setSelectedFile(null);
                                                setFileType(null);
                                                setPreviewError(null);
                                            }}
                                        >
                                            ❌
                                        </ClosePreviewButton>
                                    </PreviewHeader>
                                    {renderFilePreview()}
                                </FilePreviewContainer>
                            )}
                        </MainContent>
                        <AIAssistantContainer>
                            <AIAssistant uploadedFile={selectedFile} />
                        </AIAssistantContainer>
                    </MainContentWrapper>
                );
            case '/notes':
                return <AINotes uploadedFile={selectedFile} />;
            case '/summary':
                return <AISummary uploadedFile={selectedFile} />;
            case '/flashcards':
                return <AIFlashcards uploadedFile={selectedFile} />;
            case '/keypoints':
                return <AIKeypoints uploadedFile={selectedFile} />;
            case '/quiz':
                return <AIQuiz uploadedFile={selectedFile} />;
            default:
                return null;
        }
    };

    return (
        <ContentContainer>
            <TabsNav>
                {tabs.map((tab) => (
                    <TabButton
                        key={tab.id}
                        active={location.pathname === tab.path}
                        onClick={() => handleTabClick(tab.path)}
                    >
                        {tab.label}
                    </TabButton>
                ))}
            </TabsNav>
            {renderContent()}
            {showSuccess && <div>File uploaded successfully!</div>}
        </ContentContainer>
    );
}

export default Content;