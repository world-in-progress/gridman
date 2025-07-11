import { deletepatch, getPatchInfo } from "./util"
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import { ISceneNode } from "@/core/scene/iscene"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { Delete, Grid3x3, Info } from "lucide-react"
import { toast } from "sonner"
import TopologyEditor from "./topologyEditor"
import PatchInfo from "./patchInfo"
import { GridMeta } from "@/core/apis/types"

export class PatchPageContext extends DefaultPageContext {
    patch: GridMeta | null

    constructor() {
        super()
        this.patch = null
    }

    static async create(node: ISceneNode): Promise<PatchPageContext> {
        const n = node as SceneNode
        const context = new PatchPageContext()

        try {
            const patch = await getPatchInfo(n, n.tree.isPublic)
            context.patch = patch
        } catch (error) {
            console.error('Process patch info failed: ', error)
        }

        return context
    }
}

export enum PatchMenuItem {
    CHECK_INFO = 'Check Info',
    TOPOLOGY_EDITOR = 'Topology Editor',
    DELETE = 'Delete'
}

export default class PatchScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.patches.patch'
    semanticPath: string = 'root.topo.schemas.schema.patches.patch'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, PatchMenuItem.CHECK_INFO)}>
                    <Info className="w-4 h-4" />
                    <span>Check Info</span>
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, PatchMenuItem.TOPOLOGY_EDITOR)}>
                    <Grid3x3 className="w-4 h-4" />
                    <span>Topology Editor</span>
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => handleContextMenu(nodeSelf, PatchMenuItem.DELETE)}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case PatchMenuItem.CHECK_INFO:
                (nodeSelf as SceneNode).pageId = 'checkInfo'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case PatchMenuItem.TOPOLOGY_EDITOR:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case PatchMenuItem.DELETE: {
                const response = await deletepatch(nodeSelf as SceneNode, nodeSelf.tree.isPublic)
                if (response) {
                    toast.success(`Patch ${nodeSelf.name} deleted successfully`)
                    await (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                } else {
                    toast.error(`Failed to delete patch ${nodeSelf.name}`)
                }
            }
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (
                    <TopologyEditor node={nodeSelf} />
                )
            case 'checkInfo':
                return (
                    <PatchInfo node={nodeSelf} />
                )
            default:
                return (
                    <TopologyEditor node={nodeSelf} />
                )
        }
    }
}