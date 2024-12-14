import React from 'react';
import styled from 'styled-components';
import { useFileUpload } from '../../hooks/useFileUpload';
import { UploadArea, PreviewArea } from './FileUploadStyles';
import FilePreview from './FilePreview';
import UploadButton from '../UI/UploadButton';

const FileUploadSection = () => {
  const {
    handleDragOver,
    handleDrop,
    handleFileChange,
    handleFileUpload,
    file,
    previewContent,
    previewError,
    showSuccess,
    isLoading
  } = useFileUpload();

  return (
    <section>
      <UploadArea
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        isDragging={false}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx"
          style={{ display: 'none' }}
          id="file-upload"
        />
        <UploadButton />
      </UploadArea>

      {file && (
        <PreviewArea>
          <FilePreview
            file={file}
            previewContent={previewContent}
            previewError={previewError}
            showSuccess={showSuccess}
            isLoading={isLoading}
          />
        </PreviewArea>
      )}
    </section>
  );
};

export default FileUploadSection;
