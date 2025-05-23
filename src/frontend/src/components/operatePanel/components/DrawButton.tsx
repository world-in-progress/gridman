import React, { useContext } from 'react';
import { DrawButtonProps } from '../types/types';
import { LanguageContext } from '../../../context';

const DrawButton: React.FC<DrawButtonProps> = ({
    isDrawing,
    rectangleCoordinates,
    onClick,
}) => {
    const { language } = useContext(LanguageContext);
    const translations = {
        drawing: {
            en: 'Click to cancel rectangle drawing',
            zh: '点击取消矩形绘制',
        },
        redraw: {
            en: 'Delete rectangle and redraw',
            zh: '删除矩形并重新绘制',
        },
        draw: {
            en: 'Click to draw rectangle',
            zh: '点击绘制矩形',
        },
        instructions: {
            title: {
                en: 'Drawing method:',
                zh: '绘制方法:',
            },
            step1: {
                en: 'Click on the map to set starting point',
                zh: '点击地图设置起始点',
            },
            step2: {
                en: 'Move the mouse to desired location',
                zh: '移动鼠标到所需位置',
            },
            step3: {
                en: 'Click again to complete drawing',
                zh: '再次点击完成绘制',
            },
        },
    };

    return (
        <>
            <button
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${
                    isDrawing
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : rectangleCoordinates
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                onClick={onClick}
            >
                {isDrawing
                    ? language === 'zh'
                        ? translations.drawing.zh
                        : translations.drawing.en
                    : rectangleCoordinates
                    ? language === 'zh'
                        ? translations.redraw.zh
                        : translations.redraw.en
                    : language === 'zh'
                    ? translations.draw.zh
                    : translations.draw.en}
            </button>

            {isDrawing && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-800">
                    <p>
                        {language === 'zh'
                            ? translations.instructions.title.zh
                            : translations.instructions.title.en}
                    </p>
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>
                            {language === 'zh'
                                ? translations.instructions.step1.zh
                                : translations.instructions.step1.en}
                        </li>
                        <li>
                            {language === 'zh'
                                ? translations.instructions.step2.zh
                                : translations.instructions.step2.en}
                        </li>
                        <li>
                            {language === 'zh'
                                ? translations.instructions.step3.zh
                                : translations.instructions.step3.en}
                        </li>
                    </ol>
                </div>
            )}
        </>
    );
};

export default DrawButton;
