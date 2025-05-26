import React, { useContext, forwardRef } from 'react';
import { LanguageContext } from '../../../context';
import { TerrainDataNodeProps } from '..//types/types';
import { AnimatedCard, CardBackground, Blob } from './nodeBackground'; // Import animated components

const TerrainDataNode = forwardRef<HTMLDivElement, TerrainDataNodeProps>(
    ({ isClicked, onNodeClick, ...props }, ref) => {
        const { language } = useContext(LanguageContext);

        const TerrainDataNodeContent = () => (
            <div
                // className: w-full ensures it takes the width of its parent (either the AnimatedCard's content div or the normal state div)
                // p-2 for padding, bg-white for background, rounded-md for rounded corners, shadow-sm and border for styling.
                className="w-full p-2 bg-white rounded-md border border-gray-200"
            >
                <h3 className="text-md ml-1 mb-1 font-bold text-center">
                    {language === 'zh' ? '地形数据' : 'Terrain Data'}
                </h3>
            </div>
        );

        if (isClicked) {
            return (
                <AnimatedCard
                    ref={ref}
                    className="cursor-pointer w-[43%]"
                    onClick={onNodeClick}
                >
                    <CardBackground />
                    <Blob />
                    <div className="relative z-20 rounded-md h-full p-1">
                        <TerrainDataNodeContent />
                    </div>
                </AnimatedCard>
            );
        } else {
            return (
                <div
                    ref={ref}
                    onClick={onNodeClick}
                    className="w-5/12 cursor-pointer shadow-sm rounded-md mb-2"
                >
                    <TerrainDataNodeContent />
                </div>
            );
        }
    }
);

export default TerrainDataNode;
