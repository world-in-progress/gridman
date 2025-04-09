import React from 'react';
import { DrawButtonProps } from '../types/types';

const DrawButton: React.FC<DrawButtonProps> = ({ isDrawing, rectangleCoordinates, onClick }) => {
  return (
    <>
      <button
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${
          isDrawing 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        onClick={onClick}
      >
        {isDrawing 
          ? 'Click to cancel drawing' 
          : rectangleCoordinates 
            ? 'Delete rectangle and redraw' 
            : 'Click to draw rectangle'
        }
      </button>
      
      {isDrawing && (
        <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-800">
          <p>Drawing method:</p>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Click on the map to set starting point</li>
            <li>Move the mouse to desired location</li>
            <li>Click again to complete drawing</li>
          </ol>
        </div>
      )}
    </>
  );
};

export default DrawButton; 