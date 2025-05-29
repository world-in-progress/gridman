import React, { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '@/context';
import DrawButton from '@/components/operatePanel/components/DrawButton';
import { Separator } from '@radix-ui/react-separator';
import { UpdatedPatchBoundsProps } from '../types/types';

export default function PatchBounds({
    isDrawing,
    rectangleCoordinates,
    onDrawRectangle,
    convertedRectangle,
    setConvertedRectangle,
    onAdjustAndDraw,
    drawExpandedRectangleOnMap,
}: UpdatedPatchBoundsProps) {

    const { language } = useContext(LanguageContext);

    const formatSingleValue = (value: number): string => value.toFixed(6);
    
    const [isError, setIsError] = useState<boolean>(false); 
    const [eastValue, setEastValue] = useState<string>('');
    const [westValue, setWestValue] = useState<string>('');
    const [northValue, setNorthValue] = useState<string>('');
    const [southValue, setSouthValue] = useState<string>('');
    const [center, setCenter] = useState<{ x: number; y: number } | null>(null);

    const handleButtonClick = () => {
        onDrawRectangle(!isDrawing);
    };

    useEffect(() => {
        const n = parseFloat(northValue);
        const s = parseFloat(southValue);
        const e = parseFloat(eastValue);
        const w = parseFloat(westValue);

        if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
            if (w > e || s > n) {
                setIsError(true);
                setCenter(null); 
            } else {
                const centerX = (e + w) / 2;
                const centerY = (n + s) / 2;
                setCenter({ x: centerX, y: centerY });
                setIsError(false); 
            }
        } else {
            setCenter(null); 
            setIsError(false);
        }
    }, [northValue, southValue, eastValue, westValue]);

    useEffect(() => {
        if (convertedRectangle) {
            setNorthValue(formatSingleValue(convertedRectangle.northEast[1]));
            setSouthValue(formatSingleValue(convertedRectangle.southWest[1]));
            setEastValue(formatSingleValue(convertedRectangle.northEast[0]));
            setWestValue(formatSingleValue(convertedRectangle.southWest[0]));
        } else {
             setNorthValue('');
             setSouthValue('');
             setEastValue('');
             setWestValue('');
        }
    }, [convertedRectangle]);

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '补丁包围边界' : 'Patch Bounds'}
            </h2>
            <div>
                <div className="mb-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <div className="font-bold text-md mb-2">
                        {language === 'zh' ? '方法一：绘制生成' : 'Method One: Draw to generate'}
                    </div>
                    <DrawButton
                        isDrawing={isDrawing}
                        rectangleCoordinates={rectangleCoordinates}
                        onClick={handleButtonClick}
                    />
                </div>
                <Separator className="h-px mb-2 bg-gray-300" />
                <div className=" p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <div className="mb-2 font-bold text-md">
                        {language === 'zh' ? '方法二：输入参数生成' : 'Method Two: Input parameters to generate'}
                    </div>
                    <div className="grid grid-cols-3 mb-2 gap-1 text-xs">
                        {/* Top Left Corner */}
                        <div className="relative h-12 flex items-center justify-center">
                            <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
                        </div>
                        {/* North/Top - northEast[1] */}
                        <div className="text-center -mt-2">
                            <span className="font-bold text-blue-600 text-xl">
                                N
                            </span>
                            {/* Input for North */}
                            <input
                                type="number"
                                value={northValue}
                                onChange={(e) => {
                                    setNorthValue(e.target.value);
                                    const n = parseFloat(e.target.value);
                                    const s = parseFloat(southValue);
                                    const eVal = parseFloat(eastValue);
                                    const w = parseFloat(westValue);
                                    if (!isNaN(n) && !isNaN(s) && !isNaN(eVal) && !isNaN(w)) {
                                        setConvertedRectangle({
                                            northEast: [eVal, n],
                                            southWest: [w, s],
                                            southEast: [eVal, s],
                                            northWest: [w, n],
                                            center: [(w + eVal) / 2, (s + n) / 2],
                                        });
                                    }
                                }}
                                className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                placeholder={
                                    language == 'zh' ? '请输入' : 'Enter max Y'
                                }
                                step="any" 
                            />
                        </div>
                        {/* Top Right Corner */}
                        <div className="relative h-12 flex items-center justify-center">
                            <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
                        </div>
                        {/* West/Left - southWest[0] */}
                        <div className="text-center">
                            <span className="font-bold text-green-600 text-xl">
                                W
                            </span>
                            {/* Input for West */}
                            <input
                                type="number"
                                value={westValue}
                                onChange={(e) => setWestValue(e.target.value)}
                                className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                placeholder={
                                    language == 'zh' ? '请输入' : 'Enter mix X'
                                }
                                step="any"
                            />
                        </div>
                        {/* Center */}
                        <div className="text-center">
                            <span className="font-bold text-[#FF8F2E] text-xl">
                                {language === 'zh' ? '中心' : 'Center'}
                            </span>
                            <div
                                className={`text-[10px] mt-1 ${
                                    isError ? 'text-red-600' : ''
                                }`}
                            >
                                {isError
                                    ? language === 'zh' ? '坐标错误' : 'Coordinate Error'
                                    : center
                                    ? `${formatSingleValue(
                                          center.x
                                      )}, ${formatSingleValue(center.y)}`
                                    : language == 'zh'
                                    ? '输入边界值'
                                    : 'Enter bounds'}
                            </div>
                        </div>
                        {/* East/Right - southEast[0] */}
                        <div className="text-center">
                            <span className="font-bold text-red-600 text-xl">
                                E
                            </span>
                            {/* Input for East */}
                            <input
                                type="number"
                                value={eastValue}
                                onChange={(e) => setEastValue(e.target.value)}
                                className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                placeholder={
                                    language == 'zh' ? '请输入' : 'Enter max X'
                                }
                                step="any"
                            />
                        </div>
                        {/* Bottom Left Corner */}
                        <div className="relative h-12 flex items-center justify-center">
                            <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
                        </div>
                        {/* South/Bottom - southWest[1] */}
                        <div className="text-center mt-2">
                            <span className="font-bold text-purple-600 text-xl">
                                S
                            </span>
                            {/* Input for South */}
                            <input
                                type="number"
                                value={southValue}
                                onChange={(e) => setSouthValue(e.target.value)}
                                className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                placeholder={
                                    language == 'zh' ? '请输入' : 'Enter max X'
                                }
                                step="any"
                            />
                        </div>
                        {/* Bottom Right Corner */}
                        <div className="relative h-12 flex items-center justify-center">
                            <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
                        </div>
                    </div>
                    <button
                        className="w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => {
                            onAdjustAndDraw(northValue, southValue, eastValue, westValue);
                            if (drawExpandedRectangleOnMap) {
                                drawExpandedRectangleOnMap();
                            }
                        }}
                    >
                        {language === 'zh' ? '点击调整并绘制边界' : 'Click to adjust and draw bounds'}
                    </button>
                </div>
            </div>
        </div>
    );
}
