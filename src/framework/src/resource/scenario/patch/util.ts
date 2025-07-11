import { SceneNode } from "@/components/resourceScene/scene";
import * as apis from '@/core/apis/apis'

// Get Patch by schemaName and patchName
export const getPatchInfo = async(node: SceneNode, isRemote: boolean) => {
    try {
        const res = await apis.patch.getPatchMeta.fetch({schemaName: node.parent!.parent!.name, patchName: node.name}, isRemote)
        return res
    } catch (error) {
        console.error('Get patch info failed: ', error)
        return null
    }
}

// Delete Patch by schemaName and patchName
export const deletepatch = async(node: SceneNode, isRemote: boolean) => {
    try {
        const res = await apis.patch.deletePatch.fetch({schemaName: node.parent!.parent!.name, patchName: node.name}, isRemote)
        return res.success
    } catch (error) {
        console.error('Delete patch failed: ', error)
        return false
    }
}