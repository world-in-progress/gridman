import { SceneNode } from '@/components/resourceScene/scene'
import * as apis from '@/core/apis/apis'
import { GridInfo } from '@/core/apis/types'
import store from '@/store'

export const createGrid = async (node: SceneNode, gridName: string, gridInfo: GridInfo) => {
    try {
        store.get<{ on: Function; off: Function }>('isLoading')!.on()

        const res = await apis.grids.createGrid.fetch({schemaName: node.parent!.name, gridName, gridInfo}, node.tree.isPublic)
        return res
    } catch (error) {
        console.error('Create grid failed: ', error)
        return null
    }
}