import React from 'react';
import { DrawGridButtonProps } from '../types/types';

const DrawGridButton: React.FC<DrawGridButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <button
      className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      Draw Grid
    </button>
  );
};

export default DrawGridButton; 