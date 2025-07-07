import { FilePlus2 } from 'lucide-react'
import { SchemaInfo } from './types'
import SchemaPage from './schemaPage'
import { getSchemaInfo } from './util'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'

export class SchemaPageContext extends DefaultPageContext {
    schema: SchemaInfo | null

    constructor() {
        super()
        this.schema = null
    }
}

export default class SchemaScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema'
    semanticPath: string = 'root.topo.schemas.schema'
    children: string[] = [
        'patches',
        'grids',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf)}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Check Schema Info
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode): void {
        console.log('Check Schema Info')
        
        getSchemaInfo(nodeSelf as SceneNode, nodeSelf.tree.isPublic)
            .then(schema => {
                (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                console.log(nodeSelf.name, '的信息:', schema)
            })
            .catch(error => {
                console.error('处理schema信息失败:', error)
            })
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return (
            <SchemaPage node={nodeSelf} />
        )
    }
}