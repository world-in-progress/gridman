import { FilePlus2 } from 'lucide-react'
import { Tab } from '@/components/tabBar/types'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

export class SchemasPageContext extends DefaultPageContext {
    name: string
    epsg: number
    starred: boolean
    description: string
    base_point: number[]
    grid_info: number[][]

    constructor() {
        super()
        
        this.name = ''
        this.epsg = 0
        this.starred = false
        this.description = ''
        this.base_point = []
        this.grid_info = []
    }
}

export default class SchemasScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas'
    semanticPath: string = 'root.topo.schemas'
    children: string[] = [
        'schema',
    ]

    renderContextMenu(nodeSelf: ISceneNode, tree: ISceneTree, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf)}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Create New Schema
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleDropDownMenuOpen(nodeSelf: ISceneNode): void {
        const _node = nodeSelf as SceneNode
        const _tree = nodeSelf.tree as SceneTree

        _node.tab.isActive = true
        _tree.startEditingNode(_node)
    }
}