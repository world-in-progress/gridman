import Actor from '../../../core/message/actor';
import { Project } from '../types/types';
import Dispatcher from '../../../core/message/dispatcher';
import { Callback } from '../../../core/types';

export class ProjectService {
    private language: string;
    private _dispatcher: Dispatcher;

    constructor(language: string) {
        this.language = language;
        this._dispatcher = new Dispatcher(this);
    }

    private get _actor() {
        return this._dispatcher.actor;
    }
    // public async fetchAllProjects(): Promise<Project[]> {
    //     return new Promise<Project[]>((resolve, reject) => {
    //         let worker: Worker | null = null;
    //         let actor: Actor | null = null;

    //         try {
    //             worker = new Worker(
    //                 new URL(
    //                     '../../../core/worker/base.worker.ts',
    //                     import.meta.url
    //                 ),
    //                 { type: 'module' }
    //             );
    //             actor = new Actor(worker, {});

    //             actor.send(
    //                 'fetchProjects',
    //                 { startIndex: 0, endIndex: 1000 },
    //                 (err, result) => {
    //                     if (err) {
    //                         reject(err);
    //                     } else {
    //                         const projectMetas =
    //                             result && result.project_metas
    //                                 ? result.project_metas
    //                                 : [];

    //                         const sortedProjects = [...projectMetas].sort(
    //                             (a, b) => {
    //                                 if (a.starred && !b.starred) return -1;
    //                                 if (!a.starred && b.starred) return 1;
    //                                 return 0;
    //                             }
    //                         );

    //                         resolve(sortedProjects);
    //                     }

    //                     setTimeout(() => {
    //                         if (actor) actor.remove();
    //                         if (worker) worker.terminate();
    //                     }, 100);
    //                 }
    //             );
    //         } catch (err) {
    //             console.error('Failed to create Worker:', err);
    //             reject(err);
    //         }
    //     });
    // }

    public fetchAllProjects(startIndex: number, endIndex: number, callback?: Callback<any>) {
        this._actor.send(
            'fetchProjects',
            { startIndex: startIndex, endIndex: endIndex },
            (err, result) => {
                if (callback) callback(err, result);
                const projectMetas =
                    result && result.project_metas ? result.project_metas : [];

                const sortedProjects = [...projectMetas].sort((a, b) => {
                    if (a.starred && !b.starred) return -1;
                    if (!a.starred && b.starred) return 1;
                    return 0;
                });

                return sortedProjects;
            }
        );
    }

    public fetchProjects(
        page: number,
        itemsPerPage: number,
        callback?: Callback<any>
    ) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        this._actor.send(
            'fetchProjects',
            { startIndex, endIndex },
            (err, result) => {
                if (callback) callback(err, result);
                const projects = result.project_metas || [];
                const totalCount = result.total_count || projects.length;

                const sortedProjects = [...projects].sort((a, b) => {
                    if (a.starred && !b.starred) return -1;
                    if (!a.starred && b.starred) return 1;
                    return 0;
                });

                if (callback) callback(err, {
                    projects: sortedProjects,
                    totalCount,
                });
            }
        );
    }

    public getProjectByName(projectName: string, callback?: Callback<any>) {
        this._actor.send(
            'getProjectByName',
            { name: projectName },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updateProjectStarred(
        projectName: string,
        starred: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateProjectStarred',
            { name: projectName, starred },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updateProjectDescription(
        projectName: string,
        description: string,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateProjectDescription',
            { name: projectName, description },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public createProject(
        projectData: {
            name: string;
            description: string;
            schema_name: string;
            starred: boolean;
        },
        callback?: Callback<any>
    ) {
        this._actor.send('createProject', projectData, (err, result) => {
            if (callback) callback(err, result);
        });
    }

    public setLanguage(language: string): void {
        this.language = language;
    }

    public deleteProject(projectName: string, callback?: Callback<any>) {
        this._actor.send('deleteProject', projectName, (err, result) => {
            if (callback) callback(err, result);
        });
    }

    public async getSubprojects(
        projectName: string,
        subprojectName: string,
        callback?: Callback<any>
    ){
        this._actor.send(
            'getSubprojects',
            { projectName: projectName, subprojectName: subprojectName },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }
    // public async getSubprojects(
    //     projectName: string,
    //     subprojectName: string
    // ): Promise<{ success: boolean; message?: string }> {
    //     return new Promise((resolve, reject) => {
    //         let worker: Worker | null = null;
    //         let actor: Actor | null = null;

    //         try {
    //             worker = new Worker(
    //                 new URL(
    //                     '../../../core/worker/base.worker.ts',
    //                     import.meta.url
    //                 ),
    //                 { type: 'module' }
    //             );
    //             actor = new Actor(worker, {});

    //             actor.send(
    //                 'getSubprojects',
    //                 {
    //                     projectName: projectName,
    //                     subprojectName: subprojectName,
    //                 },
    //                 (err, result) => {
    //                     if (err) {
    //                         reject(
    //                             new Error(
    //                                 this.language === 'zh'
    //                                     ? '获取子项目失败'
    //                                     : 'Failed to get subprojects'
    //                             )
    //                         );
    //                     } else {
    //                         resolve(result);
    //                     }

    //                     setTimeout(() => {
    //                         if (actor) actor.remove();
    //                         if (worker) worker.terminate();
    //                     }, 100);
    //                 }
    //             );
    //         } catch (err) {
    //             reject(
    //                 new Error(
    //                     this.language === 'zh'
    //                         ? '获取子项目失败'
    //                         : 'Failed to get subprojects'
    //                 )
    //             );
    //         }
    //     });
    // }

    public fetchSubprojects(
        projectName: string, 
        callback?: Callback<any>) {
        this._actor.send(
            'fetchSubprojects', 
            { projectName: projectName },  
            (err, result) => {
                if (callback) callback(err, result);
        });
    }

    public createSubproject(
        projectName: string,
        subprojectData: {
            name: string;
            starred: boolean;
            description: string;
            bounds: [
                number | null,
                number | null,
                number | null,
                number | null
            ];
        },
        callback?: Callback<any>
    ) {
        this._actor.send(
            'createSubProject',
            {
                projectName: projectName,
                ...subprojectData,
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updateSubprojectStarred(
        projectName: string,
        subprojectName: string,
        starred: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateSubprojectStarred',
            {
                projectName: projectName,
                subprojectName: subprojectName,
                starred: starred,
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updateSubprojectDescription(
        projectName: string,
        subprojectName: string,
        description: string,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateSubprojectDescription',
            {
                projectName,
                subprojectName,
                description
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public setSubproject(
        projectName: string,
        subprojectName: string,
        flag: { isReady: boolean }
    ) {
        this._actor.send(
            'setSubproject',
            {
                projectName: projectName,
                subprojectName: subprojectName,
            },
            (error, result) => {
                if (error) {
                    console.error('设置子项目失败:', error);
                } else {
                    flag.isReady = true;
                    console.log(result);
                }
            }
        );
    }
}
