import * as api from '@/core/apis/apis'

type ReturnType = {
    err: Error | null;
    result: any;
};

type AsyncReturnType = Promise<ReturnType>;

export default class SchemaUtils {
    static async deleteSchema(schemaName: string): AsyncReturnType {
        try {
            const response = await api.grid.schema.deleteSchema.fetch(schemaName)
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`删除模板失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async getSchemaByName(schemaName: string): AsyncReturnType {
        try {
            const response = await api.grid.schema.getSchema.fetch(schemaName)
            return {
                err: null,
                result: response,
            }
        } catch (error) {
            return {
                err: new Error(`获取模板失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updateSchemaDescription(
        schemaName: string,
        description: string
    ): AsyncReturnType {
        try {
            // Step 1: Get schema
            const getResponse = await api.grid.schema.getSchema.fetch(schemaName)

            if (!getResponse.project_schema) {
                throw new Error(`模板 ${schemaName} 不存在或未找到`);
            }

            // Step 2: Update description
            const schema = getResponse.project_schema
            schema.description = description

            // Step 3: Update schema
            const putResponse = await api.grid.schema.updateSchema.fetch({ schemaName, schema })
            return {
                err: null,
                result: putResponse,
            }
        } catch (error) {
            return {
                err: new Error(`更新模板描述失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updateSchemaStarred(
        schemaName: string,
        starred: boolean
    ): AsyncReturnType {
        try {
            // Step 1: Get schema
            const getResponse = await api.grid.schema.getSchema.fetch(schemaName)

            if (!getResponse.project_schema) {
                throw new Error(`模板 ${schemaName} 不存在或未找到`);
            }

            // Step 2: Update starred status
            const schema = getResponse.project_schema
            schema.starred = starred

            // Step 3: Update schema
            const putResponse = await api.grid.schema.updateSchema.fetch({ schemaName, schema })
            return {
                err: null,
                result: putResponse,
            }
        } catch (error) {
            return {
                err: new Error(`更新模板星级失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async fetchSchemas(
        startIndex: number,
        endIndex: number
    ): AsyncReturnType {
        try {
            const schemaNum = (await api.grid.schemas.getSchemasNum.fetch()).number
            const schemas = await api.grid.schemas.getSchemas.fetch({
                startIndex,
                endIndex
            })
            return {
                err: null,
                result: {
                    project_schemas: schemas.project_schemas,
                    total_count: schemaNum
                }
            }
        } catch (error) {
            return {
                err: new Error(`获取模板列表失败! 错误信息: ${error}`),
                result: null,
            }
        }
        
    }

    static async createSchema(schemaData: any): AsyncReturnType {
        try {
            const response = await api.grid.schema.createSchema.fetch(schemaData)
            return {
                err: null,
                result: response,
            }
        } catch (error) {
            return {
                err: new Error(`创建模板失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }
}
