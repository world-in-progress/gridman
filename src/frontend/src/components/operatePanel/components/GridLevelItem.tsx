import React from 'react';
import { GridLevelItemProps } from '../types/types';

const GridLevelItem: React.FC<GridLevelItemProps> = ({
  layer,
  index,
  error,
  onUpdateWidth,
  onUpdateHeight,
  onRemoveLayer
}) => {
  return (
    <div className="p-2 bg-gray-50 rounded border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Level {index + 1}</h4>
        <button
          className="px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs cursor-pointer"
          onClick={() => onRemoveLayer(layer.id)}
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1">Width/m</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            value={layer.width}
            onChange={(e) => onUpdateWidth(layer.id, e.target.value)}
            placeholder="Width"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Height/m</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            value={layer.height}
            onChange={(e) => onUpdateHeight(layer.id, e.target.value)}
            placeholder="Height"
          />
        </div>
      </div>
      {error && (
        <div className="mt-2 p-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default GridLevelItem; 