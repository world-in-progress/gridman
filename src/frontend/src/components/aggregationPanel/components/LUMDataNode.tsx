import React, { useContext, forwardRef } from 'react';
import { LanguageContext } from '../../../context';
import { LUMDataNodeProps } from '..//types/types';
import { AnimatedCard, CardBackground, Blob } from './nodeBackground';

const LUMDataNode = forwardRef<HTMLDivElement, LUMDataNodeProps>(
    ({ isClicked, onNodeClick, ...props }, ref) => {
        const { language } = useContext(LanguageContext);

        const LUMDataNodeContent = () => (
            <div className="w-full p-2 bg-white rounded-md  border border-gray-200">
                <h3 className="text-md ml-1 mb-1 font-bold text-center">
                    {language === 'zh' ? '土地利用数据' : 'LUM Data'}
                </h3>
            </div>
        );

        if (isClicked) {
            return (
                <AnimatedCard
                    ref={ref}
                    className="cursor-pointer w-[42%]"
                    onClick={onNodeClick}
                >
                    <CardBackground />
                    <Blob />
                    <div className="z-20 relative rounded-md h-full p-1">
                        <LUMDataNodeContent />
                    </div>
                </AnimatedCard>
            );
        } else {
            return (
                <div ref={ref} onClick={onNodeClick} className="cursor-pointer w-5/12 shadow-sm rounded-md mb-2">
                    <LUMDataNodeContent />
                </div>
            );
        }
    }
);

export default LUMDataNode;
