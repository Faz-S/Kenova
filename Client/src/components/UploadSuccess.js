import React from 'react';

const UploadSuccess = ({ show, onClose }) => {
  if (!show) return null;

  const messages = [
    "Yasss! File uploaded fr fr! 💅",
    "No cap, that upload was bussin! 🔥",
    "Sheeeesh! File's in the cloud bestie! ✨",
    "We ate and left no crumbs! Upload complete! 💁‍♂️",
    "It's giving main character energy! Upload success! 🌟"
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="upload-success-overlay" onClick={onClose}>
      <div className="upload-success-modal">
        <div className="success-emoji">✨</div>
        <h3>{randomMessage}</h3>
        <div className="success-tags">
          <span>#slay</span>
          <span>#periodt</span>
          <span>#iconic</span>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccess;
