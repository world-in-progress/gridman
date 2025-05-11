import React, { useState, useRef } from 'react';
import { Star, FileType2, SquarePen, PencilRuler } from 'lucide-react';
import { SubProjectCardProps } from '../types/types';
import { ProjectService } from '../utils/ProjectService';

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
        mapRef?: React.RefObject<any>;
    }
}

export const SubProjectCard: React.FC<SubProjectCardProps> = ({
    subproject,
    parentProjectTitle,
    language,
    subprojectDescriptionText,
    onCardClick,
    onStarToggle,
    onEditSubprojectDescription,
    onSaveSubprojectDescription,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        onCardClick();
        e.stopPropagation();
        if (window.mapInstance && window.mapRef && window.mapRef.current) {
            const { flyToSubprojectBounds } = window.mapRef.current;
            if (
                flyToSubprojectBounds &&
                typeof flyToSubprojectBounds === 'function'
            ) {
                flyToSubprojectBounds(
                    parentProjectTitle,
                    subproject.name
                ).catch((error: any) => {
                    console.error(
                        language === 'zh'
                            ? '飞行到子项目边界失败:'
                            : 'Failed to fly to subproject bounds:',
                        error
                    );
                });
            }
        }
    };

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStarToggle) {
            onStarToggle(subproject.name, !subproject.starred);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.mapRef && window.mapRef.current) {
            const pageEvents = new CustomEvent('switchToTopologyPanel', {
                detail: {
                    projectName: parentProjectTitle,
                    subprojectName: subproject.name
                }
            });
            window.dispatchEvent(pageEvents);
        }

        const projectService = new ProjectService(language);
        const flag = {isReady: true};
        projectService.setSubproject(parentProjectTitle, subproject.name, flag);


    };

    const handleUpdateDescription = async () => {
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        try {
            if (onSaveSubprojectDescription) {
                await onSaveSubprojectDescription(
                    subproject.name,
                    newDescription
                );
            }

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update subproject description:', error);
        }
    };

    return (
        <div
            className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex items-center justify-between">
                <div className="font-bold text-black text-md">
                    {subproject.name}
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button
                        className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                        aria-label={language === 'zh' ? '编辑' : 'Edit'}
                        title={language === 'zh' ? '编辑' : 'Edit'}
                        onClick={handleEditClick}
                    >
                        <PencilRuler
                            className={`h-4 w-4 cursor-pointer`}
                        />
                    </button>
                    <button
                        className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                        aria-label={language === 'zh' ? '标星' : 'Star'}
                        title={language === 'zh' ? '标星' : 'Star'}
                        onClick={handleStarClick}
                    >
                        <Star
                            className={`h-4 w-4 ${
                                subproject.starred
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : ''
                            } cursor-pointer`}
                        />
                    </button>
                </div>
            </div>

            {subproject.bounds && subproject.bounds.length === 4 && (
                <div className="mt-1 border-gray-200 pt-1">
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                        {/* Top Left Corner */}
                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-300 rounded-tl"></div>
                        </div>
                        {/* North/Top */}
                        <div className="text-center">
                            <span className="font-bold text-blue-600 text-sm">
                                N
                            </span>
                            <div className="text-[9px]">
                                [{subproject.bounds[3].toFixed(6)}]
                            </div>
                        </div>
                        {/* Top Right Corner */}
                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-300 rounded-tr"></div>
                        </div>
                        {/* West/Left */}
                        <div className="text-center">
                            <span className="font-bold text-green-600 text-sm">
                                W
                            </span>
                            <div className="text-[9px]">
                                [{subproject.bounds[0].toFixed(6)}]
                            </div>
                        </div>
                        {/* Center */}
                        <div className="text-center">
                            <span className="font-bold text-xs">
                                {language === 'zh' ? '中心' : 'Center'}
                            </span>
                            <div className="text-[9px]">
                                [
                                {(
                                    (subproject.bounds[0] +
                                        subproject.bounds[2]) /
                                    2
                                ).toFixed(6)}
                                ,
                                {(
                                    (subproject.bounds[1] +
                                        subproject.bounds[3]) /
                                    2
                                ).toFixed(6)}
                                ]
                            </div>
                        </div>
                        {/* East/Right */}
                        <div className="text-center">
                            <span className="font-bold text-red-600 text-sm">
                                E
                            </span>
                            <div className="text-[9px]">
                                [{subproject.bounds[2].toFixed(6)}]
                            </div>
                        </div>
                        {/* Bottom Left Corner */}
                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-300 rounded-bl"></div>
                        </div>
                        {/* South/Bottom */}
                        <div className="text-center">
                            <span className="font-bold text-purple-600 text-sm">
                                S
                            </span>
                            <div className="text-[9px]">
                                [{subproject.bounds[1].toFixed(6)}]
                            </div>
                        </div>
                        {/* Bottom Right Corner */}
                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-300 rounded-br"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* {subproject.description && (
                <div className="text-xs text-gray-500 border-t pt-1 mt-2 truncate">
                    {subproject.description}
                </div>
            )} */}

            {subproject.description && (
                <div className="text-gray-600 mt-2 border-t border-gray-200 mb-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                            <FileType2 className="h-4 w-4 mr-1" />
                            <h3 className="text-xs font-bold">
                                {language === 'zh' ? '描述' : 'Description'}
                            </h3>
                        </div>
                        {onEditSubprojectDescription && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(!isEditing);
                                    onEditSubprojectDescription(
                                        subproject.name
                                    );
                                }}
                                className="hover:bg-gray-200 cursor-pointer p-1 rounded"
                                aria-label={
                                    language === 'zh'
                                        ? '编辑描述'
                                        : 'Edit description'
                                }
                                title={
                                    language === 'zh'
                                        ? '编辑描述'
                                        : 'Edit description'
                                }
                            >
                                <SquarePen className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {!isEditing && subproject.description && (
                        <div className="text-xs text-gray-600  mb-2 px-1">
                            {subproject.description}
                        </div>
                    )}

                    {isEditing && (
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                id="schema-description"
                                className="w-full px-3 py-2 border border-gray-300  rounded-md min-h-[80px]"
                                aria-label={
                                    language === 'zh'
                                        ? '子项目描述'
                                        : 'Subproject description'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '输入子项目描述'
                                        : 'Enter subproject description'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                defaultValue={
                                    (subprojectDescriptionText &&
                                        subprojectDescriptionText[
                                            subproject.name
                                        ]) ||
                                    subproject?.description ||
                                    ''
                                }
                            />
                            <div className="absolute bottom-3 right-5 flex space-x-2">
                                <button
                                    className="px-2 py-0.5 text-xs bg-gray-200  rounded-md hover:bg-gray-300 "
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancel();
                                    }}
                                >
                                    {language === 'zh' ? '取消' : 'Cancel'}
                                </button>
                                <button
                                    className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateDescription();
                                    }}
                                >
                                    {language === 'zh' ? '完成' : 'Done'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SubProjectCard;
