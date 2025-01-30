'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePdfHistoryStore } from './store/pdfHistoryStore';

export default function Home() {
  const { pdfs } = usePdfHistoryStore();
  const recentPdfs = pdfs.slice(0, 2); // Get only the 2 most recent PDFs

  return (
    <main className="min-h-screen bg-[#FFFDF5] p-2 sm:p-4 md:p-8 lg:p-16 space-y-2 sm:space-y-4">
      <h1 
        style={{ fontFamily: 'var(--font-courier-prime)' }}
        className="text-lg sm:text-xl md:text-[40px] font-bold mb-1 sm:mb-2"
      >
        Welcome To <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2C32E] via-[#FF9447] via-[#FF6958] via-[#00CBBB] to-[#4BA943]">EduSage</span>
      </h1>
      
      <div className="relative">
        <div 
          style={{ fontFamily: 'var(--font-courier-prime)' }} 
          className="flex items-center justify-between border-b-2 border-black pb-1 mb-2"
        >
          <h2 className="text-[15px] sm:text-sm md:text-xl font-medium">My Notebooks</h2>
          <Link href="/fileupload">
            <span className="text-lg sm:text-xl md:text-3xl font-bold hover:text-[#FFB800] transition-colors cursor-pointer">
              +
            </span>
          </Link>
        </div>
        
        <div className="max-w-5xl grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 sm:mt-5">
          {recentPdfs.map((pdf, index) => (
            <Link href={`/fileupload?pdf=${encodeURIComponent(pdf.url)}`} key={pdf.url}>
              <div 
                className="w-full aspect-[8/6] border-2 border-black 
                  p-2 sm:p-3 
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] 
                  hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] 
                  transition-all max-sm:aspect-[3/2] 
                  relative overflow-hidden"
              >
                <div className="absolute -top-10 sm:-top-16 w-full flex justify-center z-0">
                  <Image 
                    src={index % 2 === 0 ? "/images/pic.png" : "/images/girl.png"}
                    alt="PDF Icon" 
                    width={400} 
                    height={400} 
                    className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] object-contain transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative z-10 pt-[200px] sm:pt-[250px]">
                  <div className="w-full text-center mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider truncate">
                      {pdf.name.length > 20 ? pdf.name.substring(0, 20) + '...' : pdf.name}
                    </h3>
                  </div>
                  <div className="w-full text-center mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {recentPdfs.length === 0 && (
            <>
              <div 
                className="w-full aspect-[8/6] border-2 border-black 
                  p-2 sm:p-3 
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] 
                  hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] 
                  transition-all max-sm:aspect-[3/2] 
                  relative overflow-hidden"
              >
                <div className="absolute -top-10 sm:-top-16 w-full flex justify-center z-0">
                  <Image 
                    src="/images/pic.png" 
                    alt="PDF Icon" 
                    width={400} 
                    height={400} 
                    className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] object-contain transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative z-10 pt-[200px] sm:pt-[250px]">
                  <div className="w-full text-center mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
                      No PDFs Uploaded
                    </h3>
                  </div>
                </div>
              </div>
              <div 
                className="w-full aspect-[8/6] border-2 border-black 
                  p-2 sm:p-3 
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] 
                  hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] 
                  transition-all max-sm:aspect-[3/2] 
                  relative overflow-hidden"
              >
                <div className="absolute -top-10 sm:-top-16 w-full flex justify-center z-0">
                  <Image 
                    src="/images/pic.png" 
                    alt="PDF Icon" 
                    width={400} 
                    height={400} 
                    className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] object-contain transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative z-10 pt-[200px] sm:pt-[250px]">
                  <div className="w-full text-center mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
                      Upload PDF
                    </h3>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {recentPdfs.length === 1 && (
            <div 
              className="w-full aspect-[8/6] border-2 border-black 
                p-2 sm:p-3 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
               
                cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] 
                hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] 
                transition-all max-sm:aspect-[3/2] 
                relative overflow-hidden"
            >
              <div className="absolute -top-10 sm:-top-16 w-full flex justify-center z-0">
                <Image 
                  src="/images/pic.png" 
                  alt="PDF Icon" 
                  width={400} 
                  height={400} 
                  className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] object-contain transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative z-10 pt-[200px] sm:pt-[250px]">
                <div className="w-full text-center mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
                    Upload another PDF
                  </h3>
                </div>
                <div className="w-full text-center mt-1">
                  <p className="text-xs text-gray-500">
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
