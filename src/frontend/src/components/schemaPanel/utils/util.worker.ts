import * as api from '@/core/apis/apis'
import { Callback, WorkerSelf } from '@/core/types'

export async function createSchema(
    this: WorkerSelf,
    schemaData: any,
    callback: Callback<any>
) {
    try {
        const response = await api.schema.createSchema.fetch(schemaData)
        callback(null, response)
    } catch (error) {
        callback(new Error(`创建模板失败! 错误信息: ${error}`), null)
    }
}

export async function fetchSchemas(
    this: WorkerSelf,
    params: { startIndex: number; endIndex: number },
    callback: Callback<any>
) {
    const { startIndex, endIndex } = params;
    try {
        const schemaNum = (await api.schemas.getSchemasNum.fetch()).number
        const schemas = await api.schemas.getSchemas.fetch({
            startIndex,
            endIndex
        })
        callback(null, {
            project_schemas: schemas.project_schemas,
            total_count: schemaNum
        })
    } catch (error) {
        callback(new Error(`获取模板列表失败! 错误信息: ${error}`), null)
    }
}

export async function updateSchemaStarred(
    this: WorkerSelf,
    params: { name: string; starred: boolean },
    callback: Callback<any>
) {
    const { name: schemaName, starred } = params
    try {
        // Step 1: Get schema
        const getResponse = await api.schema.getSchema.fetch(schemaName)

        if (!getResponse.grid_schema) {
            throw new Error(`模板 ${schemaName} 不存在或未找到`);
        }

        // Step 2: Update starred status
        const schema = getResponse.grid_schema
        schema.starred = starred

        // Step 3: Update schema
        const putResponse = await api.schema.updateSchema.fetch({ schemaName, schema })
        callback(null, putResponse)

    } catch (error) {
        callback(new Error(`更新模板星级失败! 错误信息: ${error}`), null)
    }
}

export async function updateSchemaDescription(
    this: WorkerSelf,
    params: { name: string; description: string },
    callback: Callback<any>
) {
    const { name: schemaName, description } = params
    try {
        // Step 1: Get schema
        const getResponse = await api.schema.getSchema.fetch(schemaName)

        if (!getResponse.grid_schema) {
            throw new Error(`模板 ${schemaName} 不存在或未找到`);
        }

        // Step 2: Update description
        const schema = getResponse.grid_schema
        schema.description = description

        // Step 3: Update schema
        const putResponse = await api.schema.updateSchema.fetch({ schemaName, schema })
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

export async function getSchemaByName(
    this: WorkerSelf,
    schemaName: string,
    callback: Callback<any>
) {
    try {
        const response = await api.schema.getSchema.fetch(schemaName)
        callback(null, response)

    } catch (error) {
        callback(new Error(`获取模板失败! 错误信息: ${error}`), null)
    }
}

export async function deleteSchema(
    this: WorkerSelf,
    schemaName: string,
    callback: Callback<any>
) {
    try {
        const response = await api.schema.deleteSchema.fetch(schemaName)
        callback(null, response)

    } catch (error) {
        callback(new Error(`删除模板失败! 错误信息: ${error}`), null)
    }
}
