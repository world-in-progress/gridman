import React, { useContext } from 'react';
import { DrawGridButtonProps } from '../types/types';
import { LanguageContext } from '../../../context';

const DrawGridButton: React.FC<DrawGridButtonProps> = ({ onClick }) => {
  const { language } = useContext(LanguageContext);
  const translations = {
    button: {
      en: 'Draw Grid',
      zh: '绘制网格'
    }
  };
  
  return (
    <button
      className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {language === 'zh' ? translations.button.zh : translations.button.en}
    </button>
  );
};

export default DrawGridButton; 