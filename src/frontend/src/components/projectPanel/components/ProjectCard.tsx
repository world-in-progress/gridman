import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Star,
    FileType2,
    SquarePen,
    FileBox,
    Eye,
    EyeOff,
    FilePlus,
    Blocks,
    Trash2,
    Earth,
    Layers,
} from 'lucide-react';
import { ProjectCardProps } from '../types/types';
import { SchemaService } from '../../schemaPanel/utils/SchemaService';
import { ProjectService } from '../utils/ProjectService';
import { SubprojectCard } from './SubProjecCard';

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
        mapRef?: React.RefObject<any>;
    }
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    title,
    language,
    starredItems,
    descriptionText,
    onStarToggle,
    onEditDescription,
    onSaveDescription,
    onAddSubproject,
    onDeleteProject,
    highlightedSubproject,
    onSubprojectHighlight,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localStarred, setLocalStarred] = useState<boolean | null>(null);
    const [loadingSchema, setLoadingSchema] = useState(false);
    const [schemaError, setSchemaError] = useState<string | null>(null);
    const [showSubprojects, setShowSubprojects] = useState(false);
    const [subprojects, setSubprojects] = useState<any[]>([]);
    const [loadingSubprojects, setLoadingSubprojects] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardId = `project-card-${title.replace(/\s+/g, '-')}`;
    const [schemaEpsg, setSchemaEpsg] = useState<string>('');
    const [schemaGridInfo, setSchemaGridInfo] = useState<any[]>([]);

    useEffect(() => {
        setLocalStarred(starredItems?.[title] || false);
    }, [starredItems, title]);

    useEffect(() => {
        const handleActivePanelChange = () => {
            if (showSubprojects && window.mapRef && window.mapRef.current) {
                const { showSubprojectBounds } = window.mapRef.current;
                if (
                    showSubprojectBounds &&
                    typeof showSubprojectBounds === 'function'
                ) {
                    showSubprojectBounds(title, [], false);
                    setShowSubprojects(false);

                    if (window.mapInstance) {
                        const existingPopups =
                            document.querySelectorAll('.mapboxgl-popup');
                        existingPopups.forEach((popup) => popup.remove());
                    }
                }
            }
        };

        window.addEventListener('activePanelChange', handleActivePanelChange);

        return () => {
            if (showSubprojects && window.mapRef && window.mapRef.current) {
                const { showSubprojectBounds } = window.mapRef.current;
                if (
                    showSubprojectBounds &&
                    typeof showSubprojectBounds === 'function'
                ) {
                    showSubprojectBounds(title, [], false);
                }
            }

            if (window.mapInstance) {
                const existingPopups =
                    document.querySelectorAll('.mapboxgl-popup');
                existingPopups.forEach((popup) => popup.remove());
            }

            window.removeEventListener(
                'activePanelChange',
                handleActivePanelChange
            );
        };
    }, [showSubprojects, title]);

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStarredState = !localStarred;
        setLocalStarred(newStarredState);
        onStarToggle(title, project);
    };

    const handleSubprojectStarClick = async (
        subprojectName: string,
        starred: boolean
    ) => {
        const projectService = new ProjectService(language);
        projectService.updateSubprojectStarred(
            title,
            subprojectName,
            starred,
            (err, _) => {
                if (err) {
                    console.error('更新子项目星标状态失败:', err);
                } else {
                    setSubprojects((prevSubprojects) =>
                        prevSubprojects.map((subproject) =>
                            subproject.name === subprojectName
                                ? { ...subproject, starred }
                                : subproject
                        )
                    );
                }
            }
        );
    };

    const fetchSubprojectsList = useCallback(async () => {
        if (!title) return;

        setLoadingSubprojects(true);
        const projectService = new ProjectService(language);
        projectService.fetchSubprojects(title, (err, result) => {
            if (err) {
                console.error('获取子项目列表失败:', err);
                setSubprojects([]);
            } else {
                setSubprojects(result.subproject_metas);
            }
            setLoadingSubprojects(false);
        });
    }, [title, language]);

    useEffect(() => {
        fetchSubprojectsList();
    }, [fetchSubprojectsList]);

    useEffect(() => {
        if (showSubprojects) {
            fetchSubprojectsList();
        }
    }, [showSubprojects, fetchSubprojectsList]);

    useEffect(() => {
        const schemaService = new SchemaService(language);
        schemaService.getSchemaByName(project.schema_name, (err, result) => {
            if (!err && result?.project_schema?.epsg) {
                setSchemaEpsg(result.project_schema.epsg.toString());
            }
            if (!err && result?.project_schema?.grid_info) {
                setSchemaGridInfo(result.project_schema.grid_info);
            }
        });
    }, [project.schema_name, language]);

    const handleToggleSubprojectsVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !showSubprojects;
        console.log('showSubprojects', showSubprojects);
        console.log('newState', newState);
        setShowSubprojects(newState);


        if (!newState && window.mapInstance) {
            const existingPopups = document.querySelectorAll('.mapboxgl-popup');
            existingPopups.forEach((popup) => popup.remove());
        }

        if (
            newState &&
            window.mapInstance &&
            window.mapRef &&
            window.mapRef.current
        ) {
            const {showSubprojectBounds} = window.mapRef.current;
            showSubprojectBounds(title, subprojects, newState);

            fetchSubprojectsList().then(() => {
                if (window.mapRef && window.mapRef.current) {
                    const { showSubprojectBounds } = window.mapRef.current;
                    console.log('showSubprojectBounds', showSubprojectBounds !== 'function');
                    console.log('subprojects', subprojects);
                    if (
                        showSubprojectBounds &&
                        typeof showSubprojectBounds === 'function'
                    ) {
                        showSubprojectBounds(title, subprojects, true);
                    }
                }
            });
        } else if (
            !newState &&
            window.mapInstance &&
            window.mapRef &&
            window.mapRef.current
        ) {
            const { showSubprojectBounds } = window.mapRef.current;
            if (
                showSubprojectBounds &&
                typeof showSubprojectBounds === 'function'
            ) {
                showSubprojectBounds(title, [], false);
            }
        }
    };

    const handleUpdateDescription = async () => {
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        if (onSaveDescription) {
            const updatedProject = {
                ...project,
                description: newDescription,
            };
            await onSaveDescription(title, updatedProject);
        }

        setIsEditing(false);
    };

    const handleAddSubproject = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onAddSubproject) return;

        try {
            setLoadingSchema(true);
            setSchemaError(
                language === 'zh'
                    ? '正在加载模板信息...'
                    : 'Loading Schema Information...'
            );

            const schemaService = new SchemaService(language);
            schemaService.getSchemaByName(
                project.schema_name,
                (err, result) => {
                    if (err) {
                        console.error('获取模板详情失败:', err);
                        setSchemaError(
                            language === 'zh'
                                ? '获取模板详情失败，使用当前信息继续'
                                : 'Failed to get schema details, continuing with current info'
                        );
                        onAddSubproject(
                            project,
                            project.schema_name,
                            '4326',
                            '1'
                        );

                        setTimeout(() => {
                            setSchemaError(null);
                            setLoadingSchema(false);
                        }, 3000);
                        return;
                    }

                    setSchemaError(null);
                    setLoadingSchema(false);
                    onAddSubproject(
                        project,
                        result.project_schema.name,
                        result.project_schema.epsg.toString(),
                        result.project_schema?.grid_info &&
                            result.project_schema.grid_info.length > 0
                            ? JSON.stringify(result.project_schema.grid_info[0])
                            : '1'
                    );
                }
            );
        } catch (error) {
            console.error('获取模板详情失败:', error);
            setSchemaError(
                language === 'zh'
                    ? '获取模板详情失败，使用当前信息继续'
                    : 'Failed to get schema details, continuing with current info'
            );

            onAddSubproject(project, project.schema_name, '4326', '1');

            setTimeout(() => {
                setSchemaError(null);
                setLoadingSchema(false);
            }, 3000);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const updateSubprojectDescription = async (
        subprojectName: string,
        description: string
    ) => {
        const projectService = new ProjectService(language);
        projectService.updateSubprojectDescription(
            title,
            subprojectName,
            description
        );

        setSubprojects((prevSubprojects) =>
            prevSubprojects.map((subproject) =>
                subproject.name === subprojectName
                    ? { ...subproject, description }
                    : subproject
            )
        );
    };

    const CardContent = () => (
        <>
            {/* Card Title Area */}
            <div className="flex items-center justify-between mb-2 relative">
                <h3 className="text-lg font-bold truncate pr-16">{title}</h3>
                <div className="absolute right-0 top-0 flex items-center">
                    <button
                        className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center mr-1 justify-center cursor-pointer"
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
                        className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center mr-1 cursor-pointer"
                        aria-label={
                            language === 'zh'
                                ? showSubprojects
                                    ? '隐藏子项目'
                                    : '显示子项目'
                                : showSubprojects
                                ? 'Hide Subprojects'
                                : 'Show Subprojects'
                        }
                        title={
                            language === 'zh'
                                ? showSubprojects
                                    ? '隐藏子项目'
                                    : '显示子项目'
                                : showSubprojects
                                ? 'Hide Subprojects'
                                : 'Show Subprojects'
                        }
                        onClick={handleToggleSubprojectsVisibility}
                    >
                        {showSubprojects ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                    <button
                        className={`h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center mr-1 cursor-pointer ${
                            loadingSchema ? 'opacity-50' : ''
                        }`}
                        aria-label={
                            language === 'zh' ? '添加子项目' : 'Add Subproject'
                        }
                        title={
                            language === 'zh' ? '添加子项目' : 'Add Subproject'
                        }
                        onClick={handleAddSubproject}
                        disabled={loadingSchema}
                    >
                        <FilePlus className="h-5 w-5" />
                    </button>
                    <button
                        className={
                            'h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center mr-1 justify-center cursor-pointer'
                        }
                        aria-label={
                            language === 'zh' ? '删除项目' : 'Delete Project'
                        }
                        title={
                            language === 'zh' ? '删除项目' : 'Delete Project'
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject?.(project);
                        }}
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Card Content Area */}
            <div className="text-sm space-y-2">
                {/* Schema Information */}
                <div className="flex items-center text-gray-600 ">
                    <FileBox className="h-4 w-4 mr-2" />
                    <span>
                        {language === 'zh' ? '模板' : 'Schema'}:{' '}
                        {project.schema_name}
                    </span>
                </div>

                <div className="flex items-center text-gray-600 ">
                    <Earth className="h-4 w-4 mr-2" />
                    <span>
                        {language === 'zh' ? 'EPSG' : 'EPSG'}:{' '}
                        {schemaEpsg || '-'}
                    </span>
                </div>
                <div className="flex items-start text-gray-600">
                    <div
                        className={`flex items-center ${
                            language === 'zh' ? 'w-[35%]' : 'w-[40%]'
                        }`}
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        <span>
                            {language === 'zh' ? '网格等级' : 'Grid Levels'}(m):
                        </span>
                    </div>
                    <div className="flex flex-col">
                        {schemaGridInfo && schemaGridInfo.length > 0 ? (
                            schemaGridInfo.map(
                                (level: number[], index: number) => (
                                    <div key={index} className="ml-2 text-sm">
                                        level {index + 1}: [{level.join(', ')}]
                                    </div>
                                )
                            )
                        ) : (
                            <span>-</span>
                        )}
                    </div>
                </div>

                {/* Subproject Information */}
                <div className="flex flex-col text-gray-600 ">
                    <div className="flex items-center">
                        <Blocks className="h-4 w-4 mr-2" />
                        <span>
                            {language === 'zh' ? '子项目' : 'Subprojects'}:{' '}
                            {loadingSubprojects
                                ? language === 'zh'
                                    ? '加载中...'
                                    : 'Loading...'
                                : subprojects.length > 0
                                ? `${subprojects.length} ${
                                      language === 'zh' ? '个' : ''
                                  }`
                                : language === 'zh'
                                ? '无'
                                : 'None'}
                        </span>
                    </div>

                    {showSubprojects && subprojects.length > 0 && (
                        <div className="ml-6 mt-2 space-y-2">
                            {[...subprojects]
                                .sort((a, b) => {
                                    if (a.starred && !b.starred) return -1;
                                    if (!a.starred && b.starred) return 1;
                                    return a.name.localeCompare(b.name);
                                })
                                .map((subproject, index) => (
                                    <SubprojectCard
                                        key={index}
                                        isHighlighted={
                                            highlightedSubproject ===
                                            `${title}:${subproject.name}`
                                        }
                                        subproject={subproject}
                                        parentProjectTitle={title}
                                        language={language}
                                        onCardClick={() => {
                                            if (onSubprojectHighlight) {
                                                onSubprojectHighlight(
                                                    title,
                                                    subproject.name
                                                );
                                            }
                                        }}
                                        onStarToggle={handleSubprojectStarClick}
                                        onSaveSubprojectDescription={
                                            updateSubprojectDescription
                                        }
                                    />
                                ))}
                        </div>
                    )}
                </div>

                {schemaError && (
                    <div className="text-xs text-amber-600  mt-1 py-1 px-2 bg-amber-50  rounded-md">
                        {schemaError}
                    </div>
                )}

                {/* Description Information */}
                <div className="text-gray-600  pt-1 border-t border-gray-200 mb-1">
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
                                className="hover:bg-gray-100 cursor-pointer p-1 rounded"
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
                        <div className="text-sm text-gray-600  mb-2 px-1">
                            {project.description ? (
                                project.description
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
                                className="w-full px-3 py-2 border border-gray-300  rounded-md min-h-[80px]"
                                aria-label={
                                    language === 'zh'
                                        ? '项目描述'
                                        : 'Project description'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '输入项目描述'
                                        : 'Enter project description'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                defaultValue={
                                    (descriptionText &&
                                        descriptionText[title]) ||
                                    project?.description ||
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
        </>
    );

    return (
        <div
            className="bg-white rounded-lg shadow-md p-3 mb-4 border border-gray-200relative transition-all duration-300"
            id={cardId}
        >
            <CardContent />
        </div>
    );
};
