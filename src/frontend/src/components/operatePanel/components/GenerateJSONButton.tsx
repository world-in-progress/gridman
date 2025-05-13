import React, { useContext } from 'react';
import { GenerateJSONButtonProps } from '../types/types';
import { LanguageContext } from '../../../context';

const GenerateJSONButton: React.FC<GenerateJSONButtonProps> = ({ onClick }) => {
  const { language } = useContext(LanguageContext);
  const translations = {
    button: {
      en: 'Generate JSON',
      zh: '生成JSON'
    }
  };

  return (
    <button
      className="mt-2 w-full py-2 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {language === 'zh' ? translations.button.zh : translations.button.en}
    </button>
  );
};

export default GenerateJSONButton; 