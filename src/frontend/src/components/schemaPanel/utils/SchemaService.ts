import Actor from '../../../core/message/actor';
import { Schema } from '../types/types';

export class SchemaService {
  private language: string;

  constructor(language: string) {
    this.language = language;
  }

  // 获取所有模板
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

  // 获取分页模板
  public async fetchSchemas(page: number, itemsPerPage: number): Promise<{
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
              reject(new Error(
                this.language === 'zh' ? '获取模板列表失败' : 'Failed to fetch schemas'
              ));
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
          this.language === 'zh' ? '获取模板列表失败' : 'Failed to fetch schemas'
        ));
      }
    });
  }

  // 更新标星状态
  public async updateSchemaStarred(schemaName: string, starred: boolean): Promise<Schema> {
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

  // 更新描述
  public async updateSchemaDescription(schemaName: string, description: string): Promise<Schema> {
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

  // 更新语言
  public setLanguage(language: string): void {
    this.language = language;
  }
} 