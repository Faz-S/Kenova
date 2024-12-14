import React from 'react';
import styled from 'styled-components';
import { PreviewContent, LoadingSpinner, SuccessMessage, ErrorMessage } from './FileUploadStyles';

const FilePreview = ({ file, previewContent, previewError, showSuccess, isLoading }) => {
  return (
    <div>
      <h3>File Preview: {file.name}</h3>
      {isLoading && <LoadingSpinner>Processing file...</LoadingSpinner>}
      {showSuccess && <SuccessMessage>File processed successfully!</SuccessMessage>}
      {previewError && <ErrorMessage>{previewError}</ErrorMessage>}
      {previewContent && <PreviewContent>{previewContent}</PreviewContent>}
    </div>
  );
};

export default FilePreview;
