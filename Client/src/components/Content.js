import React, { useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import UploadSuccess from './UploadSuccess';

function Content() {
    const [activeTab, setActiveTab] = useState('original');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileContent, setFileContent] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];
            setSelectedFile(file);
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
            setPreviewError('Unable to preview this file type. Please try another file.');
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
            await processFile(file);
        }
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            await processFile(file);
        }
    };

    const renderFilePreview = () => {
        if (previewError) {
            return (
                <div className="preview-error">
                    <p>😕 {previewError}</p>
                </div>
            );
        }

        if (!fileContent) return null;

        switch (fileType) {
            case 'pdf':
                return (
                    <div className="pdf-viewer">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <Viewer
                                fileUrl={fileContent}
                                plugins={[defaultLayoutPluginInstance]}
                            />
                        </Worker>
                    </div>
                );

            case 'mp4':
            case 'webm':
            case 'ogg':
            case 'mov':
            case 'avi':
                return (
                    <div className="video-player">
                        <ReactPlayer
                            url={fileContent}
                            controls={true}
                            width="100%"
                            height="100%"
                            pip={true}
                            stopOnUnmount={false}
                            playsinline={true}
                            config={{
                                file: {
                                    attributes: {
                                        controlsList: 'nodownload',
                                        disablePictureInPicture: false,
                                        style: {
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                );

            case 'doc':
            case 'docx':
            case 'odt':
            case 'rtf':
                return (
                    <div className="doc-preview" dangerouslySetInnerHTML={{ __html: fileContent }} />
                );

            case 'txt':
            case 'json':
            case 'js':
            case 'css':
            case 'html':
                return (
                    <div className="text-preview">
                        <pre>{fileContent}</pre>
                    </div>
                );

            default:
                return (
                    <div className="unsupported-preview">
                        <p>✨ This file type isn't supported yet!</p>
                        <p>Try uploading a PDF, DOC, DOCX, ODT, RTF, TXT, or video file</p>
                    </div>
                );
        }
    };

    return (
        <div className="content">
            <nav className="content-nav">
                {[
                    { id: 'original', label: ' Original', icon: '📄' },
                    { id: 'notes', label: 'Smart Notes', icon: '✍️' },
                    { id: 'summary', label: 'AI Summary', icon: '📝' },
                    { id: 'flashcards', label: 'Flashcards', icon: '🎯' },
                    { id: 'quiz', label: 'Quiz Me', icon: '🧠' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="nav-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="main-content">
                {!fileContent ? (
                    <div className={`upload-section ${isDragging ? 'dragging' : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="upload-container">
                            <input
                                type="file"
                                id="file-upload"
                                className="file-input"
                                onChange={handleFileInput}
                                accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.mp4,.webm,.ogg,.mov,.avi,.json,.js,.css,.html"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload" className="upload-label">
                                <div className="upload-icon">
                                    {isDragging ? '✨' : '📥'}
                                </div>
                                <h3>Drop Your Content Here!</h3>
                                <p className="upload-text">
                                    {isDragging 
                                        ? "Yasss! Drop it like it's hot 🔥" 
                                        : "Drag & drop or tap to level up ⚡️"}
                                </p>
                                <div className="file-types-grid">
                                    <span className="file-type-tag">📄 PDFs</span>
                                    <span className="file-type-tag">📝 Docs</span>
                                    <span className="file-type-tag">📹 Videos</span>
                                    <span className="file-type-tag">📋 Text</span>
                                </div>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="file-preview-container">
                        <div className="preview-header">
                            <h3>📑 {selectedFile.name}</h3>
                            <button 
                                className="close-preview" 
                                onClick={() => {
                                    setFileContent(null);
                                    setSelectedFile(null);
                                    setFileType(null);
                                    setPreviewError(null);
                                }}
                            >
                                ❌
                            </button>
                        </div>
                        {renderFilePreview()}
                    </div>
                )}
                
                <div className="ai-sidebar">
                    <div className="ai-question">
                        <p>Ready to transform your content? Drop your files and let's get started! 🚀</p>
                    </div>
                    <div className="ai-response">
                        <p>Here's what I can do with your files:</p>
                        <div className="response-section">
                            <ul>
                                <li>✍️ Create smart summaries</li>
                                <li>🎯 Generate flashcards</li>
                                <li>🧠 Make interactive quizzes</li>
                                <li>💡 Answer your questions</li>
                            </ul>
                        </div>
                    </div>
                    <div className="ai-input-container">
                        <input type="text" placeholder="Ask me anything..." className="ai-input" />
                        <button className="send-button">✨</button>
                    </div>
                </div>
            </div>
            <UploadSuccess show={showSuccess} onClose={() => setShowSuccess(false)} />
        </div>
    );
}

export default Content;
