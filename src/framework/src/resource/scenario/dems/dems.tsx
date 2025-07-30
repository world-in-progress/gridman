import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene"

import { FilePlus2, Info } from 'lucide-react'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import DemsPage from "./demsPage";
import DemsInformation from "./demsInformation";

export class DemsPageContext extends DefaultPageContext {

    constructor() {
        super()
    }

    static async create(node: ISceneNode): Promise<DemsPageContext> {
        return new DemsPageContext()
    }
}

export enum DemsMenuItem {
    DEMS_INFORMATION = 'Dems Information',
    DEM_EDIT = 'Create New DEM'
}

export default class DemsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.dems'
    semanticPath: string = 'root.dems'
    children: string[] = [
        'dem'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, DemsMenuItem.DEMS_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, DemsMenuItem.DEM_EDIT)}>
                    <FilePlus2 className='w-4 h-4' />Create New DEM
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case DemsMenuItem.DEM_EDIT:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case DemsMenuItem.DEMS_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {

        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<DemsPage node={nodeSelf} />)
            case 'information':
                return (<DemsInformation />)
            default:
                return (<DemsPage node={nodeSelf} />)
        }
    }
}