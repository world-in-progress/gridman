import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Delete, FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import LumInformation from "./lumInformation"
import LumPage from "./lumPage"
import * as apis from '@/core/apis/apis'
import { RasterMeta, UpdateRasterData, UpdateRasterMeta } from "@/core/apis/types";
import store from "@/store";
import { toast } from "sonner";

export interface Vectordata {
    name: string,
    type: string,
    color: string,
    epsg: string,
    feature_json: GeoJSON.FeatureCollection
}

export interface VectorLayer {
    id: string
    source: string
    data: GeoJSON.FeatureCollection
    paint: {
        'fill-outline-color': string
        'fill-color': string
        'fill-opacity': number
    }
}

export class LumPageContext extends DefaultPageContext {

    uploadVectors: {
        node_key: string
        data: Vectordata
        visible: boolean
        updateRasterData: UpdateRasterData
    }[]
    updateRasterMeta: UpdateRasterMeta
    lumInfo: RasterMeta['data'] | null
    rasterOpacity: number
    vectorLayers: VectorLayer[]

    constructor() {
        super()

        this.uploadVectors = []
        this.updateRasterMeta = {
            updates: []
        }
        this.lumInfo = null
        this.rasterOpacity = 0.8
        this.vectorLayers = []
    }

    static async create(node: ISceneNode): Promise<LumPageContext> {
        const n = node as SceneNode
        const context = new LumPageContext()

        try {
            const rasterInfo = (await apis.raster.getRasterMetaData.fetch(node.key, node.tree.isPublic))
            const lumInfo = rasterInfo.data
            context.lumInfo = lumInfo
        } catch (error) {
            console.error('Process lum data failed:', error)
        }

        return context
    }
}

export enum LumMenuItem {
    LUM_INFORMATION = 'LUM Information',
    EDIT_THIS_LUM = 'Edit this LUM',
    DELETE_THIS_LUM = 'Delete this LUM'
}

export default class LumScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.lums.lum'
    semanticPath: string = 'root.lums.lum'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumMenuItem.LUM_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumMenuItem.EDIT_THIS_LUM)}>
                    <FilePlus2 className='w-4 h-4' />Edit this LUM
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, LumMenuItem.DELETE_THIS_LUM) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete this vector</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case LumMenuItem.EDIT_THIS_LUM:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case LumMenuItem.LUM_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case LumMenuItem.DELETE_THIS_LUM:
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

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {

        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<LumPage node={nodeSelf} />)
            case 'information':
                return (<LumInformation />)
            default:
                return (<LumPage node={nodeSelf} />)
        }
    }
}