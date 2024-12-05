import React, { useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import UploadSuccess from './UploadSuccess';
import AIAssistant from './AIAssistant';
import AINotes from './AINotes';
import AISummary from './AISummary';
import './Content.css';

function Content() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('original');
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
                <div className="preview-content error">
                    <p>😕 {previewError}</p>
                </div>
            );
        }

        if (!fileContent) return null;

        switch (fileType) {
            case 'pdf':
                return (
                    <div className="preview-content">
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
                    <div className="preview-content">
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
                    <div className="preview-content" dangerouslySetInnerHTML={{ __html: fileContent }} />
                );

            case 'txt':
            case 'json':
            case 'js':
            case 'css':
            case 'html':
                return (
                    <div className="preview-content">
                        <pre>{fileContent}</pre>
                    </div>
                );

            default:
                return (
                    <div className="preview-content">
                        <p>✨ This file type isn't supported yet!</p>
                        <p>Try uploading a PDF, DOC, DOCX, ODT, RTF, TXT, or video file</p>
                    </div>
                );
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'original':
                return (
                    <div className="main-content-wrapper">
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
                        </div>
                        <div className="ai-assistant-wrapper">
                            <AIAssistant uploadedFile={selectedFile} />
                        </div>
                    </div>
                );
            case 'notes':
                return <AINotes uploadedFile={selectedFile} />;
            case 'summary':
                return <AISummary uploadedFile={selectedFile} />;
            case 'flashcards':
                return (
                    <div className="coming-soon-container">
                        <div className="coming-soon-content">
                            <div className="coming-soon-emoji">🎴</div>
                            <h2>Flashcards? More like Flash-SLAY! ✨</h2>
                            <p>Get ready to level up your study game with:</p>
                            <div className="feature-list">
                                <div className="feature-item">💫 Living rent-free in your brain</div>
                                <div className="feature-item">🎭 Front side? Back side? Both iconic</div>
                                <div className="feature-item">🔄 Swipe right on knowledge</div>
                                <div className="feature-item">🎯 No thoughts, just straight facts</div>
                            </div>
                            <div className="coming-soon-footer">
                                This update? Literally gonna be everything! 💅
                            </div>
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className="coming-soon-container">
                        <div className="coming-soon-content">
                            <div className="coming-soon-emoji">🧩</div>
                            <h2>Quiz Mode: Loading That Heat! 🔥</h2>
                            <p>Bestie, get ready to slay these quizzes with:</p>
                            <div className="feature-list">
                                <div className="feature-item">🎯 Pop off with perfect scores</div>
                                <div className="feature-item">🧠 Big brain energy only</div>
                                <div className="feature-item">💫 Main character moment</div>
                                <div className="feature-item">✨ We ate and left no crumbs</div>
                            </div>
                            <div className="coming-soon-footer">
                                About to be iconic, no cap! 👑
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'original', label: 'Original' },
        { id: 'notes', label: 'Smart Notes' },
        { id: 'summary', label: 'AI Summary' },
        { id: 'flashcards', label: 'Flashcards' },
        { id: 'quiz', label: 'Quiz Me' }
    ];

    return (
        <div className="content-container">
            <nav className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
            {renderTabContent()}
            <UploadSuccess show={showSuccess} onClose={() => setShowSuccess(false)} />
        </div>
    );
}

export default Content;