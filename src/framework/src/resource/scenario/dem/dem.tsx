import DefaultPageContext from "@/core/context/default";
import { ISceneNode } from "@/core/scene/iscene"
import DefaultScenarioNode from "@/core/scenario/default";
import { Delete, FilePlus2, Info } from "lucide-react"

import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import { RasterMeta, UpdateRasterData, UpdateRasterMeta } from "@/core/apis/types";
import store from "@/store";
import DemPage from "./demPage";
import * as apis from '@/core/apis/apis'
import DemInformation from "./demInformation";
import { toast } from "sonner";
import { VectorLayer } from "../lum/lum";

export interface Vectordata {
    name: string,
    type: string,
    color: string,
    epsg: string,
    feature_json: GeoJSON.FeatureCollection
}


export class DemPageContext extends DefaultPageContext {

    uploadVectors: {
        node_key: string
        data: Vectordata
        visible: boolean
        updateRasterData: UpdateRasterData
    }[]
    updateRasterMeta: UpdateRasterMeta
    demInfo: RasterMeta['data'] | null
    rasterOpacity: number
    vectorLayers: VectorLayer[]

    constructor() {
        super()

        this.uploadVectors = []
        this.updateRasterMeta = {
            updates: []
        }
        this.demInfo = null
        this.rasterOpacity = 0.8
        this.vectorLayers = []
    }

    static async create(node: ISceneNode): Promise<DemPageContext> {
        const n = node as SceneNode
        const context = new DemPageContext()

        try {
            const rasterInfo = (await apis.raster.getRasterMetaData.fetch(node.key, node.tree.isPublic))
            context.demInfo = rasterInfo.data
        } catch (error) {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            console.error('Process DEM data failed:', error)
        }

        return context
    }
}

export enum DemMenuItem {
    DEM_INFORMATION = 'DEM Information',
    DEM_EDIT = 'Edit this DEM',
    DELETE_THIS_DEM = 'Delete this DEM'
}

export default class DemScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.dems.dem'
    semanticPath: string = 'root.dems.dem'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, DemMenuItem.DEM_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, DemMenuItem.DEM_EDIT)}>
                    <FilePlus2 className='w-4 h-4' />Edit this DEM
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, DemMenuItem.DELETE_THIS_DEM) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete this DEM</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case DemMenuItem.DEM_EDIT:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case DemMenuItem.DEM_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case DemMenuItem.DELETE_THIS_DEM:
                {
                    store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    const deleteResponse = await apis.raster.deleteRaster.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
                    store.get<{ on: Function, off: Function }>('isLoading')!.off()
                    if (deleteResponse.success) {
                        await (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                        toast.success(deleteResponse.message)
                    } else {
                        toast.error(deleteResponse.message)
                    }
                    break
                }
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {

        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<DemPage node={nodeSelf} />)
            case 'information':
                return (<DemInformation />)
            default:
                return (<DemPage node={nodeSelf} />)
        }
    }
}