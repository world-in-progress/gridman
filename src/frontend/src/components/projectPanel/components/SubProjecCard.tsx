import React, { useState, useRef, useEffect } from 'react';
import {
    Star,
    FileType2,
    SquarePen,
    PencilRuler,
    Ellipsis,
    Grid,
    Mountain,
    Waypoints,
} from 'lucide-react';
import { SubProjectCardProps } from '../types/types';
import { ProjectService } from '../utils/ProjectService';
import { AnimatedCard, CardBackground, Blob } from './cardBackground';
import store from '@/store';
import TopologyLayer from '@/components/mapComponent/layers/TopologyLayer';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
import BoundsCard from './boundsCard';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SchemaService } from '../../schemaPanel/utils/SchemaService';

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
    const [open, setOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardId = `subproject-card-${subproject.name.replace(/\s+/g, '-')}`;

    const isLoading = store.get<{ on: Function; off: Function }>('isLoading')!;
    const updateCapacity = store.get<{ on: Function; off: Function }>('updateCapacity')!;
    const projectService = new ProjectService(language);
    const schemaService = new SchemaService(language);

    const menuItems = [
        {
            title: language === 'zh' ? '网格编辑' : 'Edit Grid',
            icon: <Grid className="h-4 w-4 mr-2" />,
            onClick: (e: React.MouseEvent) => {
                console.log('Grid clicked');
            },
        },
        {
            title: language === 'zh' ? '地形编辑' : 'Edit Terrain',
            icon: <Mountain className="h-4 w-4 mr-2" />,
            onClick: (e: React.MouseEvent) => {
                console.log('Terrain clicked');
            },
        },
        {
            title: language === 'zh' ? '管道编辑' : 'Edit Pipeline',
            icon: <Waypoints className="h-4 w-4 mr-2" />,
            onClick: (e: React.MouseEvent) => {
                console.log('Pipeline clicked');
            },
        },
    ];

    const onMenuOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

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
                flyToSubprojectBounds(parentProjectTitle, subproject.name);
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
        isLoading.on();
        updateCapacity.on();

        store.set('ProjectName', parentProjectTitle);
        store.set('SubprojectName', subproject.name);

        projectService.getProjectByName(parentProjectTitle, (err, result) => {
            store.set('SchemaName', result.project_meta.schema_name);
            if (store.get('SchemaName')) {
                const schemaName = store.get('SchemaName') as string;
                schemaService.getSchemaByName(
                    schemaName,
                    (err, result) => {
                        store.set('SchemaGridInfo', result.project_schema.grid_info);
                    }
                );
            }
        });

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

        projectService.setSubproject(
            parentProjectTitle,
            subproject.name,
            () => {
                if (window.mapRef && window.mapRef.current) {
                    const pageEvents = new CustomEvent('switchToEditorPanel', {
                        detail: {
                            projectName: parentProjectTitle,
                            subprojectName: subproject.name,
                        },
                    });
                    window.dispatchEvent(pageEvents);
                }
                isLoading.off();
                updateCapacity.on();
            }
        );
    };

    const handleUpdateDescription = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        if (onSaveSubprojectDescription) {
            await onSaveSubprojectDescription(subproject.name, newDescription);
            if (window.mapRef && window.mapRef.current) {
                const { showSubprojectBounds } = window.mapRef.current;
                if ( showSubprojectBounds && typeof showSubprojectBounds === 'function') {
                    const updatedSubproject = {
                        ...subproject,
                        description: newDescription,
                    }
                    showSubprojectBounds(parentProjectTitle, [updatedSubproject], true);
                }
            }
        }

        setIsEditing(false);
    };

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
                    <DropdownMenu open={open} onOpenChange={onMenuOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                                aria-label={language === 'zh' ? '更多' : 'More'}
                                title={language === 'zh' ? '更多' : 'More'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <Ellipsis className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="right"
                            align="start"
                            alignOffset={40}
                            className="w-40"
                            sideOffset={-20}
                        >
                            {menuItems.map((subItem) => (
                                <DropdownMenuItem key={subItem.title} asChild>
                                    <a
                                        className="cursor-pointer flex items-center"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMenuOpenChange(false);
                                            subItem.onClick &&
                                                subItem.onClick(e);
                                        }}
                                    >
                                        {subItem.icon}
                                        {subItem.title}
                                    </a>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {subproject.bounds && subproject.bounds.length === 4 && (
                <div className=" border-gray-200">
                    <BoundsCard
                        bounds={subproject.bounds}
                        language={language}
                    />
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
                                {language === 'zh' ? '无描述' : 'No description provided.'}
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
                                    handleUpdateDescription(e);
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-2 border border-gray-200 dark:border-gray-700 relative transition-all duration-300 cursor-pointer"
                onClick={onCardClick}
                id={cardId}
            >
                <SubprojectCardContent />
            </div>
        );
    }
};

export default SubprojectCard;
