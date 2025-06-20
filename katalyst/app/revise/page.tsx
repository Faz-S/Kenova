'use client';

import FileUploadGreen from '../components/smart-notes/FileUploadGreen';
import KeypointsDisplay from '../components/revise/KeypointsDisplay';
import PageTemplate from '../components/PageTemplate';
import { ReviseProvider, useRevise } from '../contexts/ReviseContext';
import ScanningAnimation from '../components/ScanningAnimation';
import { useState } from 'react';

function ReviseContent() {
  const { sources, keypoints, isProcessing, addSource, removeSource, setKeypoints, setIsProcessing } = useRevise();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (sources.length > 0) {
      return; // Don't add more files if we already have one
    }
    
    const file = files[0]; // Only take the first file
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const source = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      file: selectedFile
    };
    addSource(source);

    // Process the file
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:5002/process/keypoints', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const data = await response.json();
      console.log('Raw backend response:', data);

      let datas = data.response;
      // Clean the string if needed
      if (datas && typeof datas === 'string') {
        // Remove the ```json prefix and ``` suffix if present
        if (datas.startsWith('```json')) {
          datas = datas.trim().slice(7, -3);
        }
      }

      console.log('Cleaned response:', datas);

      // The response is already in the correct format, just pass it through
      setKeypoints(datas);
    } catch (error) {
      console.error('Error processing file:', error);
      setKeypoints(JSON.stringify([{
        Concept: 'Error',
        response: ['Error processing file. Please try uploading the file again.']
      }]));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-20 lg:pt-[6.3rem] px-4 md:px-8 text-sm md:text-base lg:text-lg" style={{ fontFamily: 'var(--font-courier-prime)' }} >
      <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6 max-w-[1400px] mx-auto">
        {/* Left Section - Sources */}
        <div className="bg-[#FFCCA8]">
          <div className="border-2 border-black lg:h-[calc(90vh-80px)] h-auto">
            <div className="p-4 ">
              <h1 className="text-base sm:text-lg font-bold mb-4">Sources</h1>
              <FileUploadGreen
                onFilesSelected={handleFilesSelected}
                onFileRemove={removeSource}
                files={sources}
                buttonText={sources.length === 0 ? "Add source" : "Source added"}
                acceptedFileTypes={['.pdf']}
                disabled={sources.length > 0}
              />
              {selectedFile && !sources.length && (
                <div className="mt-4">
                  <p className="text-xs sm:text-sm mb-2 truncate">Selected: {selectedFile.name}</p>
                  <button 
                    onClick={handleUpload}
                    className="w-full py-2 bg-black text-white hover:bg-gray-800 transition-colors text-xs sm:text-sm"
                  >
                    Upload and Generate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Revision */}
        <div className="bg-[#FFCCA8]">
          <div className="border-2 bg-[#FFCCA8] border-black h-[calc(90vh-80px)] bg-white">
            <div className="p-6 h-full flex flex-col">
              <h1 className="text-base sm:text-lg font-bold mb-4">Revision</h1>
              <div className="flex-1 overflow-y-auto">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <ScanningAnimation />
                  </div>
                ) : keypoints ? (
                  <div className="bg-white rounded-lg h-full">
                    <KeypointsDisplay content={keypoints} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base">
                    Upload a file to generate revision keypoints
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RevisePage() {
  return (
    <PageTemplate>
      <ReviseProvider>
        <ReviseContent />
      </ReviseProvider>
    </PageTemplate>
  );
}
