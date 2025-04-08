import React from 'react';

interface DrawGridButtonProps {
  onClick: () => void;
}

const DrawGridButton: React.FC<DrawGridButtonProps> = ({ onClick }) => {
  return (
    <button
      className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      Draw Grid
    </button>
  );
};

export default DrawGridButton; 