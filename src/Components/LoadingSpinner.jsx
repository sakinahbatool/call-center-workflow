import React from 'react';

// A simple component for a visual loader
const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
      <div className="flex flex-col items-center">
        {/* Simple spinning animation */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-2"></div>
        <p className="text-purple-700 font-medium">Generating TypeScript...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;