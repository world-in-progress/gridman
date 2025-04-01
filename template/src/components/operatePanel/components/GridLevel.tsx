import React from 'react';
import { GridLevelProps } from '../types/types';
import GridLevelItem from './GridLevelItem';

const GridLevel: React.FC<GridLevelProps> = ({
  layers,
  layerErrors,
  onAddLayer,
  onUpdateWidth,
  onUpdateHeight,
  onRemoveLayer
}) => {
  // Sort layers by id
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
  
  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Grid Level</h3>
        <button
          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm cursor-pointer"
          onClick={onAddLayer}
        >
          <span className="text-lg">+</span> Add Grid Level
        </button>
      </div>
      
      {sortedLayers.length > 0 ? (
        <div className="space-y-3">
          {sortedLayers.map((layer, index) => (
            <GridLevelItem
              key={layer.id}
              layer={layer}
              index={index}
              error={layerErrors[layer.id]}
              onUpdateWidth={onUpdateWidth}
              onUpdateHeight={onUpdateHeight}
              onRemoveLayer={onRemoveLayer}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-2">
          No layers added yet. Click the button above to add a layer.
        </div>
      )}
      
      {sortedLayers.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
          <p>Grid levels should follow these rules:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>Each level should have smaller cell dimensions than the previous level</li>
            <li>Previous level's width/height must be a multiple of the current level's width/height</li>
            <li>First level defines the base grid cell size, and higher levels define increasingly finer grids</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GridLevel; 