import React from 'react';
import { DrawButtonProps } from '../types/types';

const DrawButton: React.FC<DrawButtonProps> = ({
  isDrawing,
  rectangleCoordinates,
  onClick,
}) => {
  return (
    <>
      <button
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${
          isDrawing
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : rectangleCoordinates
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
        onClick={onClick}
      >
        {isDrawing
          ? 'Click to cancel rectangle drawing'
          : rectangleCoordinates
          ? 'Delete rectangle and redraw'
          : 'Click to draw rectangle'}
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
