import React, { useState, useRef, useEffect } from 'react';
import {
    MoreHorizontal,
    Star,
    Earth,
    MapPin,
    Layers,
    SquarePen,
    FileType2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedCard, CardBackground, Blob } from './styledComponents';
import { SchemaService } from '../utils/SchemaService';
import { SchemaCardProps } from '../types/types';

export const SchemaCard: React.FC<SchemaCardProps> = ({
    schema,
    title,
    isHighlighted,
    language,
    starredItems,
    openMenuId,
    menuItems,
    onCardClick,
    onStarToggle,
    onMenuOpenChange,
    onEditDescription,
    onSaveDescription,
    descriptionText,
    onShowDetails,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localStarred, setLocalStarred] = useState<boolean | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardId = `schema-card-${title.replace(/\s+/g, '-')}`;

    useEffect(() => {
        setLocalStarred(starredItems?.[title] || false);
    }, [starredItems, title]);

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStarredState = !localStarred;
        setLocalStarred(newStarredState);
        onStarToggle(title, schema);
    };

    const handleUpdateDescription = async () => {
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        if (onSaveDescription) {
            const updatedSchema = {
                ...schema,
                description: newDescription,
            };
            await onSaveDescription(title, updatedSchema);
        } else {
            const schemaService = new SchemaService(language);
            schemaService.updateSchemaDescription(title, newDescription);
            schemaService.fetchAllSchemas();
        }

        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const CardContent = () => (
        <>
            {/* Card Title Area */}
            <div className="flex items-center justify-between mb-2 relative">
                <h3 className="text-lg font-bold truncate pr-16">{title}</h3>
                <div className="absolute right-0 top-0 flex items-center">
                    <button
                        className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center mr-1 cursor-pointer"
                        aria-label={language === 'zh' ? '标星' : 'Star'}
                        title={language === 'zh' ? '标星' : 'Star'}
                        onClick={handleStarClick}
                    >
                        <Star
                            className={`h-5 w-5 ${
                                localStarred
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : ''
                            }`}
                        />
                    </button>
                    <button
                        className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center mr-1 cursor-pointer"
                        aria-label={
                            language === 'zh' ? '显示详情' : 'Show Details'
                        }
                        title={language === 'zh' ? '显示详情' : 'Show Details'}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onShowDetails) {
                                onShowDetails(schema);
                            }
                        }}
                    >
                        <MapPin className="h-5 w-5" />
                    </button>
                    <DropdownMenu
                        open={openMenuId === title}
                        onOpenChange={(open) => {
                            onMenuOpenChange(open);
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                aria-label={
                                    language === 'zh'
                                        ? '更多选项'
                                        : 'More options'
                                }
                                title={
                                    language === 'zh'
                                        ? '更多选项'
                                        : 'More options'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="right"
                            align="start"
                            alignOffset={40}
                            className="w-38"
                            sideOffset={-20}
                        >
                            {menuItems.map((subItem) => (
                                <DropdownMenuItem key={subItem.title} asChild>
                                    <a
                                        className={`cursor-pointer flex items-center ${
                                            subItem.title ===
                                                (language === 'zh'
                                                    ? '删除模板'
                                                    : 'Delete Schema') ||
                                            (subItem.title.includes('Delete') &&
                                                language !== 'zh')
                                                ? 'bg-red-500 text-white hover:bg-red-600 group'
                                                : ''
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMenuOpenChange(false);
                                            subItem.onClick &&
                                                subItem.onClick(e);
                                        }}
                                    >
                                        <span className="flex items-center">
                                            {subItem.icon}
                                            {subItem.title}
                                        </span>
                                    </a>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Card Content Area */}
            <div className="text-sm space-y-2">
                {/* EPSG Information */}
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Earth className="h-4 w-4 mr-2" />
                    <span>EPSG: {schema?.epsg}</span>
                </div>

                {/* Base Point Information */}
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                        {language === 'zh' ? '基准点' : 'Base Point'}:
                        {schema?.base_point
                            ? ` [${schema.base_point[0].toFixed(
                                  2
                              )}, ${schema.base_point[1].toFixed(2)}]`
                            : ' -'}
                    </span>
                </div>

                {/* Grid Level Information */}
                <div className="flex flex-row items-start text-gray-600 dark:text-gray-300">
                    <div
                        className={`flex ${
                            language === 'zh' ? 'w-[35%]' : 'w-[40%]'
                        }`}
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        <span>
                            {language === 'zh' ? '网格层级' : 'Grid Levels'}(m):
                        </span>
                    </div>
                    <div className="flex-1">
                        {schema?.grid_info
                            ? schema.grid_info.map(
                                  (levelArray: number[], index: number) => (
                                      <div key={index} className="ml-2">
                                          {`${
                                              language === 'zh'
                                                  ? '等级'
                                                  : 'Level'
                                          } ${index + 1}: [${levelArray.join(
                                              ', '
                                          )}]`}
                                      </div>
                                  )
                              )
                            : ' -'}
                    </div>
                </div>

                {/* Description Information */}
                <div className="text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-gray-700 mb-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                            <FileType2 className="h-4 w-4 mr-2" />
                            <h3 className="text-sm font-bold">
                                {language === 'zh' ? '描述' : 'Description'}
                            </h3>
                        </div>
                        {onEditDescription && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(!isEditing);
                                    onEditDescription(title);
                                }}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded cursor-pointer"
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
                    {/* Display description text when not in editing mode */}
                    {!isEditing && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 px-1">
                            {schema.description ? (
                                schema.description
                            ) : (
                                <span className="italic">
                                    {language === 'zh'
                                        ? '无描述'
                                        : 'No description provided.'}
                                </span>
                            )}
                        </div>
                    )}
                    {/* Display text input when in editing mode */}
                    {isEditing && (
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                id="schema-description"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[80px]"
                                aria-label={
                                    language === 'zh'
                                        ? '模板描述'
                                        : 'Schema description'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '输入模板描述'
                                        : 'Enter schema description'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                defaultValue={
                                    (descriptionText &&
                                        descriptionText[title]) ||
                                    schema?.description ||
                                    ''
                                }
                            />
                            <div className="absolute bottom-3 right-5 flex space-x-2">
                                <button
                                    className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
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
        </>
    );

    if (isHighlighted) {
        return (
            <AnimatedCard className="p-3 mb-4" id={cardId}>
                <CardBackground />
                <Blob />
                <div className="relative z-10">
                    <CardContent />
                </div>
            </AnimatedCard>
        );
    } else {
        return (
            <>
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4 border border-gray-200 dark:border-gray-700 relative transition-all duration-300 cursor-pointer"
                    onClick={onCardClick}
                    id={cardId}
                >
                    <CardContent />
                </div>
            </>
        );
    }
};
