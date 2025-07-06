import { GridLayerInfo } from './types'
import SchemasPage from './schemasPage'
import { FilePlus2 } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'

export class SchemasPageContext extends DefaultPageContext {
    name: string
    epsg: number | null
    description: string
    gridLayers: GridLayerInfo[]
    basePoint: [number | null, number | null]

    constructor() {
        super()
        this.name = ''
        this.epsg = null
        this.description = ''
        this.basePoint = [null, null]
        this.gridLayers = []
    }

    static async create(): Promise<SchemasPageContext> {
        return new SchemasPageContext()
    }
}

export default class SchemasScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas'
    semanticPath: string = 'root.topo.schemas'
    children: string[] = [
        'schema',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf); this.handleMenuOpen(nodeSelf) }}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Create New Schema
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode): void {
        (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return (
            <SchemasPage node={nodeSelf} />
        )
    }
}