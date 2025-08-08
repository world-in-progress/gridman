import DefaultPageContext from "@/core/context/default";
import { CommonDataProps } from "../rainfall/rainfall";
import { ISceneNode } from "@/core/scene/iscene"
import * as apis from '@/core/apis/apis'
import store from "@/store";
import DefaultScenarioNode from "@/core/scenario/default";
import { Info, Waves } from "lucide-react";
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import TidePage from "./tidePage";
import TideInformation from "./tideInformation";

export class TidePageContext extends DefaultPageContext {
    tideData: CommonDataProps
    constructor() {
        super()
        this.tideData = {
            name: '',
            type: '',
            data: []
        }
    }

    static async create(node: ISceneNode): Promise<TidePageContext> {

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const tideData = await apis.common.getCommonData.fetch(node.key, node.tree.isPublic)

        const context = new TidePageContext()

        context.tideData = {
            name: tideData.data.name,
            type: tideData.data.type,
            data: tideData.data.data
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        return context
    }
}

export enum TideMenuItem {
    TIDE_INFORMATION = 'Tide Information',
    CHECK_TIDE_DATA = 'Check Tide Data'
}

export default class TideScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.tides.tide'
    semanticPath: string = 'root.tides.tide'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, TideMenuItem.TIDE_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, TideMenuItem.CHECK_TIDE_DATA)}>
                    <Waves className='w-4 h-4' />Check Tide Data
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case TideMenuItem.TIDE_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case TideMenuItem.CHECK_TIDE_DATA:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return <TidePage node={nodeSelf as SceneNode} />
            case 'information':
                return <TideInformation />
            default:
                return <TidePage node={nodeSelf as SceneNode} />
        }
    }
}