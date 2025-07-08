import { FileType2 } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import PatchesPage from './patchesPage'

export class PatchesPageContext extends DefaultPageContext {
    name: string
    bounds: number[]
    starred: boolean
    description: string

    constructor() {
        super()

        this.name = ''
        this.bounds = []
        this.starred = false
        this.description = ''
    }

    static async create(): Promise<PatchesPageContext> {
        return new PatchesPageContext()
    }
}

export enum PatchesMenuItem {
    CREATE_NEW_PATCH = 'Create New Patch',
}

export default class PatchesScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.patches'
    semanticPath: string = 'root.topo.schemas.schema.patches'
    children: string[] = [
        'patch',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, PatchesMenuItem.CREATE_NEW_PATCH)}>
                    <FileType2 className='w-4 h-4 ml-2' />Create New Patch
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        // const _node = nodeSelf as SceneNode
        // const _tree = nodeSelf.tree as SceneTree

        // _tree.startEditingNode(_node)
        switch (menuItem) {
            case PatchesMenuItem.CREATE_NEW_PATCH:
                (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
        }
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return (
            <PatchesPage node={nodeSelf} />
        )
    }
}