import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '../../../App';
import { SidebarGroup } from '@/components/ui/sidebar';
import {
  Project,
  SubNavItem,
  ProjectSubNavPanelProps,
} from '../../schemaPanel/types/types';
import { ProjectCard } from './ProjectCard';
import { ProjectService } from '../utils/ProjectService';

export function SubNavPanel({
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
  onNavigateToPage,
  searchQuery = '',
}: ProjectSubNavPanelProps) {
  const { language } = useContext(LanguageContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starredItems, setStarredItems] = useState<Record<string, boolean>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [highlightedProject, setHighlightedProject] = useState<string | null>(
    null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string | null>(
    null
  );
  const [descriptionText, setDescriptionText] = useState<
    Record<string, string>
  >({});
  const [projectService] = useState(() => {
    return new ProjectService(language);
  });

  const fetchProjectsCallback = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        if (searchQuery.trim()) {
          let projectsToSearch = allProjects;
          if (projectsToSearch.length === 0) {
            try {
              projectsToSearch = await projectService.fetchAllProjects();
              setAllProjects(projectsToSearch || []);
            } catch (err) {
              console.error('Failed to fetch all projects for search:', err);
              projectsToSearch = [];
            }
          }

          const query = searchQuery.toLowerCase().trim();
          const filteredProjects = projectsToSearch.filter(
            (project) =>
              (project.name && project.name.toLowerCase().includes(query)) ||
              (project.description && project.description.toLowerCase().includes(query)) ||
              (project.schema_name && project.schema_name.toLowerCase().includes(query))
          );

          onTotalItemsChange(filteredProjects.length);

          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pagedFilteredProjects = filteredProjects.slice(
            startIndex,
            endIndex
          );

          setProjects(pagedFilteredProjects);
          if (pagedFilteredProjects.length > 0) {
            updateStarredItems(pagedFilteredProjects);
          }
        } else {
          try {
            const result = await projectService.fetchProjects(page, itemsPerPage);
            onTotalItemsChange(result.totalCount);
            setProjects(result.projects || []);
            if (result.projects && result.projects.length > 0) {
              updateStarredItems(result.projects);
            }
          } catch (err) {
            setError(
              language === 'zh' ? '获取项目列表失败' : 'Failed to fetch projects'
            );
            setProjects([]);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(
          language === 'zh' ? '获取项目列表失败' : 'Failed to fetch projects'
        );
        setProjects([]);
        setLoading(false);
      }
    },
    [language, itemsPerPage, onTotalItemsChange, projectService, searchQuery, allProjects]
  );

  const fetchAllProjectsCallback = useCallback(async () => {
    try {
      const projects = await projectService.fetchAllProjects();
      setAllProjects(projects || []);
      updateStarredItems(projects);
      
    } catch (err) {
      console.error('Failed to fetch all projects:', err);
      setAllProjects([]);
    }
  }, [projectService]);

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

    try {
      const updatedProject = await projectService.updateProjectStarred(
        project.name,
        newState
      );

      const serverStarredState =
        updatedProject?.starred !== undefined ? updatedProject.starred : newState;

      setStarredItems((prev) => ({
        ...prev,
        [name]: serverStarredState,
      }));

      const updatedProjects = projects.map((p) =>
        p.name === project.name ? { ...p, starred: serverStarredState } : p
      );
      setProjects(updatedProjects);

      setAllProjects((prevAllProjects) => {
        return prevAllProjects.map((p) =>
          p.name === project.name ? { ...p, starred: serverStarredState } : p
        );
      });
    } catch (err) {
      console.error('Failed to update star status:', err);
    }
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

    try {
      await projectService.updateProjectDescription(
        updatedProject.name,
        newDescription
      );

      setDescriptionText((prev) => ({
        ...prev,
        [name]: newDescription,
      }));

      const refreshedProjects = await projectService.fetchAllProjects();
      setAllProjects(refreshedProjects);

      fetchProjectsCallback(currentPage);
      setEditingDescription(null);
    } catch (err) {
      console.error('Failed to update project description:', err);
    }
  };

  const items: SubNavItem[] = projects.map((project) => ({
    title: project.name,
    url: '#',
    items: [
      {
        title: language === 'zh' ? '打开项目' : 'Open Project',
        url: `#/projects/${project.name}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
        },
      },
      {
        title: language === 'zh' ? '导出项目' : 'Export Project',
        url: `#/projects/export/${project.name}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
        },
      },
      {
        title: language === 'zh' ? '删除项目' : 'Delete Project',
        url: `#/projects/delete/${project.name}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
        },
      },
    ],
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
          {language === 'zh' ? '没有可用的项目' : 'No projects available'}
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
            isHighlighted={highlightedProject === projects[index].name}
            language={language}
            starredItems={starredItems}
            openMenuId={openMenuId}
            menuItems={item.items || []}
            onCardClick={() => setHighlightedProject(highlightedProject !== projects[index].name ? projects[index].name : null)}
            onStarToggle={toggleStar}
            onMenuOpenChange={(open) => {
              if (open) {
                setOpenMenuId(item.title);
              } else {
                setOpenMenuId(null);
              }
            }}
            editingDescription={editingDescription}
            descriptionText={descriptionText}
            onEditDescription={toggleEditDescription}
            onSaveDescription={updateDescription}
          />
        </div>
      ))}
    </div>
  );
}
