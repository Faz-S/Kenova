'use client';

import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PDFViewer from '../components/PDFViewer';
import FolderAnimation from '../components/FolderAnimation';
import { Upload, Loader2 } from 'lucide-react';
import { usePdfHistoryStore } from '../store/pdfHistoryStore';

export default function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const addPdf = usePdfHistoryStore(state => state.addPdf);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return false;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setShowPreview(false); // Reset preview when new file is dropped
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setShowPreview(false); // Reset preview when new file is selected
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5002/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('Upload successful:', data);
      
      // Add the PDF to our history store
      addPdf(data.filename, data.url);
      
      // Simulate upload process
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            setShowPreview(true);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-courier-prime)' }}>
      <Navbar isBlurred={!showPreview} />
      
      {isUploading && !showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <FolderAnimation 
            className="w-screen h-screen w-[200px] h-[200px]"
            
            loop={true} 
            debug={true}
          />
          {/* <div className="absolute bottom-20 text-center">
            <p className="text-2xl font-medium">Uploading... {uploadProgress}%</p>
          </div> */}
        </div>
      )}

      {!showPreview ? (
        <div className="h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 md:px-8 pt-20">
          <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl">
            <div className="border-2 border-black p-4 sm:p-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 tracking-wider">FILE UPLOAD</h1>
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className={`
                    w-full aspect-[2/1] border-2 border-black border-dashed 
                    ${isDragging ? 'bg-[#ffc333]' : 'bg-[#FFB800]'}
                    flex flex-col items-center justify-center cursor-pointer 
                    hover:bg-[#ffc333] transition-colors p-4 sm:p-8 relative
                    ${error ? 'border-red-500' : 'border-black'}
                  `}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                  />
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Drop your Notes here!</h2>
                  <p className="text-xs sm:text-sm">Drag & drop or tap to level up</p>
                  {file && (
                    <p className="mt-2 sm:mt-4 font-medium text-sm sm:text-base">Selected: {file.name}</p>
                  )}
                  {error && (
                    <p className="mt-1 sm:mt-2 text-red-500 text-xs sm:text-sm">{error}</p>
                  )}
                  {isDragging && (
                    <div className="absolute inset-0 border-2 border-black border-dashed animate-pulse" />
                  )}
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`
                    w-full py-2 sm:py-3 px-4 sm:px-6 bg-white border-2 border-black text-base sm:text-lg font-medium
                    hover:translate-x-[2px] hover:translate-y-[2px] 
                    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                    active:translate-x-[4px] active:translate-y-[4px] 
                    active:shadow-none 
                    transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    relative
                  `}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="pt-20 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="border-2 border-black p-6 rounded-lg">
              {file && <PDFViewer pdfUrl={URL.createObjectURL(file)} />}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
