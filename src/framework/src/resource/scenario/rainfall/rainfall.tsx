import store from "@/store"
import { toast } from "sonner"
import * as apis from '@/core/apis/apis'
import RainfallPage from "./rainfallPage";
import { ISceneNode } from "@/core/scene/iscene";
import RainfallInformation from "./rainfallInformation";
import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { CloudRainWind, Delete, Info } from "lucide-react";
import MapContainer from "@/components/mapContainer/mapContainer";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";

export interface CommonDataProps {
    name: string,
    type: string,
    data: any
}

export class RainfallPageContext extends DefaultPageContext {
    rainfallData: CommonDataProps
    constructor() {
        super()
        this.rainfallData = {
            name: '',
            type: '',
            data: []
        }
    }

    static async create(node: ISceneNode): Promise<RainfallPageContext> {

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const rainfallData = await apis.common.getCommonData.fetch(node.key, node.tree.isPublic)

        const context = new RainfallPageContext()
        context.rainfallData = {
            name: rainfallData.data.name,
            type: rainfallData.data.type,
            data: rainfallData.data.data
        }

        return context
    }
}

export enum RainfallMenuItem {
    RAINFALL_INFORMATION = 'Rainfall Information',
    CHECK_RAINFALL_DATA = 'Check Rainfall Data',
    DELETE_THIS_RAINFALL = 'Delete This Rainfall'
}

export default class RainfallScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.rainfalls.rainfall'
    semanticPath: string = 'root.rainfalls.rainfall'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, RainfallMenuItem.RAINFALL_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, RainfallMenuItem.CHECK_RAINFALL_DATA)}>
                    <CloudRainWind className='w-4 h-4' />Check Rainfall Data
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => handleContextMenu(nodeSelf, RainfallMenuItem.DELETE_THIS_RAINFALL)}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete This Rainfall</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case RainfallMenuItem.RAINFALL_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case RainfallMenuItem.CHECK_RAINFALL_DATA:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case RainfallMenuItem.DELETE_THIS_RAINFALL:
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                const deleteResponse = await apis.common.deleteCommonData.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
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

    renderPage(nodeSelf: ISceneNode, menuItem: any, mapContainer?: typeof MapContainer): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<RainfallPage node={nodeSelf} />)
            case 'information':
                return (<RainfallInformation />)
            default:
                return (<RainfallPage node={nodeSelf} />)
        }
    }
}