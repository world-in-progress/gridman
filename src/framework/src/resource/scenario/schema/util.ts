import * as apis from '@/core/apis/apis'
import { SceneNode } from "@/components/resourceScene/scene"

export const getSchemaInfo = async(node: SceneNode, isRemote: boolean) => {
    try {
        const res = await apis.schema.getSchema.fetch(node.name, isRemote)
        console.log('成功拿到schema: ', res.grid_schema)
        return res.grid_schema
        // node.pageContext.schema = 

    } catch (error) {
        console.error('获取schema失败: ', error)
    }
}