import React, { useState, useRef, useEffect } from 'react';
import {
    Star,
    FileType2,
    SquarePen,
    PencilRuler,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { SubProjectCardProps } from '../types/types';
import { ProjectService } from '../utils/ProjectService';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AnimatedCard, CardBackground, Blob } from './cardBackground';
import store from '@/store';
import GridLayer from '@/components/mapComponent/layers/GridLayer';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
        mapRef?: React.RefObject<any>;
    }
}

export const SubprojectCard: React.FC<SubProjectCardProps> = ({
    isHighlighted,
    subproject,
    parentProjectTitle,
    language,
    subprojectDescriptionText,
    onCardClick,
    onStarToggle,
    onSaveSubprojectDescription,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const showLoadingRef = useRef<Function | null>(null);
    const cardId = `subproject-card-${subproject.name.replace(/\s+/g, '-')}`;

    // useEffect(() => {
    //     // 从文档中获取或创建loading元素
    //     const loadingDom = document.getElementById('loading-container') || (() => {
    //         const dom = document.createElement('div');
    //         dom.id = 'loading-container';
    //         dom.innerHTML = `
    //             <div class="loading"></div>
    //             <div class="loading-text">Loading ...</div>
    //         `;
    //         dom.style.display = 'none';
    //         document.body.appendChild(dom);
    //         return dom;
    //     })();

    //     // 设置控制函数
    //     showLoadingRef.current = (show: boolean) => {
    //         loadingDom.style.display = show ? 'block' : 'none';
    //     };

    //     return () => {
    //         // 组件卸载时确保loading隐藏
    //         if (showLoadingRef.current) {
    //             showLoadingRef.current(false);
    //         }
    //     };
    // }, []);

    // useEffect(() => {
    //     // 当isLoading状态变化时，控制loading的显示/隐藏
    //     if (showLoadingRef.current) {
    //         showLoadingRef.current(isLoading);
    //     }
    // }, [isLoading]);

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
            if (window.mapRef && window.mapRef.current) {
                const { showSubprojectBounds } = window.mapRef.current;
                if (
                    showSubprojectBounds &&
                    typeof showSubprojectBounds === 'function'
                ) {
                    const updatedSubproject = {
                        ...subproject,
                        starred: !subproject.starred,
                    };
                    showSubprojectBounds(
                        parentProjectTitle,
                        [updatedSubproject],
                        true
                    );
                }
            }
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.mapRef && window.mapRef.current) {
            const pageEvents = new CustomEvent('switchToTopologyPanel', {
                detail: {
                    projectName: parentProjectTitle,
                    subprojectName: subproject.name,
                },
            });
            window.dispatchEvent(pageEvents);
        }

        const projectService = new ProjectService(language);
        setIsLoading(true);
        projectService.setSubproject(
            parentProjectTitle,
            subproject.name,
            (error, result) => {
                if (error || !result) {
                    setIsLoading(false);
                    return;
                }

                const map = store.get<mapboxgl.Map>('map');

                // Update recorder of GridLayer
                const clg = store.get<NHLayerGroup>('clg')!;
                const gridLayer = clg.getLayerInstance(
                    'GridLayer'
                ) as GridLayer;
                gridLayer.updateGPUGrids([
                    result.fromStorageId,
                    result.levels,
                    result.vertices,
                ]);
                setIsLoading(false);
            }
        );
    };

    const handleUpdateDescription = async () => {
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        if (onSaveSubprojectDescription) {
            await onSaveSubprojectDescription(subproject.name, newDescription);
        }

        setIsEditing(false);
    };

    // return (
    //     <div
    //         className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
    //         onClick={handleCardClick}
    //     >
    //         <div className="flex items-center justify-between">
    //             <div className="font-bold text-black text-md">
    //                 {subproject.name}
    //             </div>
    //             <div className="flex items-center justify-end gap-2">
    //                 <button
    //                     className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
    //                     aria-label={language === 'zh' ? '编辑' : 'Edit'}
    //                     title={language === 'zh' ? '编辑' : 'Edit'}
    //                     onClick={handleEditClick}
    //                 >
    //                     <PencilRuler className={`h-4 w-4 cursor-pointer`} />
    //                 </button>
    //                 <button
    //                     className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
    //                     aria-label={language === 'zh' ? '标星' : 'Star'}
    //                     title={language === 'zh' ? '标星' : 'Star'}
    //                     onClick={handleStarClick}
    //                 >
    //                     <Star
    //                         className={`h-4 w-4 ${
    //                             subproject.starred
    //                                 ? 'fill-yellow-400 text-yellow-400'
    //                                 : ''
    //                         } cursor-pointer`}
    //                     />
    //                 </button>
    //             </div>
    //         </div>

    //         {subproject.bounds && subproject.bounds.length === 4 && (
    //             <div className="mt-1 border-gray-200 pt-1">
    //                 <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
    //                     {/* Top Left Corner */}
    //                     <div className="relative h-8 flex items-center justify-center">
    //                         <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-300 rounded-tl"></div>
    //                     </div>
    //                     {/* North/Top */}
    //                     <div className="text-center">
    //                         <TooltipProvider>
    //                             <Tooltip>
    //                                 <TooltipTrigger asChild>
    //                                     <div className="flex flex-col items-center">
    //                                         <ArrowUp className="h-4 w-4 text-blue-600" />
    //                                         <span className="font-bold text-blue-600 text-sm mb-1">
    //                                             N
    //                                         </span>
    //                                     </div>
    //                                 </TooltipTrigger>
    //                                 <TooltipContent>
    //                                     <div className="text-[9px]">
    //                                         <p className="font-bold mb-1">
    //                                             {language === 'zh'
    //                                                 ? '北'
    //                                                 : 'North'}
    //                                         </p>
    //                                         <p>
    //                                             {subproject.bounds[3].toFixed(
    //                                                 6
    //                                             )}
    //                                         </p>
    //                                     </div>
    //                                 </TooltipContent>
    //                             </Tooltip>
    //                         </TooltipProvider>
    //                     </div>
    //                     {/* Top Right Corner */}
    //                     <div className="relative h-8 flex items-center justify-center">
    //                         <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-300 rounded-tr"></div>
    //                     </div>
    //                     {/* West/Left */}
    //                     <div className="text-center">
    //                         <TooltipProvider>
    //                             <Tooltip>
    //                                 <TooltipTrigger asChild>
    //                                     <div className="flex flex-row items-center justify-center gap-1">
    //                                         <ArrowLeft className="h-4 w-4 text-green-600" />
    //                                         <span className="font-bold text-green-600 text-sm mr-1 mt-1">
    //                                             W
    //                                         </span>
    //                                     </div>
    //                                 </TooltipTrigger>
    //                                 <TooltipContent>
    //                                     <div className="text-[9px]">
    //                                         <p className="font-bold mb-1">
    //                                             {language === 'zh'
    //                                                 ? '西'
    //                                                 : 'West'}
    //                                         </p>
    //                                         <p>
    //                                             {subproject.bounds[0].toFixed(
    //                                                 6
    //                                             )}
    //                                         </p>
    //                                     </div>
    //                                 </TooltipContent>
    //                             </Tooltip>
    //                         </TooltipProvider>
    //                     </div>
    //                     {/* Center */}
    //                     <div className="text-center">
    //                         <span className="font-bold text-xs">
    //                             {language === 'zh' ? '中心' : 'Center'}
    //                         </span>
    //                         <div className="text-[9px]">
    //                             <div>
    //                                 {(
    //                                     (subproject.bounds[0] +
    //                                         subproject.bounds[2]) /
    //                                     2
    //                                 ).toFixed(6)}
    //                             </div>
    //                             <div>
    //                                 {(
    //                                     (subproject.bounds[1] +
    //                                         subproject.bounds[3]) /
    //                                     2
    //                                 ).toFixed(6)}
    //                             </div>
    //                         </div>
    //                     </div>
    //                     {/* East/Right */}
    //                     <div className="text-center">
    //                         <TooltipProvider>
    //                             <Tooltip>
    //                                 <TooltipTrigger asChild>
    //                                     <div className="flex flex-row items-center justify-center gap-1">
    //                                         <span className="font-bold text-red-600 text-sm mt-1 ml-4">
    //                                             E
    //                                         </span>
    //                                         <ArrowRight className="h-4 w-4 text-red-600" />
    //                                     </div>
    //                                 </TooltipTrigger>
    //                                 <TooltipContent>
    //                                     <div className="text-[9px]">
    //                                         <p className="font-bold mb-1">
    //                                             {language === 'zh'
    //                                                 ? '东'
    //                                                 : 'East'}
    //                                         </p>
    //                                         <p>
    //                                             {subproject.bounds[2].toFixed(
    //                                                 6
    //                                             )}
    //                                         </p>
    //                                     </div>
    //                                 </TooltipContent>
    //                             </Tooltip>
    //                         </TooltipProvider>
    //                     </div>
    //                     {/* Bottom Left Corner */}
    //                     <div className="relative h-8 flex items-center justify-center">
    //                         <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-300 rounded-bl"></div>
    //                     </div>
    //                     {/* South/Bottom */}
    //                     <div className="text-center">
    //                         <TooltipProvider>
    //                             <Tooltip>
    //                                 <TooltipTrigger asChild>
    //                                     <div className="flex flex-col items-center">
    //                                         <span className="font-bold text-purple-600 text-sm mt-1">
    //                                             S
    //                                         </span>
    //                                         <ArrowDown className="h-4 w-4 text-purple-600" />
    //                                     </div>
    //                                 </TooltipTrigger>
    //                                 <TooltipContent>
    //                                     <div className="text-[9px]">
    //                                         <p className="font-bold mb-1">
    //                                             {language === 'zh'
    //                                                 ? '南'
    //                                                 : 'South'}
    //                                         </p>
    //                                         <p>
    //                                             {subproject.bounds[1].toFixed(
    //                                                 6
    //                                             )}
    //                                         </p>
    //                                     </div>
    //                                 </TooltipContent>
    //                             </Tooltip>
    //                         </TooltipProvider>
    //                     </div>
    //                     {/* Bottom Right Corner */}
    //                     <div className="relative h-8 flex items-center justify-center">
    //                         <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-300 rounded-br"></div>
    //                     </div>
    //                 </div>
    //             </div>
    //         )}

    //         <div className="text-gray-600 mt-2 border-t border-gray-200 mb-1">
    //             <div className="flex items-center justify-between mb-1">
    //                 <div className="flex items-center">
    //                     <FileType2 className="h-4 w-4 mr-1" />
    //                     <h3 className="text-xs font-bold">
    //                         {language === 'zh' ? '描述' : 'Description'}
    //                     </h3>
    //                 </div>

    //                 <button
    //                     onClick={(e) => {
    //                         e.stopPropagation();
    //                         setIsEditing(!isEditing);
    //                     }}
    //                     className="hover:bg-gray-200 cursor-pointer p-1 rounded"
    //                     aria-label={
    //                         language === 'zh' ? '编辑描述' : 'Edit description'
    //                     }
    //                     title={
    //                         language === 'zh' ? '编辑描述' : 'Edit description'
    //                     }
    //                 >
    //                     <SquarePen className="h-4 w-4" />
    //                 </button>
    //             </div>

    //             {!isEditing && (
    //                 <div className="text-xs text-gray-600 mb-2 px-1">
    //                     {subproject.description ? (
    //                         subproject.description
    //                     ) : (
    //                         <span className="italic">No description provided.</span>
    //                     )}
    //                 </div>
    //             )}

    //             {isEditing && (
    //                 <div className="relative">
    //                     <textarea
    //                         ref={textareaRef}
    //                         id="schema-description"
    //                         className="w-full px-3 py-2 border border-gray-300  rounded-md min-h-[80px]"
    //                         aria-label={
    //                             language === 'zh'
    //                                 ? '子项目描述'
    //                                 : 'Subproject description'
    //                         }
    //                         placeholder={
    //                             language === 'zh'
    //                                 ? '输入子项目描述'
    //                                 : 'Enter subproject description'
    //                         }
    //                         onClick={(e) => {
    //                             e.stopPropagation();
    //                         }}
    //                         defaultValue={
    //                             (subprojectDescriptionText &&
    //                                 subprojectDescriptionText[
    //                                     subproject.name
    //                                 ]) ||
    //                             subproject?.description ||
    //                             ''
    //                         }
    //                     />
    //                     <div className="absolute bottom-3 right-5 flex space-x-2">
    //                         <button
    //                             className="px-2 py-0.5 text-xs bg-gray-200  rounded-md hover:bg-gray-300 cursor-pointer"
    //                             onClick={(e) => {
    //                                 e.stopPropagation();
    //                                 handleCancel();
    //                             }}
    //                         >
    //                             {language === 'zh' ? '取消' : 'Cancel'}
    //                         </button>
    //                         <button
    //                             className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
    //                             onClick={(e) => {
    //                                 e.stopPropagation();
    //                                 handleUpdateDescription();
    //                             }}
    //                         >
    //                             {language === 'zh' ? '完成' : 'Done'}
    //                         </button>
    //                     </div>
    //                 </div>
    //             )}
    //         </div>
    //     </div>
    // );

    const SubprojectCardContent = () => (
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
                        <PencilRuler className={`h-4 w-4 cursor-pointer`} />
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
                                        <div className="text-[9px]">
                                            <p className="font-bold mb-1">
                                                {language === 'zh'
                                                    ? '北'
                                                    : 'North'}
                                            </p>
                                            <p>
                                                {subproject.bounds[3].toFixed(
                                                    6
                                                )}
                                            </p>
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
                                        <div className="flex flex-row items-center justify-center gap-1">
                                            <ArrowLeft className="h-4 w-4 text-green-600" />
                                            <span className="font-bold text-green-600 text-sm mr-1 mt-1">
                                                W
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-[9px]">
                                            <p className="font-bold mb-1">
                                                {language === 'zh'
                                                    ? '西'
                                                    : 'West'}
                                            </p>
                                            <p>
                                                {subproject.bounds[0].toFixed(
                                                    6
                                                )}
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        {/* Center */}
                        <div className="text-center">
                            <span className="font-bold text-xs">
                                {language === 'zh' ? '中心' : 'Center'}
                            </span>
                            <div className="text-[9px]">
                                <div>
                                    {(
                                        (subproject.bounds[0] +
                                            subproject.bounds[2]) /
                                        2
                                    ).toFixed(6)}
                                </div>
                                <div>
                                    {(
                                        (subproject.bounds[1] +
                                            subproject.bounds[3]) /
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
                                        <div className="flex flex-row items-center justify-center gap-1">
                                            <span className="font-bold text-red-600 text-sm mt-1 ml-4">
                                                E
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-red-600" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-[9px]">
                                            <p className="font-bold mb-1">
                                                {language === 'zh'
                                                    ? '东'
                                                    : 'East'}
                                            </p>
                                            <p>
                                                {subproject.bounds[2].toFixed(
                                                    6
                                                )}
                                            </p>
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
                                        <div className="text-[9px]">
                                            <p className="font-bold mb-1">
                                                {language === 'zh'
                                                    ? '南'
                                                    : 'South'}
                                            </p>
                                            <p>
                                                {subproject.bounds[1].toFixed(
                                                    6
                                                )}
                                            </p>
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
                </div>
            )}

            <div className="text-gray-600 mt-2 border-t border-gray-200 mb-1">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                        <FileType2 className="h-4 w-4 mr-1" />
                        <h3 className="text-xs font-bold">
                            {language === 'zh' ? '描述' : 'Description'}
                        </h3>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                        }}
                        className="hover:bg-gray-200 cursor-pointer p-1 rounded"
                        aria-label={
                            language === 'zh' ? '编辑描述' : 'Edit description'
                        }
                        title={
                            language === 'zh' ? '编辑描述' : 'Edit description'
                        }
                    >
                        <SquarePen className="h-4 w-4" />
                    </button>
                </div>

                {!isEditing && (
                    <div className="text-xs text-gray-600 mb-2 px-1">
                        {subproject.description ? (
                            subproject.description
                        ) : (
                            <span className="italic">
                                No description provided.
                            </span>
                        )}
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
                                className="px-2 py-0.5 text-xs bg-gray-200  rounded-md hover:bg-gray-300 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel();
                                }}
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
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
        </div>
    );

    if (isHighlighted) {
        return (
            <AnimatedCard className="p-3 mb-4" id={cardId}>
                <CardBackground />
                <Blob />
                <div className="relative z-10">
                    <SubprojectCardContent />
                </div>
            </AnimatedCard>
        );
    } else {
        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4 border border-gray-200 dark:border-gray-700 relative transition-all duration-300 cursor-pointer"
                onClick={onCardClick}
                id={cardId}
            >
                <SubprojectCardContent />
            </div>
        );
    }
};

export default SubprojectCard;
