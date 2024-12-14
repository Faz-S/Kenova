import { useState } from 'react';
import { processFile } from '../services/fileService';

export const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFile(droppedFile);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      await handleFile(selectedFile);
    }
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setPreviewError('');
    setIsLoading(true);

    try {
      const content = await processFile(selectedFile);
      setPreviewContent(content);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setPreviewError(error.message || 'Unable to process this file. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDragOver,
    handleDrop,
    handleFileChange,
    file,
    previewContent,
    previewError,
    showSuccess,
    isLoading
  };
};
