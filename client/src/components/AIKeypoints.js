import React, { useState } from 'react';
import styled from 'styled-components';

const KeyPointsLayout = styled.div`
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

const KeyPointsContainer = styled.div`
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

const KeyPointsContent = styled.div`
  display: grid;
  gap: 20px;

  .category {
    background: #22252d;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #2a2d35;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: #FF61D8;
    }

    h2 {
      color: #6B8AFF;
      margin-bottom: 16px;
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      gap: 8px;

      .icon {
        color: #FF61D8;
      }
    }
  }

  .points-grid {
    display: grid;
    gap: 12px;

    .point {
      background: #1a1d24;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #2a2d35;
      transition: all 0.3s ease;
      display: flex;
      align-items: flex-start;
      gap: 12px;

      &:hover {
        border-color: #00FFA3;
        transform: translateX(4px);
      }

      .bullet {
        color: #00FFA3;
        font-size: 1.2rem;
      }

      .text {
        color: #ffffff;
        line-height: 1.6;
      }

      .highlight {
        background: rgba(255, 97, 216, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        color: #FF61D8;
        font-weight: 500;
      }
    }
  }
`;

const NoKeyPoints = styled.div`
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

const categoryIcons = {
  'Main Ideas': '💡',
  'Key Concepts': '🔑',
  'Important Details': '📌',
  'Supporting Evidence': '📊',
  'Conclusions': '🎯',
  'Recommendations': '💫',
};

export default function AIKeyPoints() {
  const [file, setFile] = useState(null);
  const [keyPoints, setKeyPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const generateKeyPoints = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/process/keypoints', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate key points');
      }

      const data = await response.json();
      setKeyPoints(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderKeyPointsContent = () => {
    if (!keyPoints) return null;

    const sections = keyPoints.split('\n\n').filter(Boolean);
    return sections.map((section, index) => {
      const [category, ...points] = section.split(':');
      const trimmedCategory = category.trim();
      const icon = categoryIcons[trimmedCategory] || '📝';

      return (
        <div key={index} className="category">
          <h2>
            <span className="icon">{icon}</span>
            {trimmedCategory}
          </h2>
          <div className="points-grid">
            {points.join(':').trim().split('\n').map((point, pIndex) => (
              <div key={pIndex} className="point">
                <span className="bullet">•</span>
                <span className="text">{point.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <KeyPointsLayout>
      <Sidebar>
        <h2>Key Points</h2>
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
          onClick={generateKeyPoints}
          disabled={!file || loading}
        >
          {loading ? 'Generating...' : 'Generate Key Points'}
        </GenerateButton>
      </Sidebar>

      <KeyPointsContainer>
        <h1>Key Points</h1>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Generating key points...</div>
        ) : keyPoints ? (
          <KeyPointsContent>
            {renderKeyPointsContent()}
          </KeyPointsContent>
        ) : (
          <NoKeyPoints>
            <div className="icon">🔑</div>
            <h3>No Key Points Generated Yet</h3>
            <p>Upload a document and click 'Generate Key Points' to get started</p>
          </NoKeyPoints>
        )}
      </KeyPointsContainer>
    </KeyPointsLayout>
  );
}
