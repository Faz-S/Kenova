import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import scanningAnimation from './Scanning.json';

const ScanningAnimation: React.FC = () => {
  useEffect(() => {
    console.log('Scanning animation component mounted');
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full bg-white p-4">
      <Lottie 
        animationData={scanningAnimation} 
        loop={true} 
        className="w-64 h-64"
        style={{ width: '256px', height: '256px' }}
      />
    </div>
  );
};

export default ScanningAnimation;
