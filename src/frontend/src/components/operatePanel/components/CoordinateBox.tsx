import React, { useContext } from 'react';
import { CoordinateBoxProps } from '../types/types';
import { LanguageContext } from '../../../App';

const CoordinateBox: React.FC<CoordinateBoxProps> = ({ title, coordinates, formatCoordinate }) => {
  const { language } = useContext(LanguageContext);
  
  if (!coordinates) return null;
  
  const extractY = (coord: [number, number]): number => coord[1];
  const extractX = (coord: [number, number]): number => coord[0];
  const maxY = Math.max(extractY(coordinates.northEast), extractY(coordinates.northWest));
  const minY = Math.min(extractY(coordinates.southEast), extractY(coordinates.southWest));
  const maxX = Math.max(extractX(coordinates.northEast), extractX(coordinates.southEast));
  const minX = Math.min(extractX(coordinates.northWest), extractX(coordinates.southWest));
  
  const formatSingleValue = (value: number): string => value.toFixed(6);
  

  const translations = {
    center: {
      en: 'Center',
      zh: '中心'
    }
  };
  
  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="grid grid-cols-3 gap-1 text-xs">
        {/* Top Left Corner */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
        </div>
        
        {/* North/Top - Display maxY */}
        <div className="text-center">
          <span className="font-bold text-blue-600 text-xl">N</span>
          <div>[{formatSingleValue(maxY)}]</div>
        </div>
        
        {/* Top Right Corner */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
        </div>
        
        {/* West/Left - Display minX */}
        <div className="text-center">
          <span className="font-bold text-green-600 text-xl">W</span>
          <div>[{formatSingleValue(minX)}]</div>
        </div>
        
        {/* Center */}
        <div className="text-center">
          <span className="font-bold text-xl">{language === 'zh' ? translations.center.zh : translations.center.en}</span>
          <div>{formatCoordinate(coordinates.center)}</div>
        </div>
        
        {/* East/Right - Display maxX */}
        <div className="text-center">
          <span className="font-bold text-red-600 text-xl">E</span>
          <div>[{formatSingleValue(maxX)}]</div>
        </div>
        
        {/* Bottom Left Corner */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
        </div>
        
        {/* South/Bottom - Display minY */}
        <div className="text-center">
          <span className="font-bold text-purple-600 text-xl">S</span>
          <div>[{formatSingleValue(minY)}]</div>
        </div>
        
        {/* Bottom Right Corner */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
        </div>
      </div>
    </div>
  );
};

export default CoordinateBox; 