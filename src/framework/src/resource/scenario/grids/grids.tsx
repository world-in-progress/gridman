import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import { FilePlus2, Info, SquaresUnite } from 'lucide-react'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import GridsPage from "./gridsPage";
import GridsInformation from "./gridsInformation";
import * as apis from '@/core/apis/apis'
import { GridSchema } from "@/core/apis/types";

export class GridsPageContext extends DefaultPageContext {
    schema: GridSchema
    gridName: string
    gridBounds: [number, number, number, number] | null
    selectedResources: string[]
    patchesBounds: Record<string, [number, number, number, number]>

    constructor() {
        super()

        this.schema = {
            name: '',
            epsg: 0,
            starred: false,
            description: '',
            base_point: [0, 0],
            grid_info: []
        }
        this.gridName = ''
        this.selectedResources = []
        this.gridBounds = null
        this.patchesBounds = {}
    }

    static async create(node: ISceneNode): Promise<GridsPageContext> {
        const n = node as SceneNode
        const schemaName = n.parent!.name
        const res = await apis.schema.getSchema.fetch(schemaName!, n.tree.isPublic)
        const context = new GridsPageContext()
        context.schema = res.grid_schema!

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
                    <SquaresUnite className='w-4 h-4' />Create New Grid
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