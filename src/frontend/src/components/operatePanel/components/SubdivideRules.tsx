import React from 'react';
import { SubdivideRulesProps } from '../types/types';

const SubdivideRules: React.FC<SubdivideRulesProps> = ({ subdivideRules, layers, formatNumber }) => {
  // Sort subdivision rules by id
  const sortedRules = [...subdivideRules].sort((a, b) => a.id - b.id);
  
  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <h3 className="font-semibold text-sm mb-2">Subdivide Rules</h3>
      <div className="space-y-3">
        {sortedRules.map((rule, index) => {
          if (rule.cols === 0 || rule.rows === 0) return null;
          
          const layer = layers.find(l => l.id === rule.id);
          if (!layer) return null;
          
          // Calculate boundary width and height
          const originalWidth = rule.originalBounds[2] - rule.originalBounds[0];
          const originalHeight = rule.originalBounds[3] - rule.originalBounds[1];
          const adjustedWidth = rule.adjustedBounds[2] - rule.adjustedBounds[0];
          const adjustedHeight = rule.adjustedBounds[3] - rule.adjustedBounds[1];
          
          return (
            <div key={rule.id} className="p-2 bg-gray-50 rounded border border-gray-200">
              <h4 className="text-sm font-medium mb-2">Layer {index + 1}</h4>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-medium">Grid:</span> {rule.cols} × {rule.rows} tiles
                </div>
                {index === 0 ? (
                  <>
                    <div>
                      <span className="font-medium">Base subdivision ratio:</span> {rule.xRatio.toFixed(4)} × {rule.yRatio.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-medium">Original bounds:</span>
                    </div>
                    <div className="pl-2">
                      <div>minX: {formatNumber(rule.originalBounds[0])}, minY: {formatNumber(rule.originalBounds[1])}</div>
                      <div>maxX: {formatNumber(rule.originalBounds[2])}, maxY: {formatNumber(rule.originalBounds[3])}</div>
                      <div>Width: {formatNumber(originalWidth)}, Height: {formatNumber(originalHeight)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Adjusted bounds:</span>
                    </div>
                    <div className="pl-2">
                      <div>minX: {formatNumber(rule.adjustedBounds[0])}, minY: {formatNumber(rule.adjustedBounds[1])}</div>
                      <div>maxX: {formatNumber(rule.adjustedBounds[2])}, maxY: {formatNumber(rule.adjustedBounds[3])}</div>
                      <div>Width: {formatNumber(adjustedWidth)}, Height: {formatNumber(adjustedHeight)}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Bounds are adjusted to ensure precise grid division
                    </div>
                  </>
                ) : index === layers.length - 1 ? (
                  <div>
                    <span className="font-medium">Subdivision ratio:</span> 1 × 1 (last level)
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">Subdivision ratio:</span> {rule.xRatio.toFixed(0)} × {rule.yRatio.toFixed(0)} (relative to previous level)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubdivideRules; 