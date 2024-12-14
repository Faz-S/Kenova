import React from 'react';
import styled from 'styled-components';
import ReactPlayer from 'react-player';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { colors } from '../../styles/theme';

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
`;

const TextPreview = styled.pre`
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Space Grotesk', monospace;
  line-height: 1.5;
  padding: 1rem;
  background: ${colors.glass};
  border-radius: 12px;
  border: 1px solid ${colors.border};
`;

const ValidationError = styled.div`
  color: ${colors.warning};
  padding: 1rem;
  background: rgba(255, 184, 0, 0.1);
  border-radius: 12px;
  text-align: center;
`;

const FilePreviewComponent = ({ fileContent, fileType, previewError }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

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

export default FilePreviewComponent;
