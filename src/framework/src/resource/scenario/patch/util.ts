import { SceneNode } from "@/components/resourceScene/scene";
import * as apis from '@/core/apis/apis'
import { PatchMeta } from "../patches/types";
import Dispatcher from "@/core/message/dispatcher";
import { Callback } from "@/core/types";
import { GridContext } from "@/core/grid/types";
import GridCore from "@/core/grid/NHGridCore";

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

// Update Patch Info
export const updatePatchInfo = async(node: SceneNode, patch: PatchMeta, isRemote: boolean) => {
    try {
        const res = await apis.patch.updatePatch.fetch({schemaName: node.parent!.parent!.name, patchName: node.name, meta: patch}, isRemote)
        return res.success
    } catch (error) {
        console.error('Update patch info failed: ', error)
        return false
    }
}



export class PatchService {
    private _dispatcher: Dispatcher

    constructor() {
        this._dispatcher = new Dispatcher(this)
    }

    private get _actor() {
        return this._dispatcher.actor
    }

    public setPatch(
        node: SceneNode, 
        isRemote: boolean,
        callback?: Callback<any>
    ) {
        this._actor.send(
            'setPatch',
            {
                schemaName: node.parent!.parent!.name,
                patchName: node.name
            },
            (error, result) => {
                if (error) {
                    console.error('Set patch failed: ', error)
                } else {
                    // TODO: Get topology layer

                    // TODD: Create grid recorder context
                    const context: GridContext = {
                        srcCS: `EPSG:${result.epsg}`,
                        targetCS: 'EPSG:4326',
                        bBox: result.bounds,
                        rules: result.subdivide_rules
                    }

                    const core: GridCore = new GridCore(context, isRemote)
                    callback && callback();
                }
            }
        )
    }
}

export const setPatch = async(node: SceneNode) => {
    try {
        // Step 1: Set current patch
        await apis.patch.setPatch.fetch({schemaName: node.parent!.parent!.name, patchName: node.name}, node.tree.isPublic)

        // Step 2: Poll until patch is ready
        while (true) {
            const isReady = await apis.patch.checkPatchReady.fetch(apis.VOID_VALUE, node.tree.isPublic)
            if (isReady) break
            setTimeout(() => {}, 1000)
        }

        // Step 3: Get patch info
        const patchMeta = await apis.patch.getPatchMeta.fetch({schemaName: node.parent!.parent!.name, patchName: node.name}, node.tree.isPublic)
        return patchMeta

    } catch (error) {
        console.error('Set patch failed: ', error)
        return null
    }
}