import React from 'react';
import { CoordinateBoxProps } from '../types/types';

const CoordinateBox: React.FC<CoordinateBoxProps> = ({ title, coordinates, formatCoordinate }) => {
  if (!coordinates) return null;
  
  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="space-y-2 text-xs">
        <div><span className="font-medium">Northeast:</span> {formatCoordinate(coordinates.northEast)}</div>
        <div><span className="font-medium">Southeast:</span> {formatCoordinate(coordinates.southEast)}</div>
        <div><span className="font-medium">Southwest:</span> {formatCoordinate(coordinates.southWest)}</div>
        <div><span className="font-medium">Northwest:</span> {formatCoordinate(coordinates.northWest)}</div>
        <div><span className="font-medium">Center:</span> {formatCoordinate(coordinates.center)}</div>
      </div>
    </div>
  );
};

export default CoordinateBox; 