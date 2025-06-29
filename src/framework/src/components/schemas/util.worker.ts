import * as api from '@/core/apis/apis'
import { Callback, WorkerSelf } from '@/core/types'

export async function createSchema(
    this: WorkerSelf,
    params: { schemaData: any, isRemote: boolean },
    callback: Callback<any>
) {
    try {
        const response = await api.schema.createSchema.fetch(params.schemaData, params.isRemote)
        callback(null, response)
    } catch (error) {
        callback(new Error(`创建模板失败! 错误信息: ${error}`), null)
    }
}

export async function updateSchemaStarred(
    this: WorkerSelf,
    params: { name: string; starred: boolean, isRemote: boolean },
    callback: Callback<any>
) {
    const { name: schemaName, starred, isRemote } = params
    try {
        // Step 1: Get schema
        const getResponse = await api.schema.getSchema.fetch(schemaName, isRemote)

        if (!getResponse.project_schema) {
            throw new Error(`模板 ${schemaName} 不存在或未找到`);
        }

        // Step 2: Update starred status
        const schema = getResponse.project_schema
        schema.starred = starred

        // Step 3: Update schema
        const putResponse = await api.schema.updateSchema.fetch({ schemaName, schema }, isRemote)
        callback(null, putResponse)

    } catch (error) {
        callback(new Error(`更新模板星级失败! 错误信息: ${error}`), null)
    }
}

export async function updateSchemaDescription(
    this: WorkerSelf,
    params: { name: string; description: string, isRemote: boolean },
    callback: Callback<any>
) {
    const { name: schemaName, description, isRemote } = params
    try {
        // Step 1: Get schema
        const getResponse = await api.schema.getSchema.fetch(schemaName, isRemote)

        if (!getResponse.project_schema) {
            throw new Error(`模板 ${schemaName} 不存在或未找到`);
        }

        // Step 2: Update description
        const schema = getResponse.project_schema
        schema.description = description

        // Step 3: Update schema
        const putResponse = await api.schema.updateSchema.fetch({ schemaName, schema }, isRemote)
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
    params: { schemaName: string, isRemote: boolean },
    callback: Callback<any>
) {
    try {
        const response = await api.schema.getSchema.fetch(params.schemaName, params.isRemote)
        callback(null, response)

    } catch (error) {
        callback(new Error(`获取模板失败! 错误信息: ${error}`), null)
    }
}

export async function deleteSchema(
    this: WorkerSelf,
    params: { schemaName: string, isRemote: boolean },
    callback: Callback<any>
) {
    try {
        const response = await api.schema.deleteSchema.fetch(params.schemaName, params.isRemote)
        callback(null, response)

    } catch (error) {
        callback(new Error(`删除模板失败! 错误信息: ${error}`), null)
    }
}
