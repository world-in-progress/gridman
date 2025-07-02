import { FilePlus2 } from 'lucide-react'
import DefaultScenarioNode from '@/resource/scenario/default'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

export default class SchemaScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema'
    semanticPath: string = 'root.topo.schemas.schema'
    children: string[] = [
        'patches',
        'grids',
    ]

    renderContextMenu(nodeSelf: ISceneNode, tree: ISceneTree, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf)}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Check Schema Info
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleDropDownMenuOpen(nodeSelf: ISceneNode): void {
        console.log('Check Schema Info')
    }
}