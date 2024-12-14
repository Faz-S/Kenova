import React, { useState } from 'react';
import styled from 'styled-components';
import { baseContainerStyle, cardStyle, colors, buttonStyle } from '../styles/theme';

const NotesLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
  background: #13151a;
  font-family: 'Space Grotesk', sans-serif;
`;

const Sidebar = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #2a2d35;
  height: fit-content;
  position: sticky;
  top: 20px;

  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
    font-size: 1.4rem;
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
    margin-top: 12px;
    color: #6B8AFF;
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

const NotesContainer = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #2a2d35;
  color: #ffffff;
  min-height: 80vh;
  overflow-y: auto;

  h1 {
    color: #FF61D8;
    margin-bottom: 24px;
    font-size: 2rem;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #6B8AFF;
    font-size: 1.1rem;
  }
`;

const Section = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #2a2d35;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }

  h2 {
    color: #6B8AFF;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-transform: capitalize;
  }

  p {
    color: #ffffff;
    line-height: 1.8;
    font-size: 1.1rem;
    white-space: pre-wrap;
  }
`;

const SubSection = styled.div`
  margin-top: 1.5rem;
  padding-left: 1.5rem;
  border-left: 2px solid #2a2d35;

  h3 {
    color: #00FFA3;
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
    text-transform: capitalize;
  }

  p {
    font-size: 1rem;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 0.8rem;
      line-height: 1.6;
      position: relative;
      padding-left: 1.5rem;

      &:before {
        content: "•";
        color: #6B8AFF;
        position: absolute;
        left: 0;
      }
    }
  }
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #FF6B6B;
  border-radius: 8px;
  color: #FF6B6B;
  margin-bottom: 20px;
`;

const NoNotes = styled.div`
  text-align: center;
  padding: 40px;
  color: #6B8AFF;

  h3 {
    margin-bottom: 16px;
    color: #FF61D8;
  }

  p {
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #FF61D8;
  }
`;

const renderValue = (value) => {
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  } else if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([subKey, subValue]) => (
      <SubSection key={subKey}>
        <h3>{subKey.replace(/_/g, ' ')}</h3>
        {renderValue(subValue)}
      </SubSection>
    ));
  } else {
    return <p>{value}</p>;
  }
};

const extractJsonFromResponse = (response) => {
  // Remove "Here's a JSON representation..." prefix if it exists
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Invalid response format: No JSON object found');
  }
  
  // Extract only the JSON part
  const jsonStr = response.slice(jsonStart, jsonEnd + 1);
  
  try {
    // Parse the JSON string
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON parsing error:', e);
    throw new Error('Failed to parse JSON response');
  }
};

const AINotes = () => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const generateNotes = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');
    setNotes(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/process/notes', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      try {
        // Extract and parse the JSON from the response
        const parsedNotes = extractJsonFromResponse(data.response);
        setNotes(parsedNotes);
      } catch (e) {
        console.error('Error processing response:', e);
        setError(e.message || 'Failed to process the response');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotesLayout>
      <Sidebar>
        <h2>✨ Smart Notes</h2>
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
          onClick={generateNotes}
          disabled={!file || loading}
        >
          {loading ? '🔮 Generating...' : '✨ Generate Notes'}
        </GenerateButton>
      </Sidebar>

      <NotesContainer>
        {error && <ErrorMessage>❌ {error}</ErrorMessage>}
        
        {loading ? (
          <div className="loading">🔮 Generating your smart notes...</div>
        ) : notes ? (
          <>
            <h1>📚 Smart Notes</h1>
            {Object.entries(notes).map(([key, value]) => (
              <Section key={key}>
                <h2>{key.replace(/_/g, ' ')}</h2>
                {renderValue(value)}
              </Section>
            ))}
          </>
        ) : (
          <NoNotes>
            <div className="icon">📝</div>
            <h3>No Notes Generated Yet</h3>
            <p>Upload a document and click 'Generate Notes' to get started</p>
          </NoNotes>
        )}
      </NotesContainer>
    </NotesLayout>
  );
};

export default AINotes;
