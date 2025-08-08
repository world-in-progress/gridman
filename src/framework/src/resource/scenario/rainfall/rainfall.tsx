import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import { CloudRainWind, Info } from "lucide-react";
import RainfallPage from "./rainfallPage";
import MapContainer from "@/components/mapContainer/mapContainer";
import RainfallInformation from "./rainfallInformation";
import * as apis from '@/core/apis/apis'
import store from "@/store";

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
    CHECK_RAINFALL_DATA = 'Check Rainfall Data'
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
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
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