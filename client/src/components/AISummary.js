import React, { useState } from 'react';
import styled from 'styled-components';

const SummaryLayout = styled.div`
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
  margin-bottom: 24px;

  .upload-button {
    width: 100%;
    padding: 12px;
    background: #22252d;
    border: 2px dashed #2a2d35;
    border-radius: 12px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-size: 0.9rem;

    &:hover {
      border-color: #FF61D8;
      background: rgba(255, 97, 216, 0.1);
    }

    input {
      display: none;
    }
  }

  .file-info {
    margin-top: 12px;
    padding: 12px;
    background: #22252d;
    border-radius: 8px;
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

const SummaryContainer = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #2a2d35;
  color: #ffffff;
  min-height: 80vh;

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

  .error {
    padding: 16px;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid #FF6B6B;
    border-radius: 8px;
    color: #FF6B6B;
    margin-bottom: 20px;
  }
`;

const SummaryContent = styled.div`
  line-height: 1.6;
  color: #ffffff;

  .summary-section {
    background: #22252d;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #2a2d35;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: #FF61D8;
    }
  }

  h2 {
    color: #6B8AFF;
    margin: 0 0 16px;
    font-size: 1.4rem;
  }

  h3 {
    color: #00FFA3;
    margin: 20px 0 12px;
    font-size: 1.2rem;
  }

  p {
    margin-bottom: 16px;
    font-size: 1rem;
    color: #ffffff;
  }

  ul, ol {
    margin: 16px 0;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
      color: #ffffff;
    }
  }

  .key-points {
    display: grid;
    gap: 12px;
    margin: 16px 0;

    .point {
      background: #1a1d24;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #2a2d35;
      transition: all 0.3s ease;

      &:hover {
        border-color: #6B8AFF;
        transform: translateX(4px);
      }
    }
  }

  .highlight {
    background: rgba(255, 97, 216, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    color: #FF61D8;
  }

  code {
    background: #13151a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    color: #00FFA3;
  }

  pre {
    background: #13151a;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid #2a2d35;

    code {
      background: none;
      padding: 0;
    }
  }
`;

const NoSummary = styled.div`
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

export default function AISummary() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const generateSummary = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5002/process/summary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryContent = () => {
    if (!summary) return null;

    const sections = summary.split('\n\n').filter(Boolean);
    return sections.map((section, index) => {
      const [title, ...content] = section.split(':');
      return (
        <div key={index} className="summary-section">
          <h2>{title.trim()}</h2>
          <div className="content">
            {content.join(':').trim().split('\n').map((paragraph, pIndex) => (
              <p key={pIndex}>{paragraph}</p>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <SummaryLayout>
      <Sidebar>
        <h2>Smart Summary</h2>
        <FileUpload>
          <label className="upload-button">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx"
            />
            {file ? '📎 Change File' : '📄 Upload Document'}
          </label>
          {file && (
            <div className="file-info">
              Selected: {file.name}
            </div>
          )}
        </FileUpload>
        <GenerateButton
          onClick={generateSummary}
          disabled={!file || loading}
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </GenerateButton>
      </Sidebar>

      <SummaryContainer>
        <h1>Smart Summary</h1>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Generating smart summary...</div>
        ) : summary ? (
          <SummaryContent>
            {renderSummaryContent()}
          </SummaryContent>
        ) : (
          <NoSummary>
            <div className="icon">📋</div>
            <h3>No Summary Generated Yet</h3>
            <p>Upload a document and click 'Generate Summary' to get started</p>
          </NoSummary>
        )}
      </SummaryContainer>
    </SummaryLayout>
  );
}
