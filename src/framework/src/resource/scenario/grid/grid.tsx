import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { Delete, FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import * as apis from '@/core/apis/apis'
import store from "@/store"
import { toast } from "sonner"
import GridPage from "./gridPage"
import GridInformation from "./gridInformation"


export class GridPageContext extends DefaultPageContext {
    constructor() {
        super()
    }

    static async create(node: ISceneNode): Promise<GridPageContext> {
        return new GridPageContext()
    }
}

export enum GridMenuItem {
    GRID_INFORMATION = 'Grid Information',
    DELETE_THIS_GRID = 'Delete This Grid'
}

export default class GridScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.grids.grid'
    semanticPath: string = 'root.topo.schemas.schema.grids.grid'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GridMenuItem.GRID_INFORMATION)}>
                    <Info className='w-4 h-4' />Grid Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, GridMenuItem.DELETE_THIS_GRID) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete this grid</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case GridMenuItem.GRID_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case GridMenuItem.DELETE_THIS_GRID:
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                const deleteResponse = await apis.grids.deleteGrid.fetch({ schemaName: nodeSelf.parent!.parent!.name, gridName: nodeSelf.name }, nodeSelf.tree.isPublic)
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                if (deleteResponse.success) {
                    toast.success('Grid deleted successfully')
                        ; (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                } else {
                    toast.error('Failed to delete grid')
                }
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<GridPage node={nodeSelf} />)
            case 'information':
                return (<GridInformation />)
            default:
                return (<GridPage node={nodeSelf} />)
        }
    }
}