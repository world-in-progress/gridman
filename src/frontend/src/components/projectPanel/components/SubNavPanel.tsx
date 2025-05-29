import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '../../../context';
import { SidebarGroup } from '@/components/ui/sidebar';
import { Project, ProjectSubNavPanelProps, SubNavItem } from '../types/types';
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
import Loader from '@/components/ui/loader';
import store from '@/store';

export function SubNavPanel({
    currentPage,
    itemsPerPage,
    onTotalItemsChange,
    searchQuery = '',
    onCreatePatch,
}: ProjectSubNavPanelProps) {
    const { language } = useContext(LanguageContext);

    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [projects, setProjects] = useState<Project[]>([]);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [highlightedPatch, setHighlightedPatch] = useState<string | null>( null );
    const [editingDescription, setEditingDescription] = useState<string | null>(null);

    const [starredItems, setStarredItems] = useState<Record<string, boolean>>({});
    const [descriptionText, setDescriptionText] = useState<Record<string, string>>({});

    const [projectService] = useState(() => {return new ProjectService(language);});

    const fetchProjectsCallback = useCallback(async (page: number) => {
        try {
            setLoading(true);
            if (searchQuery.trim()) {
                const projectsToSearch = allProjects;
                if (projectsToSearch.length === 0) {
                    projectService.fetchAllProjects((err, result) => {
                        setAllProjects(result);
                        setLoading(false);
                    });
                }

                const query = searchQuery.toLowerCase().trim();
                const filteredProjects = projectsToSearch.filter(
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

                onTotalItemsChange(filteredProjects.length);

                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const pagedFilteredProjects = filteredProjects.slice(
                    startIndex,
                    endIndex
                );
                setProjects(pagedFilteredProjects);
                updateStarredItems(pagedFilteredProjects);
                setLoading(false);
            } else {
                projectService.fetchProjects(
                    page,
                    itemsPerPage,
                    (err, result) => {
                        onTotalItemsChange(result.totalCount);
                        setProjects(result.projects);
                        updateStarredItems(result.projects);
                        setLoading(false);
                    }
                );
            }
        } catch (err) {
            setError(
                language === 'zh'
                    ? '获取项目列表失败'
                    : 'Failed to fetch projects'
            );
            setLoading(false);
        }
    },
    [
        language,
        itemsPerPage,
        onTotalItemsChange,
        projectService,
        searchQuery,
        allProjects
    ]
);

    const fetchAllProjectsCallback = useCallback(async () => {
        projectService.fetchAllProjects((err, result) => {
            setAllProjects(result)
            updateStarredItems(result)
        })
    }, [projectService])

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
                const serverStarredState =
                    result?.project_meta?.starred ?? newState;

                setStarredItems((prev) => ({
                    ...prev,
                    [name]: serverStarredState,
                }));

                const updatedProjects = projects.map((p) =>
                    p.name === project.name
                        ? { ...p, starred: serverStarredState }
                        : p
                );
                setProjects(updatedProjects)
                setAllProjects((prevAllProjects) => {
                    const updatedAllProjects = prevAllProjects.map((s) =>
                        s.name === project.name
                            ? { ...s, starred: serverStarredState}
                            : s
                    )
                    return updatedAllProjects
                });
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

        projectService.updateProjectDescription(
            updatedProject.name,
            newDescription
        )

        setDescriptionText((prev) => ({
            ...prev,
            [name]: newDescription,
        }));

        projectService.fetchAllProjects((err, result) => {
            setAllProjects(result)
            fetchProjectsCallback(currentPage)
        })

        setEditingDescription(null)

    };

    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        projectService.deleteProject(
            projectToDelete.name,
            (err, result) => {
                if (err || result.success !== true) {
                    setDeleteDialogOpen(false)
                    setProjectToDelete(null)
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
                    setDeleteDialogOpen(false)
                    setProjectToDelete(null)
                    if (result && result.success === true) {
                        setAllProjects((prev) => {
                            const filtered = prev.filter(
                                (s) => s.name !== projectToDelete.name
                            )
                            return filtered
                        })

                        setProjects((prev) => prev.filter((s) => s.name !== projectToDelete.name))
                        store.get<{ on: Function }>('updateProjectCurrentPage')!.on();
                        fetchProjectsCallback(currentPage)
                        
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
                                ? '项目删除失败'
                                : 'Failed to project schema',
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
            }
        );
    };

    const handlePatchHighlight = (projectName: string, patchName: string) => {
        const highlightKey = `${projectName}:${patchName}`;
        setHighlightedPatch(highlightKey);

        if (window.mapRef && window.mapRef.current) {
            const { highlightPatch } = window.mapRef.current;
            if (highlightPatch && typeof highlightPatch === 'function') {
                highlightPatch(projectName, patchName);
            }
        }
    };

    const items: SubNavItem[] = projects.map((project) => ({
        title: project.name,
        items: [],
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
                        onAddPatch={onCreatePatch}
                        onDeleteProject={handleDeleteProject}
                        highlightedPatch={highlightedPatch}
                        onPatchHighlight={handlePatchHighlight}
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
