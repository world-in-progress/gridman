import { FileType2 } from 'lucide-react'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import DefaultScenarioNode from '@/resource/scenario/default'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

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

    handleDropDownMenuOpen(nodeSelf: ISceneNode, tree: ISceneTree): void {
        console.log('Create new patch')
    }
}