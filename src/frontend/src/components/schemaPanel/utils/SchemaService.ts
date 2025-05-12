import Actor from '../../../core/message/actor';
import { Schema } from '../types/types';
import { Callback } from '../../../core/types';
import { clearMapMarkers } from './SchemaCoordinateService';
import Dispatcher from '../../../core/message/dispatcher';
export class SchemaService {
    private language: string;

    private _dispatcher: Dispatcher;

    constructor(language: string) {
        this.language = language;
        this._dispatcher = new Dispatcher(this);
    }
    private get _actor() {
        return this._dispatcher.actor;
    }

    // Get all schemas
    public async fetchAllSchemas(): Promise<Schema[]> {
        return new Promise<Schema[]>((resolve, reject) => {
            let worker: Worker | null = null;
            let actor: Actor | null = null;

            worker = new Worker(
                new URL(
                    '../../../core/worker/base.worker.ts',
                    import.meta.url
                ),
                { type: 'module' }
            );
            actor = new Actor(worker, {});

            actor.send(
                'fetchSchemas',
                { startIndex: 0, endIndex: 1000 },
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        const sortedSchemas = [
                            ...result.project_schemas,
                        ].sort((a, b) => {
                            if (a.starred && !b.starred) return -1;
                            if (!a.starred && b.starred) return 1;
                            return 0;
                        });

                        resolve(sortedSchemas);
                    }

                    setTimeout(() => {
                        if (actor) actor.remove();
                        if (worker) worker.terminate();
                    }, 100);
                }
            );
        });
    }

    public async fetchAllSchemas(callback?: Callback<any>) {

    public async fetchSchemas(page: number, itemsPerPage: number, callback?: Callback<any>) {
        this._actor.send(
            'fetchSchemas',
            { startIndex: 0, endIndex: 1000 },
            (err, result) => {
                const allSortedSchemas = [...result.project_schemas].sort(
                    (a, b) => {
                        if (a.starred && !b.starred) return -1;
                        if (!a.starred && b.starred) return 1;
                        return 0;
                    }
                );

                const totalCount =
                    result.total_count || allSortedSchemas.length;

                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentPageSchemas = allSortedSchemas.slice(
                    startIndex,
                    endIndex
                );

                if (callback) {
                  callback(null, {
                      schemas: currentPageSchemas,
                      totalCount,
                  });
              }
            }
        );
    }

    public updateSchemaStarred(
        schemaName: string,
        starred: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateSchemaStarred',
            { name: schemaName, starred },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public updateSchemaDescription(
        schemaName: string,
        description: string,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'updateSchemaDescription',
            { name: schemaName, description },
            (err, result) => {
                if (callback) callback(err, result);
            }
        );
    }

    public setLanguage(language: string): void {
        this.language = language;
    }

    public getSchemaByName(schemaName: string, callback?: Callback<any>) {
        this._actor.send('getSchemaByName', schemaName, (err, result) => {
            if (callback) callback(err, result);
        });
    }

    public submitSchemaData(
        schemaData: Schema,
        onSuccess: () => void,
        onError: (error: string) => void,
        isSelectingPoint: boolean,
        cleanupFn?: () => void
    ): void {
        try {
            const worker = new Worker(
                new URL('../../../core/worker/base.worker.ts', import.meta.url),
                { type: 'module' }
            );

            const actor = new Actor(worker, {});

            actor.send('createSchema', schemaData, ((error, result) => {
                if (error) {
                    console.error('Worker错误:', error);
                    onError(
                        this.language === 'zh'
                            ? `提交失败: ${error.message}`
                            : `Submission failed: ${error.message}`
                    );

                    clearMapMarkers();

                    if (isSelectingPoint && window.mapInstance) {
                        if (window.mapInstance.getCanvas()) {
                            window.mapInstance.getCanvas().style.cursor = '';
                        }
                        if (cleanupFn) cleanupFn();
                    }
                } else {
                    if (result && result.success === false) {
                        console.error('提交失败:', result.message);
                        onError(
                            this.language === 'zh'
                                ? `${result.message}`
                                : `${result.message}`
                        );

                        clearMapMarkers();

                        if (isSelectingPoint && window.mapInstance) {
                            if (window.mapInstance.getCanvas()) {
                                window.mapInstance.getCanvas().style.cursor =
                                    '';
                            }
                            if (cleanupFn) cleanupFn();
                        }

                        setTimeout(() => {
                            actor.remove();
                            worker.terminate();
                        }, 100);

                        return;
                    }

                    clearMapMarkers();

                    if (isSelectingPoint && window.mapInstance) {
                        if (window.mapInstance.getCanvas()) {
                            window.mapInstance.getCanvas().style.cursor = '';
                        }
                        if (cleanupFn) cleanupFn();
                    }

                    onSuccess();
                }

                setTimeout(() => {
                    actor.remove();
                    worker.terminate();
                }, 100);
            }) as Callback<any>);
        } catch (error) {
            console.error('创建Worker出错:', error);
            onError(
                this.language === 'zh'
                    ? `创建Worker出错: ${
                          error instanceof Error ? error.message : String(error)
                      }`
                    : `Error creating worker: ${
                          error instanceof Error ? error.message : String(error)
                      }`
            );

            clearMapMarkers();

            if (isSelectingPoint && window.mapInstance) {
                if (window.mapInstance.getCanvas()) {
                    window.mapInstance.getCanvas().style.cursor = '';
                }
                if (cleanupFn) cleanupFn();
            }
        }
    }

    public submitCloneSchema(schemaData: Schema, callback?: Callback<any>) {
        this._actor.send('createSchema', schemaData, (err, result) => {
            let createdSchema: Schema;
            if (result && result.project_schema) {
                createdSchema = result.project_schema;
            } else {
                createdSchema = result;
            }
            if (callback) callback(err, createdSchema);
        });
    }

    public deleteSchema(schemaName: string, callback?: Callback<any>) {
        this._actor.send('deleteSchema', schemaName, (err, result) => {
            if (callback) callback(err, result);
        });
    }
}
