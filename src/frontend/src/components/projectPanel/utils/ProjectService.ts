import Actor from '../../../core/message/actor';
import { Project } from '../../schemaPanel/types/types';

export class ProjectService {
  private language: string;

  constructor(language: string) {
    this.language = language;
  }
  public async fetchAllProjects(): Promise<Project[]> {
    return new Promise<Project[]>((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'fetchProjects',
          { startIndex: 0, endIndex: 1000 },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              const projectMetas = result && result.project_metas ? result.project_metas : [];
              
              const sortedProjects = [...projectMetas].sort((a, b) => {
                if (a.starred && !b.starred) return -1;
                if (!a.starred && b.starred) return 1;
                return 0;
              });

              resolve(sortedProjects);
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        console.error('Failed to create Worker:', err);
        reject(err);
      }
    });
  }

  public async fetchProjects(page: number, itemsPerPage: number): Promise<{
    projects: Project[];
    totalCount: number;
  }> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'fetchProjects',
          { startIndex, endIndex },
          (err, result) => {
            if (err) {
              reject(new Error(
                this.language === 'zh' ? '获取项目列表失败' : 'Failed to fetch projects'
              ));
            } else {
              const projects = result.project_metas || [];
              const totalCount = result.total_count || projects.length;

              const sortedProjects = [...projects].sort((a, b) => {
                if (a.starred && !b.starred) return -1;
                if (!a.starred && b.starred) return 1;
                return 0;
              });

              resolve({
                projects: sortedProjects,
                totalCount
              });
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(new Error(
          this.language === 'zh' ? '获取项目列表失败' : 'Failed to fetch projects'
        ));
      }
    });
  }

  public async getProjectByName(projectName: string): Promise<Project> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'getProjectByName',
          { name: projectName },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              let project = result;
              if (result && typeof result === 'object') {
                project = result.project_meta || result;
              }
              resolve(project as Project);
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }


  public async updateProjectStarred(projectName: string, starred: boolean): Promise<Project> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'updateProjectStarred',
          { name: projectName, starred },
          (err, result) => {
            if (err) {
              reject(new Error(
                this.language === 'zh' ? '更新项目星标状态失败' : 'Failed to update project star status'
              ));
            } else {
              let projectData = result;
              if (result && typeof result === 'object') {
                projectData = result.project_meta || result;
              }
              resolve(projectData as Project);
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(new Error(
          this.language === 'zh' ? '更新项目星标状态失败' : 'Failed to update project star status'
        ));
      }
    });
  }

  public async updateProjectDescription(projectName: string, description: string): Promise<Project> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'updateProjectDescription',
          { name: projectName, description },
          (err, result) => {
            if (err) {
              reject(new Error(
                this.language === 'zh' ? '更新项目描述失败' : 'Failed to update project description'
              ));
            } else {
              let projectData = result;
              if (result && typeof result === 'object') {
                projectData = result.project_meta || result;
              }
              resolve(projectData as Project);
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(new Error(
          this.language === 'zh' ? '更新项目描述失败' : 'Failed to update project description'
        ));
      }
    });
  }

  public async createProject(projectData: {
    name: string;
    description: string;
    schema_name: string;
    bounds: number[];
    starred: boolean;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send(
          'createProject',
          projectData,
          (err, result) => {
            if (err) {
              reject(new Error(
                this.language === 'zh' ? `创建项目失败: ${err.message}` : `Failed to create project: ${err.message}`
              ));
            } else {
              resolve(result);
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(new Error(
          this.language === 'zh' ? '创建项目失败' : 'Failed to create project'
        ));
      }
    });
  }

  public setLanguage(language: string): void {
    this.language = language;
  }
} 