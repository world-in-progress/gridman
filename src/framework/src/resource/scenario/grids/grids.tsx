import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import {  FilePlus2, Info } from 'lucide-react'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import GridsPage from "./gridsPage";
import GridsInformation from "./gridsInformation";

export class GridsPageContext extends DefaultPageContext {
    schemaName: string
    selectedResources: string[]

    constructor() {
        super()

        this.schemaName = ''
        this.selectedResources = []
    }

    static async create(node: ISceneNode): Promise<GridsPageContext> {
        const n = node as SceneNode
        const schemaName = n.parent!.name
        const context = new GridsPageContext()
        context.schemaName = schemaName!
        
        return context
    }
}

export enum GridsMenuItem {
    GRIDS_INFORMATION = 'Grids Information',
    CREATE_NEW_GRID = 'Create New Grid'
}

export default class GridsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.grids'
    semanticPath: string = 'root.topo.schemas.schema.grids'
    children: string[] = [
        'grid'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GridsMenuItem.GRIDS_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GridsMenuItem.CREATE_NEW_GRID)}>
                    <FilePlus2 className='w-4 h-4' />Create New Grid
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case GridsMenuItem.CREATE_NEW_GRID:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case GridsMenuItem.GRIDS_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<GridsPage node={nodeSelf} />)
            case 'information':
                return (<GridsInformation />)
            default:
                return (<GridsPage node={nodeSelf} />)
        }
    }
}