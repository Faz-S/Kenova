import React, { useState } from 'react';
import styled from 'styled-components';

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

const NotesContainer = styled.div`
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

const NotesContent = styled.div`
  line-height: 1.6;
  color: #ffffff;

  h2 {
    color: #6B8AFF;
    margin: 24px 0 16px;
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
  }

  ul, ol {
    margin: 16px 0;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
    }
  }

  blockquote {
    margin: 20px 0;
    padding: 16px;
    border-left: 4px solid #FF61D8;
    background: #22252d;
    border-radius: 0 8px 8px 0;
    font-style: italic;
  }

  code {
    background: #22252d;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    color: #00FFA3;
  }

  pre {
    background: #22252d;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid #2a2d35;

    code {
      background: none;
      padding: 0;
      color: #00FFA3;
    }
  }

  a {
    color: #6B8AFF;
    text-decoration: none;
    border-bottom: 1px dashed #6B8AFF;
    transition: all 0.3s ease;

    &:hover {
      color: #FF61D8;
      border-color: #FF61D8;
    }
  }
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

export default function AINotes() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const generateNotes = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/process/notes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();
      setNotes(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotesLayout>
      <Sidebar>
        <h2>Smart Notes</h2>
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
          onClick={generateNotes}
          disabled={!file || loading}
        >
          {loading ? 'Generating...' : 'Generate Notes'}
        </GenerateButton>
      </Sidebar>

      <NotesContainer>
        <h1>Smart Notes</h1>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Generating smart notes...</div>
        ) : notes ? (
          <NotesContent dangerouslySetInnerHTML={{ __html: notes }} />
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
}
