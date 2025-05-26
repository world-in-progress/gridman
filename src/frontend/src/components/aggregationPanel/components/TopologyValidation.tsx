import React, { useContext, forwardRef } from 'react';
import { LanguageContext } from '../../../context';
import { TopologyValidationProps } from '..//types/types';
import { AnimatedCard, CardBackground, Blob } from './nodeBackground';

const TopologyValidation = forwardRef<HTMLDivElement, TopologyValidationProps>(
    ({ isClicked, onNodeClick, ...props }, ref) => {
        const { language } = useContext(LanguageContext);

        const TopologyValidationContent = () => (
            <div className="p-2 bg-white rounded-md shadow-sm border border-gray-200 w-full">
                <h3 className="text-md ml-1 mb-1 font-bold text-center">
                    {language === 'zh' ? '拓扑验证' : 'Topology Validation'}
                </h3>
            </div>
        );

        if (isClicked) {
            return (
                <AnimatedCard
                    ref={ref}
                    className="cursor-pointer w-[65%]"
                    onClick={onNodeClick}
                >
                    <CardBackground />
                    <Blob />
                    <div className="z-20 relative rounded-md h-full p-1">
                        <TopologyValidationContent />
                    </div>
                </AnimatedCard>
            );
        } else {
            return (
                <div
                    ref={ref}
                    onClick={onNodeClick}
                    className="cursor-pointer w-[62%] shadow-sm rounded-md mb-2"
                >
                    <TopologyValidationContent />
                </div>
            );
        }
    }
);

export default TopologyValidation;
