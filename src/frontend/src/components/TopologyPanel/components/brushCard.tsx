import React, { useContext } from 'react';
import { BrushCardProps } from '../types/types';
import { LanguageContext } from '../../../context';

const BrushCard: React.FC<BrushCardProps> = ({}) => {
    const { language } = useContext(LanguageContext);
    const translations = {
        label: {
            en: 'Brush select',
            zh: '点选',
        },
        convert: {
            en: 'Convert',
            zh: '转换',
        },
    };

    return (
        <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="flex flex-col">
                <label
                    htmlFor="brush"
                    className="block font-semibold text-lg mb-2"
                >
                    {language === 'zh'
                        ? translations.label.zh
                        : translations.label.en}
                </label>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
                        {language === 'zh'
                            ? translations.convert.zh
                            : translations.convert.en}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrushCard;
