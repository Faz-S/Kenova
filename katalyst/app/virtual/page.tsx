'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import styled from 'styled-components';

const VirtualPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  margin-top: 80px;
`;

const ContentContainer = styled.div`
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const VideoContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AIOutputContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 800px;
  width: 100%;
  margin-top: 20px;
`;

const VideoFeed = styled.img`
  max-width: 100%;
  border-radius: 10px;
`;

export default function VirtualPage() {
  const [aiOutput, setAiOutput] = useState<string>('');

  useEffect(() => {
    // Fetch AI output periodically
    const fetchAiOutput = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/get_ai_output');
        setAiOutput(response.data.ai_output);
      } catch (error) {
        console.error('Error fetching AI output:', error);
      }
    };

    // Initial fetch
    fetchAiOutput();

    // Poll every 3 seconds
    const interval = setInterval(fetchAiOutput, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <VirtualPageContainer>
      <Navbar />
      <ContentContainer>
        <VideoContainer>
        
          <VideoFeed 
            src="http://127.0.0.1:5000/video_feed" 
            alt="Video Feed" 
          />
        </VideoContainer>
        
        {aiOutput && (
          <AIOutputContainer>
            <h3>AI Output</h3>
            <p>{aiOutput}</p>
          </AIOutputContainer>
        )}
      </ContentContainer>
    </VirtualPageContainer>
  );
}