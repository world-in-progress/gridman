import React, { useContext } from 'react';
import { BrushCardProps } from '../types/types';
import { LanguageContext } from '../../../context';

const BrushCard: React.FC<BrushCardProps> = ({}) => {
    const { language } = useContext(LanguageContext);
    const translations = {
        convert: {
            en: 'Convert',
            zh: '转换',
        },
    };

    return (
        <div className="flex flex-col">
            {/* <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
                    {language === 'zh'
                        ? translations.convert.zh
                        : translations.convert.en}
                </button>
            </div> */}
        </div>
    );
};

export default BrushCard;
