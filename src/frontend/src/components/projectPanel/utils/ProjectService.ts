import Actor from '../../../core/message/actor';
import { Project } from '../types/types';
import Dispatcher from '../../../core/message/dispatcher';
import { Callback } from '../../../core/types';
import { GridContext } from '@/core/grid/types';
import { boundingBox2D } from '@/core/util/boundingBox2D';
import GridCore from '@/core/grid/NHGridCore';
import store from '../../../store';
import { MultiGridRenderInfo } from '@/core/grid/types';
import TopologyLayer from '@/components/mapComponent/layers/TopologyLayer';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
import { PatchMeta } from '@/core/apis/types';

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

    public fetchAllProjects(
        startIndex: number,
        endIndex: number,
        callback?: Callback<any>
    ) {
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

                if (callback)
                    callback(err, {
                        projects: sortedProjects,
                        totalCount,
                    });
            }
        );
    }

    public getProjectByName(projectName: string, callback?: Callback<any>) {
        this._actor.send('getProjectByName', projectName, (err, result) => {
            if (callback) callback(err, result);
        });
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

    public fetchPatches(projectName: string, callback?: Callback<any>) {
        this._actor.send(
            'fetchPatches',
            { projectName: projectName },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public createPatch(
        projectName: string,
        patchData: PatchMeta,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'createPatch',
            {
                projectName: projectName,
                patchMeta: patchData,
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updatePatchStarred(
        projectName: string,
        patchName: string,
        starred: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updatePatchStarred',
            {
                projectName: projectName,
                patchName: patchName,
                starred: starred,
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updatePatchDescription(
        projectName: string,
        patchName: string,
        description: string,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updatePatchDescription',
            {
                projectName,
                patchName,
                description,
            },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public setPatch(
        projectName: string,
        patchName: string,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'setPatch',
            {
                projectName: projectName,
                patchName: patchName,
            },

            (error, result) => {
                if (error) {
                    console.error('设置补丁失败:', error);
                } else {
                    // Get topology layer
                    const clg = store.get<NHLayerGroup>('clg')!;
                    const topologyLayer = clg.getLayerInstance('TopologyLayer') as TopologyLayer;

                    // Create grid recorder context
                    const context: GridContext = {
                        bBox: boundingBox2D(...result.bounds as [number, number, number, number]),
                        rules: result.subdivide_rules,
                        srcCS: `EPSG:${result.epsg}`,
                        targetCS: 'EPSG:4326',
                    };
                    // Create grid recorder
                    const core: GridCore = new GridCore(context);
                    store.set('gridCore', core);
                    topologyLayer.gridCore = core;
                    callback && callback();
                }
            }
        );
    }
}
