import React from 'react';
import Lottie from 'lottie-react';
import folderAnimation from './Folder.json';

interface FolderAnimationProps {
  className?: string;
}

const FolderAnimation: React.FC<FolderAnimationProps> = ({ className }) => {
  return (
    <Lottie 
      animationData={folderAnimation} 
      loop={true}  
      autoplay={true}
      className={className || "w-[200px] h-[200px]"}
    />
  );
};

export default FolderAnimation;
