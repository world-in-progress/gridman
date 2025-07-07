import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '../../../context';
import proj4 from 'proj4';
import { epsgDefinitions } from '../../../core/util/coordinateUtils';
import { SidebarGroup } from '@/components/ui/sidebar';
import { Schema, SubNavItem, SubNavPanelProps } from '../types/types';
import { SchemaCard } from './SchemaCard';
import { SchemaService } from '../utils/SchemaService';
import { MapMarkerManager } from '../utils/MapMarkerManager';
import { CreateFromDialog } from './CreateFromDialog';
import { Copy, FolderPlus, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import store from '@/store';
import Loader from '@/components/ui/loader';

Object.keys(epsgDefinitions).forEach((epsg) => {
    proj4.defs(`EPSG:${epsg}`, epsgDefinitions[epsg]);
});

export function SubNavPanel({
    items: propItems,
    currentPage,
    itemsPerPage,
    onTotalItemsChange,
    onCreateProject,
    searchQuery = '',
}: SubNavPanelProps) {
    const { language } = useContext(LanguageContext);

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [allSchemas, setAllSchemas] = useState<Schema[]>([]);
    const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
    const [schemaToDelete, setSchemaToDelete] = useState<Schema | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [highlightedSchema, setHighlightedSchema] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState<string | null>(null);
    
    const [starredItems, setStarredItems] = useState<Record<string, boolean>>({});
    const [descriptionText, setDescriptionText] = useState<Record<string, string>>({});
    
    const [schemaService] = useState(() => {return new SchemaService(language)});
    const [markerManager] = useState(() => {return new MapMarkerManager(language, (schemaName) => setHighlightedSchema(schemaName))});


    const fetchSchemasCallback = useCallback(
        async (page: number) => {
            try {
                setLoading(true);

                if (searchQuery.trim()) {
                    const schemasToSearch = allSchemas;
                    if (schemasToSearch.length === 0) {
                        schemaService.fetchAllSchemas((err, result) => {
                            setAllSchemas(result);
                            setLoading(false);
                        });
                    }

                    const query = searchQuery.toLowerCase().trim();
                    const filteredSchemas = schemasToSearch.filter(
                        (schema) =>
                            (schema.name &&
                                schema.name.toLowerCase().includes(query)) ||
                            (schema.description &&
                                schema.description
                                    .toLowerCase()
                                    .includes(query))
                    );

                    onTotalItemsChange(filteredSchemas.length);

                    const startIndex = (page - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const pagedFilteredSchemas = filteredSchemas.slice(
                        startIndex,
                        endIndex
                    );

                    setSchemas(pagedFilteredSchemas);
                    updateStarredItems(pagedFilteredSchemas);
                    setLoading(false);
                } else {
                    schemaService.fetchSchemas(
                        page,
                        itemsPerPage,
                        (err, result) => {
                            onTotalItemsChange(result.totalCount);
                            setSchemas(result.schemas);
                            updateStarredItems(result.schemas);
                            if (result.length > 0) {
                                markerManager.showAllSchemasOnMap(result);
                            }
                            setLoading(false);
                        }
                    );
                }
            } catch (err) {
                setError(
                    language === 'zh'
                        ? '获取模板列表失败'
                        : 'Failed to fetch schemas'
                );
                setLoading(false);
            }
        },
        [
            language,
            itemsPerPage,
            onTotalItemsChange,
            schemaService,
            searchQuery,
            allSchemas,
        ]
    );

    const fetchAllSchemasCallback = useCallback(async () => {
        schemaService.fetchAllSchemas((err, result) => {
            setAllSchemas(result);
            updateStarredItems(result);
            if (result.length > 0) {
                markerManager.showAllSchemasOnMap(result);
            }
        });
    }, [markerManager, schemaService]);

    useEffect(() => {
        fetchAllSchemasCallback();
    }, [fetchAllSchemasCallback]);

    useEffect(() => {
        fetchSchemasCallback(currentPage);
    }, [currentPage, fetchSchemasCallback]);

    useEffect(() => {
        schemaService.setLanguage(language);
        markerManager.setLanguage(language);
    }, [language, schemaService, markerManager]);

    useEffect(() => {
        if (allSchemas.length > 0) {
            markerManager.showAllSchemasOnMap(allSchemas);
        }
    }, [language, allSchemas, markerManager]);

    useEffect(() => {
        return () => {
            markerManager.clearAllMarkers();
        };
    }, [markerManager]);

    const updateStarredItems = (schemaList: Schema[]) => {
        const newStarredItems: Record<string, boolean> = {};
        const newDescriptionText: Record<string, string> = {};
        schemaList.forEach((schema) => {
            if (schema.name) {
                newStarredItems[schema.name] = schema.starred || false;
                newDescriptionText[schema.name] = schema.description || '';
            }
        });
        setStarredItems(newStarredItems);
        setDescriptionText(newDescriptionText);
    };

    const toggleStar = async (name: string, schema: Schema) => {
        const newState = !starredItems[name];

        schemaService.updateSchemaStarred(
            schema.name,
            newState,
            (err, result) => {
                const serverStarredState =
                    result?.starred !== undefined ? result.starred : newState;

                setStarredItems((prev) => ({
                    ...prev,
                    [name]: serverStarredState,
                }));

                const updatedSchemas = schemas.map((s) =>
                    s.name === schema.name
                        ? { ...s, starred: serverStarredState }
                        : s
                );
                setSchemas(updatedSchemas);
                setAllSchemas((prevAllSchemas) => {
                    const updatedAllSchemas = prevAllSchemas.map((s) =>
                        s.name === schema.name
                            ? { ...s, starred: serverStarredState }
                            : s
                    );
                    markerManager.showAllSchemasOnMap(updatedAllSchemas);
                    return updatedAllSchemas;
                });
            }
        );
    };

    const flyToSchema = (schema: Schema) => {
        markerManager.flyToSchema(schema);
    };

    const toggleEditDescription = (name: string) => {
        if (editingDescription === name) {
            setEditingDescription(null);
        } else {
            setEditingDescription(name);
        }
    };

    const updateDescription = async (name: string, updatedSchema: Schema) => {
        const newDescription = updatedSchema.description || '';
        schemaService.updateSchemaDescription(
            updatedSchema.name,
            newDescription
        );

        setDescriptionText((prev) => ({
            ...prev,
            [name]: newDescription,
        }));

        schemaService.fetchAllSchemas((err, result) => {
            setAllSchemas(result);
            fetchSchemasCallback(currentPage);
            markerManager.showAllSchemasOnMap(result);
        });

        setEditingDescription(null);
    };

    const openCloneDialog = (schema: Schema) => {
        setSelectedSchema(schema);
        setCloneDialogOpen(true);
    };

    const handleCloneSchema = async (newSchema: Schema): Promise<void> => {
        schemaService.submitCloneSchema(newSchema);

        setCloneDialogOpen(false);
        setSelectedSchema(null);

        schemaService.fetchAllSchemas((err, result) => {
            setAllSchemas(result);
            markerManager.showAllSchemasOnMap(result);
        });

        await fetchSchemasCallback(currentPage);
    };

    const handleDeleteSchema = (schema: Schema) => {
        setSchemaToDelete(schema);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!schemaToDelete) return;

        schemaService.deleteSchema(schemaToDelete.name, (err, result) => {
            if (err) {
                setDeleteDialogOpen(false);
                setSchemaToDelete(null);
                console.error('删除模板出错:', err);

                let errorMessage =
                    language === 'zh'
                        ? '模板删除失败'
                        : 'Failed to delete schema';

                if (err instanceof Error && err.message) {
                    if (err.message.includes('still in use')) {
                        errorMessage =
                            language === 'zh'
                                ? '模板正在被至少一个项目使用'
                                : 'Schema is still in use by at least one project';
                    } else {
                        errorMessage = err.message;
                    }
                }

                toast.error(errorMessage, {
                    style: {
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                    },
                });
            } else {
                setDeleteDialogOpen(false);
                setSchemaToDelete(null);
                if (result && result.success === true) {
                    setAllSchemas((prev) => {
                        const filtered = prev.filter(
                            (s) => s.name !== schemaToDelete.name
                        );
                        markerManager.showAllSchemasOnMap(filtered);
                        return filtered;
                    });

                    setSchemas((prev) =>
                        prev.filter((s) => s.name !== schemaToDelete.name)
                    );

                    store.get<{on: Function}>('updateSchemaCurrentPage')!.on();
                    fetchSchemasCallback(currentPage);

                    toast.success(
                        language === 'zh'
                            ? '模板删除成功'
                            : 'Schema deleted successfully',
                        {
                            style: {
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                            },
                        }
                    );
                } else if (result && result.detail) {
                    toast.error(result.detail, {
                        style: {
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                        },
                    });
                } else {
                    toast.error(
                        language === 'zh'
                            ? '模板删除失败'
                            : 'Failed to delete schema',
                        {
                            style: {
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                            },
                        }
                    );
                }
            }
        });
    };

    const items: SubNavItem[] = schemas.map((schema) => ({
        title: schema.name,
        schema: schema,
        items: [
            {
                title: language === 'zh' ? '基于此创建' : 'Create From',
                icon: <Copy className="h-4 w-4 mr-2" />,
                onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    openCloneDialog(schema);
                },
            },
            {
                title: language === 'zh' ? '创建项目' : 'Create Project',
                icon: <FolderPlus className="h-4 w-4 mr-2" />,
                onClick: async (e: React.MouseEvent) => {
                    e.preventDefault();
                    if (onCreateProject) {
                        try {
                            setError(
                                language === 'zh'
                                    ? '正在加载模板信息...'
                                    : 'Loading Schema Information...'
                            );
                            setIsLoading(true);

                            schemaService.getSchemaByName(
                                schema.name,
                                (err, result) => {
                                    if (err) {
                                        console.error(
                                            '[SubNavPanel] 获取模板详情失败:',
                                            err
                                        );
                                        setIsLoading(false);
                                        setError(
                                            language === 'zh'
                                                ? '获取模板详情失败，使用当前信息继续'
                                                : 'Failed to get schema details, continuing with current info'
                                        );

                                        onCreateProject(
                                            schema.name,
                                            schema.epsg.toString(),
                                            '1'
                                        );

                                        setTimeout(() => {
                                            setError(null);
                                            setIsLoading(false);
                                        }, 3000);
                                        return;
                                    }

                                    setIsLoading(false);
                                    setError(null);
                                    onCreateProject(
                                        result.grid_schema?.name ||
                                            schema.name,
                                        (
                                            result.grid_schema?.epsg ||
                                            schema.epsg
                                        ).toString(),
                                        result.grid_schema?.grid_info &&
                                            result.grid_schema.grid_info
                                                .length > 0
                                            ? JSON.stringify(
                                                  result.grid_schema
                                                      .grid_info[0]
                                              )
                                            : '1'
                                    );
                                }
                            );
                        } catch (err) {
                            console.error(
                                '[SubNavPanel] 获取模板详情失败:',
                                err
                            );
                            setIsLoading(false);
                            setError(
                                language === 'zh'
                                    ? '获取模板详情失败，使用当前信息继续'
                                    : 'Failed to get schema details, continuing with current info'
                            );

                            onCreateProject(
                                schema.name,
                                schema.epsg.toString(),
                                '1'
                            );

                            setTimeout(() => {
                                setError(null);
                                setIsLoading(false);
                            }, 3000);
                        }
                    } else {
                        console.error(
                            '[SubNavPanel] onCreateProject回调函数未定义'
                        );
                    }
                },
            },
            {
                title: language === 'zh' ? '删除模板' : 'Delete Schema',
                icon: (
                    <Trash2 className="h-4 w-4 mr-2 text-white group-hover:text-gray-400" />
                ),
                onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleDeleteSchema(schema);
                },
            },
        ],
    }));

    if (loading) {
        return (
            <>
                <SidebarGroup>
                    <div className="p-4 text-center">
                        {language === 'zh' ? '加载中...' : 'Loading...'}
                    </div>
                </SidebarGroup>

                <div
                    className="fixed inset-0 pointer-events-auto z-200 bg-[#212121] opacity-30"
                />
                <Loader />
            </>
        );
    }

    if (error) {
        return (
            <>
                {isLoading && (
                    <>
                        <div
                            className="fixed inset-0 pointer-events-auto z-200 bg-[#212121] opacity-30"
                        />
                        <Loader />
                    </>
                )}
                <SidebarGroup>
                    <div className="p-4 text-center text-red-500">{error}</div>
                </SidebarGroup>
            </>
        );
    }

    if (items.length === 0) {
        return (
            <SidebarGroup>
                <div className="p-4 text-center">
                    {language === 'zh'
                        ? '没有可用的模板'
                        : 'No schemas available'}
                </div>
            </SidebarGroup>
        );
    }

    return (
        <div className="px-3">
            {items.map((item) => (
                <div key={item.title}>
                    <SchemaCard
                        schema={item.schema!}
                        title={item.title}
                        isHighlighted={highlightedSchema === item.schema?.name}
                        language={language}
                        starredItems={starredItems}
                        openMenuId={openMenuId}
                        menuItems={item.items || []}
                        onCardClick={() => {
                            if (
                                highlightedSchema !== item.schema?.name &&
                                item.schema
                            ) {
                                flyToSchema(item.schema);
                            }
                        }}
                        onStarToggle={toggleStar}
                        onMenuOpenChange={(open) => {
                            if (open) {
                                setOpenMenuId(item.title);
                                2;
                            } else {
                                setOpenMenuId(null);
                            }
                        }}
                        editingDescription={editingDescription}
                        descriptionText={descriptionText}
                        onEditDescription={toggleEditDescription}
                        onSaveDescription={updateDescription}
                        onShowDetails={flyToSchema}
                    />
                </div>
            ))}

            {/* Clone Dialog */}
            {selectedSchema && (
                <CreateFromDialog
                    schema={selectedSchema}
                    isOpen={cloneDialogOpen}
                    language={language}
                    onClose={() => {
                        setCloneDialogOpen(false);
                        setSelectedSchema(null);
                    }}
                    onClone={handleCloneSchema}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {language === 'zh'
                                ? '确认删除'
                                : 'Confirm Deletion'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {language === 'zh'
                                ? `你确定要删除模板 "${schemaToDelete?.name}" 吗？此操作无法撤销。`
                                : `Are you sure you want to delete the schema "${schemaToDelete?.name}"? This action cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                            {language === 'zh' ? '取消' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 cursor-pointer"
                        >
                            {language === 'zh' ? '删除' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
