import React from 'react';
import {
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface BoundsCardProps {
    bounds?: number[];
    language: string;
}

function BoundsCard({ bounds = [], language }: BoundsCardProps) {
    return (
        <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 mt-1">
            {/* Top Left Corner */}
            <div className="relative h-8 flex items-center justify-center">
                <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-300 rounded-tl"></div>
            </div>
            {/* North/Top */}
            <div className="text-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center">
                                <ArrowUp className="h-4 w-4 text-blue-600" />
                                <span className="font-bold text-blue-600 text-sm mb-1">
                                    N
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-[12px]">
                                <p className="font-bold mb-1">
                                    {language === 'zh' ? '北' : 'North'}
                                </p>
                                <p>{bounds[3].toFixed(6)}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Top Right Corner */}
            <div className="relative h-8 flex items-center justify-center">
                <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-300 rounded-tr"></div>
            </div>
            {/* West/Left */}
            <div className="text-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-row items-center justify-center gap-1 mt-2">
                                <ArrowLeft className="h-4 w-4 text-green-600" />
                                <span className="font-bold text-green-600 text-sm mr-1 mt-1">
                                    W
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-[12px]">
                                <p className="font-bold mb-1">
                                    {language === 'zh' ? '西' : 'West'}
                                </p>
                                <p>{bounds[0].toFixed(6)}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Center */}
            <div className="text-center">
                <span className="font-bold text-[14px] text-orange-500">
                    {language === 'zh' ? '中心' : 'Center'}
                </span>
                <div className="text-[12px]">
                    <div>
                        {(
                            (bounds[0] + bounds[2]) /
                            2
                        ).toFixed(6)}
                    </div>
                    <div>
                        {(
                            (bounds[1] + bounds[3]) /
                            2
                        ).toFixed(6)}
                    </div>
                </div>
            </div>
            {/* East/Right */}
            <div className="text-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-row items-center justify-center gap-1 mt-2">
                                <span className="font-bold text-red-600 text-sm mt-1 ml-4">
                                    E
                                </span>
                                <ArrowRight className="h-4 w-4 text-red-600" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-[12px]">
                                <p className="font-bold mb-1">
                                    {language === 'zh' ? '东' : 'East'}
                                </p>
                                <p>{bounds[2].toFixed(6)}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Bottom Left Corner */}
            <div className="relative h-8 flex items-center justify-center">
                <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-300 rounded-bl"></div>
            </div>
            {/* South/Bottom */}
            <div className="text-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-purple-600 text-sm mt-1">
                                    S
                                </span>
                                <ArrowDown className="h-4 w-4 text-purple-600" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-[12px]">
                                <p className="font-bold mb-1">
                                    {language === 'zh' ? '南' : 'South'}
                                </p>
                                <p>{bounds[1].toFixed(6)}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Bottom Right Corner */}
            <div className="relative h-8 flex items-center justify-center">
                <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-300 rounded-br"></div>
            </div>
        </div>
    );
}

export default BoundsCard;
