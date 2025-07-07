import * as apis from '@/core/apis/apis'
import { SceneNode } from "@/components/resourceScene/scene"

// Get Schema information by schema name
export const getSchemaInfo = async(node: SceneNode, isRemote: boolean) => {
    try {
        const res = await apis.schema.getSchema.fetch(node.name, isRemote)
        return res.grid_schema
    } catch (error) {
        console.error('获取schema失败: ', error)
        return null
    }
}