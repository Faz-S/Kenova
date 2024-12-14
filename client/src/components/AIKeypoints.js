import React, { useState } from 'react';
import styled from 'styled-components';

const KeypointsLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: #13151a;
  font-family: 'Space Grotesk', sans-serif;
  overflow: hidden;
`;

const Sidebar = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #2a2d35;
  height: fit-content;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;

  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
    font-size: 1.4rem;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1d24;
  }

  &::-webkit-scrollbar-thumb {
    background: #2a2d35;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #3a3d45;
  }
`;

const KeypointsContainer = styled.div`
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  padding: 30px 30px 0;
  background: #13151a;

  h1 {
    color: #FF61D8;
    margin-bottom: 30px;
    font-size: 2rem;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 30px 30px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #13151a;
  }

  &::-webkit-scrollbar-thumb {
    background: #2a2d35;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #3a3d45;
  }
`;

const Section = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #2a2d35;

  h2 {
    color: #FF61D8;
    margin-bottom: 15px;
    font-size: 1.2rem;
    text-transform: capitalize;
  }

  h3 {
    color: #7DF9FF;
    margin: 15px 0 10px;
    font-size: 1.1rem;
  }

  p {
    color: #ffffff;
    line-height: 1.6;
    margin-bottom: 10px;
  }

  ul {
    list-style-type: none;
    padding-left: 0;
    
    li {
      color: #ffffff;
      margin-bottom: 10px;
      padding-left: 20px;
      position: relative;

      &:before {
        content: "•";
        color: #7DF9FF;
        position: absolute;
        left: 0;
      }
    }
  }
`;

const FileUpload = styled.div`
  margin-bottom: 20px;

  label {
    display: inline-block;
    padding: 12px 20px;
    background: #2a2d35;
    border-radius: 8px;
    cursor: pointer;
    color: #ffffff;
    transition: all 0.3s ease;

    &:hover {
      background: #3a3d45;
    }
  }

  input {
    display: none;
  }

  .file-info {
    margin-top: 10px;
    color: #7DF9FF;
    font-size: 0.9rem;
  }
`;

const GenerateButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #FF61D8;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background: #ff7de0;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
    transform: none;
  }
`;

const NoKeypoints = styled.div`
  text-align: center;
  padding: 40px;
  color: #6B8AFF;

  .icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #FF61D8;
  }

  h3 {
    margin-bottom: 16px;
    color: #FF61D8;
  }

  p {
    margin-bottom: 24px;
    line-height: 1.6;
  }
`;

const ErrorMessage = styled.div`
  background: #ff616130;
  color: #ff6161;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ff6161;
`;

function AIKeypoints() {
  const [file, setFile] = useState(null);
  const [keypoints, setKeypoints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const generateKeypoints = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/process/keypoints', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate keypoints');
      }

      const data = await response.json();
      
      // Parse the JSON string from the response
      let jsonStr = data.response.replace(/```json\n|\n```/g, '');
      const parsedKeypoints = JSON.parse(jsonStr);
      setKeypoints(parsedKeypoints);
    } catch (err) {
      setError('Error generating keypoints: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (value) => {
    if (typeof value === 'string') {
      return <p>{value}</p>;
    }
    
    if (Array.isArray(value)) {
      return (
        <ul>
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([subKey, subValue]) => (
        <div key={subKey}>
          <h3>{subKey.replace(/_/g, ' ')}</h3>
          {renderValue(subValue)}
        </div>
      ));
    }
    
    return null;
  };

  return (
    <KeypointsLayout>
      <Sidebar>
        <h2>Key Points</h2>
        <FileUpload>
          <label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx,.mp4,.webm,.ogg,.mov,.avi,.ogg,.odt,.rtf,.js,.json,.css,.html"
            />
            📄 {file ? 'Change File' : 'Upload Document'}
          </label>
          {file && (
            <div className="file-info">
              Selected: {file.name}
            </div>
          )}
        </FileUpload>
        <GenerateButton
          onClick={generateKeypoints}
          disabled={!file || loading}
        >
          {loading ? 'Generating...' : 'Generate Key Points'}
        </GenerateButton>
      </Sidebar>

      <KeypointsContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {loading ? (
          <div className="loading">Generating key points...</div>
        ) : keypoints ? (
          <>
            <ContentHeader>
              <h1>🔥 Doc Cheat Codes 🔑</h1>
            </ContentHeader>
            <ContentArea>
              {Object.entries(keypoints).map(([key, value]) => (
                <Section key={key}>
                  <h2>{key.replace(/_/g, ' ')}</h2>
                  {renderValue(value)}
                </Section>
              ))}
            </ContentArea>
          </>
        ) : (
          <NoKeypoints>
            <div className="icon">📝</div>
            <h3>No Key Points Generated Yet</h3>
            <p>Upload a document and click 'Generate Key Points' to get started</p>
          </NoKeypoints>
        )}
      </KeypointsContainer>
    </KeypointsLayout>
  );
}

export default AIKeypoints;
