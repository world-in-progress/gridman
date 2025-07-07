import { Schema } from '../types/types';
import { Callback } from '../../../core/types';
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

    public fetchAllSchemas(callback?: Callback<any>) {
        this._actor.send(
            'fetchSchemas',
            { startIndex: 0, endIndex: 1000 },
            (err, result) => {
                const sortedSchemas = [...result.project_schemas].sort(
                    (a, b) => {
                        if (a.starred && !b.starred) return -1;
                        if (!a.starred && b.starred) return 1;
                        return 0;
                    }
                );
                if (callback) callback(err, sortedSchemas);
            }
        );
    }

    public fetchSchemas(
        page: number,
        itemsPerPage: number,
        callback?: Callback<any>
    ) {
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

                const totalCount = result.total_count || allSortedSchemas.length;
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
        isSelectingPoint: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send('createSchema', schemaData, (err, result) => {
            callback?.(err, result);
        });
    }

    public submitCloneSchema(schemaData: Schema, callback?: Callback<any>) {
        this._actor.send('createSchema', schemaData, (err, result) => {
            let createdSchema: Schema;
            if (result && result.grid_schema) {
                createdSchema = result.grid_schema;
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
