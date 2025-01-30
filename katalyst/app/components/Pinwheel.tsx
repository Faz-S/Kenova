'use client';

import React from 'react';

export default function Pinwheel() {
  return (
    <div 
      style={{
        width: "45px",
        height: "45px",
        border: "5px solid #FFF",
        borderBottomColor: 'transparent',
        borderRadius: "50%",
        display: "inline-block",
        boxSizing: "border-box",
        animation: "rotation 1s linear infinite"
      }}
      className="before:content-[''] before:absolute before:top-2 before:left-2 before:w-3 before:h-3 before:bg-white before:rounded-full"
    />
  );
}

// Add the keyframes animation to the global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}
