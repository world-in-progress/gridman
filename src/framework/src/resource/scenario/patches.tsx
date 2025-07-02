import { FileType2 } from 'lucide-react'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { Tab } from '@/components/tabBar/types'

export class PatchesPageContext extends DefaultPageContext {
    name: string
    bounds: number[]
    description?: string;
    starred: boolean;

    constructor() {
        super()

        this.name = ''
        this.bounds = []
        this.description = ''
        this.starred = false
    }
}

export default class PatchesScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.patches'
    semanticPath: string = 'root.topo.schemas.schema.patches'
    children: string[] = [
        'patch',
    ]

    renderContextMenu(nodeSelf: ISceneNode, tree: ISceneTree, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf)}>
                    <FileType2 className='w-4 h-4 ml-2' />Create New Patch
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleDropDownMenuOpen(nodeSelf: ISceneNode): void {
        // console.log('Create new patch')
        (nodeSelf as SceneNode).tab = {
            name: (nodeSelf.tree.isRemote ? 'public' : 'private') + ': ' + nodeSelf.name,
            path: nodeSelf.key,
            isActive: true,
            isPreview: false
        } as Tab

        (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf)
    }
}