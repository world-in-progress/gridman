import React, { useContext } from 'react';
import { DrawPatchButtonProps } from './types';

const DrawPatchButton: React.FC<DrawPatchButtonProps> = ({
    isDrawing,
    rectangleCoordinates,
    onClick,
}) => {
    const translations = {
        drawing: 'Click to cancel rectangle drawing',
        redraw: 'Delete rectangle and redraw',
        draw: 'Click to draw rectangle',
        instructions: {
            title: 'Drawing method:',
            step1: 'Click on the map to set starting point',
            step2: 'Move the mouse to desired location',
            step3: 'Click again to complete drawing'
        }
    };

    return (
        <>
            <button
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${isDrawing
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : rectangleCoordinates
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                onClick={onClick}
            >
                {isDrawing
                    ? translations.drawing
                    : rectangleCoordinates
                        ? translations.redraw
                        : translations.draw}
            </button>

            {isDrawing && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-800">
                    <p>
                        {translations.instructions.title}
                    </p>
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>
                            {translations.instructions.step1}
                        </li>
                        <li>
                            {translations.instructions.step2}
                        </li>
                        <li>
                            {translations.instructions.step3}
                        </li>
                    </ol>
                </div>
            )}
        </>
    );
};

export default DrawPatchButton;
