import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '../../../context';
import { SidebarGroup } from '@/components/ui/sidebar';
import { SubNavItem } from '../../schemaPanel/types/types';
import { Project, ProjectSubNavPanelProps } from '../types/types';
import { ProjectCard } from './ProjectCard';
import { ProjectService } from '../utils/ProjectService';
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

export function SubNavPanel({
    currentPage,
    itemsPerPage,
    onTotalItemsChange,
    searchQuery = '',
    onCreateSubProject,
}: ProjectSubNavPanelProps) {
    const { language } = useContext(LanguageContext);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [starredItems, setStarredItems] = useState<Record<string, boolean>>(
        {}
    );
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState<string | null>(
        null
    );
    const [descriptionText, setDescriptionText] = useState<
        Record<string, string>
    >({});
    const [highlightedSubproject, setHighlightedSubproject] = useState<string | null>(null);
    const [projectService] = useState(() => {
        return new ProjectService(language);
    });

    const applyPagingAndSearch = useCallback(
        (projectList: Project[], page: number) => {
            let filteredProjects = projectList;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                filteredProjects = projectList.filter(
                    (project) =>
                        (project.name &&
                            project.name.toLowerCase().includes(query)) ||
                        (project.description &&
                            project.description
                                .toLowerCase()
                                .includes(query)) ||
                        (project.schema_name &&
                            project.schema_name.toLowerCase().includes(query))
                );
            }

            onTotalItemsChange(filteredProjects.length);

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pagedProjects = filteredProjects.slice(startIndex, endIndex);

            setProjects(pagedProjects);
            updateStarredItems(pagedProjects);
            setLoading(false);
        },
        [searchQuery, itemsPerPage, onTotalItemsChange]
    );

    const fetchProjectsCallback = useCallback(
        async (page: number, afterFunction?: () => void) => {
            try {
                setLoading(true);

                if (allProjects.length === 0) {
                    projectService.fetchAllProjects(0, 1000, (err, result) => {
                        if (err) {
                            console.error('获取所有项目失败:', err);
                            setError(
                                language === 'zh'
                                    ? '获取项目列表失败'
                                    : 'Failed to fetch projects'
                            );
                            setProjects([]);
                            setLoading(false);
                            if (afterFunction) afterFunction();
                        } else {
                            const sortedProjects = [
                                ...(result.project_metas || []),
                            ].sort((a, b) => {
                                if (a.starred && !b.starred) return -1;
                                if (!a.starred && b.starred) return 1;
                                return 0;
                            });
                            setAllProjects(sortedProjects);
                            updateStarredItems(sortedProjects);
                            applyPagingAndSearch(sortedProjects, page);
                            if (afterFunction) afterFunction();
                        }
                    });
                } else {
                    applyPagingAndSearch(allProjects, page);
                    if (afterFunction) afterFunction();
                }
            } catch (err) {
                setError(
                    language === 'zh'
                        ? '获取项目列表失败'
                        : 'Failed to fetch projects'
                );
                setProjects([]);
                setLoading(false);
                if (afterFunction) afterFunction();
            }
        },
        [
            language,
            itemsPerPage,
            onTotalItemsChange,
            projectService,
            searchQuery,
            allProjects,
            applyPagingAndSearch,
        ]
    );

    const fetchAllProjectsCallback = useCallback(async () => {
        projectService.fetchAllProjects(0, 1000, (err, result) => {
            if (err) {
                console.error('获取所有项目失败:', err);
            } else {
                const sortedProjects = [...(result.project_metas || [])].sort(
                    (a, b) => {
                        if (a.starred && !b.starred) return -1;
                        if (!a.starred && b.starred) return 1;
                        return 0;
                    }
                );
                setAllProjects(sortedProjects);
                updateStarredItems(sortedProjects);
                applyPagingAndSearch(sortedProjects, currentPage);
            }
        });
    }, [projectService, currentPage, applyPagingAndSearch]);

    useEffect(() => {
        fetchAllProjectsCallback();
    }, [fetchAllProjectsCallback]);

    useEffect(() => {
        fetchProjectsCallback(currentPage);
    }, [currentPage, fetchProjectsCallback]);

    useEffect(() => {
        projectService.setLanguage(language);
    }, [language, projectService]);

    const updateStarredItems = (projectList: Project[]) => {
        if (!projectList || projectList.length === 0) {
            return;
        }

        const newStarredItems: Record<string, boolean> = {};
        const newDescriptionText: Record<string, string> = {};
        projectList.forEach((project) => {
            if (project && project.name) {
                newStarredItems[project.name] = project.starred || false;
                newDescriptionText[project.name] = project.description || '';
            }
        });
        setStarredItems(newStarredItems);
        setDescriptionText(newDescriptionText);
    };

    const toggleStar = async (name: string, project: Project) => {
        const newState = !starredItems[name];
        projectService.updateProjectStarred(
            project.name,
            newState,
            (err, result) => {
                if (err) {
                    console.error('Failed to update star status:', err);
                    return;
                }

                const serverStarredState =
                    result?.project_meta?.starred ?? newState;
                const updatedAllProjects = allProjects.map((p) =>
                    p.name === project.name
                        ? { ...p, starred: serverStarredState }
                        : p
                );
                const sortedAllProjects = [...updatedAllProjects].sort(
                    (a, b) => {
                        if (a.starred && !b.starred) return -1;
                        if (!a.starred && b.starred) return 1;
                        return 0;
                    }
                );

                setAllProjects(sortedAllProjects);
                setStarredItems((prev) => ({
                    ...prev,
                    [name]: serverStarredState,
                }));
                applyPagingAndSearch(sortedAllProjects, currentPage);
            }
        );
    };

    const toggleEditDescription = (name: string) => {
        if (editingDescription === name) {
            setEditingDescription(null);
        } else {
            setEditingDescription(name);
        }
    };

    const updateDescription = async (name: string, updatedProject: Project) => {
        const newDescription = updatedProject.description || '';
        setLoading(true);

        setDescriptionText((prev) => ({
            ...prev,
            [name]: newDescription,
        }));

        projectService.updateProjectDescription(
            updatedProject.name,
            newDescription,
            (err, result) => {
                if (err) {
                    console.error('Failed to update project description:', err);
                    setLoading(false);
                    return;
                }

                const updatedAllProjects = allProjects.map((p) =>
                    p.name === updatedProject.name
                        ? { ...p, description: newDescription }
                        : p
                );
                const sortedAllProjects = [...updatedAllProjects].sort(
                    (a, b) => {
                        if (a.starred && !b.starred) return -1;
                        if (!a.starred && b.starred) return 1;
                        return 0;
                    }
                );

                setAllProjects(sortedAllProjects);
                applyPagingAndSearch(sortedAllProjects, currentPage);
                setEditingDescription(null);
            }
        );
    };
    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        projectService.deleteProject(
            projectToDelete.name,
            async (err, result) => {
                if (err || result.success !== true) {
                    console.error('删除项目出错:', err);
                    toast.error(
                        language === 'zh'
                            ? '项目删除失败'
                            : 'Failed to delete project',
                        {
                            style: {
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                            },
                        }
                    );
                } else {
                    const updatedProjects = allProjects.filter(
                        (p) => p.name !== projectToDelete.name
                    );
                    setAllProjects(updatedProjects);

                    applyPagingAndSearch(updatedProjects, currentPage);

                    setDeleteDialogOpen(false);

                    toast.success(
                        language === 'zh'
                            ? '项目删除成功'
                            : 'Project deleted successfully',
                        {
                            style: {
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                            },
                        }
                    );
                }
            }
        );
    };

    const handleSubprojectHighlight = (projectName: string, subprojectName: string) => {
        const highlightKey = `${projectName}:${subprojectName}`;
        setHighlightedSubproject(highlightKey);
        
        if (window.mapRef && window.mapRef.current) {
            const { highlightSubproject } = window.mapRef.current;
            if (highlightSubproject && typeof highlightSubproject === 'function') {
                highlightSubproject(projectName, subprojectName);
            }
        }
    };

    const items: SubNavItem[] = projects.map((project) => ({
        title: project.name,
        items: [],
    }));

    if (loading) {
        return (
            <SidebarGroup>
                <div className="p-4 text-center">
                    {language === 'zh' ? '加载中...' : 'Loading...'}
                </div>
            </SidebarGroup>
        );
    }

    if (error) {
        return (
            <SidebarGroup>
                <div className="p-4 text-center text-red-500">{error}</div>
            </SidebarGroup>
        );
    }

    if (items.length === 0) {
        return (
            <SidebarGroup>
                <div className="p-4 text-center">
                    {language === 'zh'
                        ? '没有可用的项目'
                        : 'No projects available'}
                </div>
            </SidebarGroup>
        );
    }

    return (
        <div className="px-3">
            {items.map((item, index) => (
                <div key={item.title}>
                    <ProjectCard
                        project={projects[index]}
                        title={item.title}
                        language={language}
                        starredItems={starredItems}
                        onStarToggle={toggleStar}
                        editingDescription={editingDescription}
                        descriptionText={descriptionText}
                        onEditDescription={toggleEditDescription}
                        onSaveDescription={updateDescription}
                        onAddSubproject={onCreateSubProject}
                        onDeleteProject={handleDeleteProject}
                        highlightedSubproject={highlightedSubproject}
                        onSubprojectHighlight={handleSubprojectHighlight}
                    />
                </div>
            ))}

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
                                ? `你确定要删除项目 "${projectToDelete?.name}" 吗？此操作无法撤销。`
                                : `Are you sure you want to delete the project "${projectToDelete?.name}"? This action cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {language === 'zh' ? '取消' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {language === 'zh' ? '删除' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
