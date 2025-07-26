import DefaultPageContext from "@/core/context/default";
import { ISceneNode } from "@/core/scene/iscene"
import DefaultScenarioNode from "@/core/scenario/default";
import { FilePlus2, Info } from "lucide-react"

import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import store from "@/store";
import DemPage from "./demPage";
import DemInformation from "./demInformation";

export class DemPageContext extends DefaultPageContext {
    constructor() {
        super()
    }

    static async create(node: ISceneNode): Promise<DemPageContext> {
        return new DemPageContext()
    }
}

export enum DemMenuItem {
    DEM_INFORMATION = 'DEM Information',
    DEM_EDIT = 'Edit this DEM'
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
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case DemMenuItem.DEM_EDIT:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case DemMenuItem.DEM_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
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