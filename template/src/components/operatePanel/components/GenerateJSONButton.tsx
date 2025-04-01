import React from 'react';
import { GenerateJSONButtonProps } from '../types/types';

const GenerateJSONButton: React.FC<GenerateJSONButtonProps> = ({ onClick }) => {
  return (
    <button
      className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      Generate JSON
    </button>
  );
};

export default GenerateJSONButton; 