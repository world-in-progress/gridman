import Actor from '../../../core/message/actor';
import { Schema } from '../types/types';
import { Callback } from '../../../core/types';
import { clearMapMarkers } from './SchemaCoordinateService';

export class SchemaService {
  private language: string;

  constructor(language: string) {
    this.language = language;
  }

  // Get all schemas
  public async fetchAllSchemas(): Promise<Schema[]> {
    return new Promise<Schema[]>((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
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
              const sortedSchemas = [...result.grid_schemas].sort((a, b) => {
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
      } catch (err) {
        console.error('Failed to create Worker:', err);
        reject(err);
      }
    });
  }

  // Get paginated schemas
  public async fetchSchemas(
    page: number,
    itemsPerPage: number
  ): Promise<{
    schemas: Schema[];
    totalCount: number;
  }> {
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
          'fetchSchemas',
          { startIndex: 0, endIndex: 1000 },
          (err, result) => {
            if (err) {
              reject(
                new Error(
                  this.language === 'zh'
                    ? '获取模板列表失败'
                    : 'Failed to fetch schemas'
                )
              );
            } else {
              const allSortedSchemas = [...result.grid_schemas].sort((a, b) => {
                if (a.starred && !b.starred) return -1;
                if (!a.starred && b.starred) return 1;
                return 0;
              });

              const totalCount = result.total_count || allSortedSchemas.length;

              const startIndex = (page - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentPageSchemas = allSortedSchemas.slice(
                startIndex,
                endIndex
              );

              resolve({
                schemas: currentPageSchemas,
                totalCount,
              });
            }

            setTimeout(() => {
              if (actor) actor.remove();
              if (worker) worker.terminate();
            }, 100);
          }
        );
      } catch (err) {
        reject(
          new Error(
            this.language === 'zh'
              ? '获取模板列表失败'
              : 'Failed to fetch schemas'
          )
        );
      }
    });
  }

  // Update starred status
  public async updateSchemaStarred(
    schemaName: string,
    starred: boolean
  ): Promise<Schema> {
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
          'updateSchemaStarred',
          { name: schemaName, starred },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              let updatedSchema = result;
              if (result && result.grid_schema) {
                updatedSchema = result.grid_schema;
              }
              resolve(updatedSchema);
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

  // Update description
  public async updateSchemaDescription(
    schemaName: string,
    description: string
  ): Promise<Schema> {
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
          'updateSchemaDescription',
          { name: schemaName, description },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              let updatedSchema = result;
              if (result && result.grid_schema) {
                updatedSchema = result.grid_schema;
              }
              resolve(updatedSchema);
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

  // Update language
  public setLanguage(language: string): void {
    this.language = language;
  }

  // Get single schema details by name
  public async getSchemaByName(schemaName: string): Promise<Schema> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send('getSchemaByName', { name: schemaName }, (err, result) => {
          if (err) {
            console.error('[SchemaService] 获取模板详情出错:', err);
            reject(err);
          } else {
            let schema: Schema;
            if (result && result.grid_schema) {
              schema = result.grid_schema;
            } else {
              schema = result;
            }
            resolve(schema);
          }

          setTimeout(() => {
            if (actor) actor.remove();
            if (worker) worker.terminate();
          }, 100);
        });
      } catch (err) {
        console.error('[SchemaService] 创建Worker出错:', err);
        reject(err);
      }
    });
  }

  // Submit schema data (integrated from SchemaSubmissionService)
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
              this.language === 'zh' ? `${result.message}` : `${result.message}`
            );

            clearMapMarkers();

            if (isSelectingPoint && window.mapInstance) {
              if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
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

  // Submit clone schema data and return a Promise<Schema>
  public submitCloneSchema(schemaData: Schema): Promise<Schema> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );

        const actor = new Actor(worker, {});

        actor.send('createSchema', schemaData, ((error, result) => {
          if (error) {
            console.error('克隆模板错误:', error);
            reject(error);
          } else {
            if (result && result.success === false) {
              console.error('克隆模板失败:', result.message);
              reject(new Error(result.message));
              return;
            }
            let createdSchema: Schema;
            if (result && result.grid_schema) {
              createdSchema = result.grid_schema;
            } else {
              createdSchema = result;
            }
            resolve(createdSchema);
          }

          setTimeout(() => {
            actor.remove();
            worker.terminate();
          }, 100);
        }) as Callback<any>);
      } catch (error) {
        console.error('创建Worker出错:', error);
        reject(error);
      }
    });
  }

  // Delete schema by name
  public async deleteSchema(schemaName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let actor: Actor | null = null;

      try {
        worker = new Worker(
          new URL('../../../core/worker/base.worker.ts', import.meta.url),
          { type: 'module' }
        );
        actor = new Actor(worker, {});

        actor.send('deleteSchema', { name: schemaName }, (err, result) => {
          if (err) {
            console.error('[SchemaService] 删除模板出错:', err);
            reject(err);
          } else {
            resolve(result);
          }

          setTimeout(() => {
            if (actor) actor.remove();
            if (worker) worker.terminate();
          }, 100);
        });
      } catch (err) {
        console.error('[SchemaService] 创建Worker出错:', err);
        reject(err);
      }
    });
  }
}
