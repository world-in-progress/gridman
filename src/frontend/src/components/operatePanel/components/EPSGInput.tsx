import React, { useContext } from 'react';
import { EPSGInputProps } from '../types/types';
import { LanguageContext } from '../../../context';

const EPSGInput: React.FC<EPSGInputProps> = ({ 
  customEPSG, 
  error, 
  rectangleCoordinates, 
  onEpsgChange, 
  onConvert 
}) => {
  const { language } = useContext(LanguageContext);


  const translations = {
    label: {
      en: 'Target EPSG',
      zh: '目标EPSG'
    },
    placeholder: {
      en: 'Enter EPSG code, e.g.: 2326',
      zh: '输入EPSG代码，例如：2326'
    },
    convert: {
      en: 'Convert',
      zh: '转换'
    }
  };

  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <div className="flex flex-col">
        <label htmlFor="target-epsg" className="block font-semibold text-lg mb-2">
          {language === 'zh' ? translations.label.zh : translations.label.en}
        </label>
        <div className="flex gap-2">
          <input
            id="target-epsg"
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customEPSG}
            onChange={(e) => onEpsgChange(e.target.value)}
            placeholder={language === 'zh' ? translations.placeholder.zh : translations.placeholder.en}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={onConvert}
            disabled={!rectangleCoordinates}
          >
            {language === 'zh' ? translations.convert.zh : translations.convert.en}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default EPSGInput; 