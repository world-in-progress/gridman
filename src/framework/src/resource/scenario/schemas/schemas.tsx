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

    serialize(): any {
        return {
            name: this.name,
            epsg: this.epsg,
            description: this.description,
            basePoint: this.basePoint,
            gridLayers: this.gridLayers,
        }
    }

    static deserialize(input: any): SchemasPageContext {
        const context = new SchemasPageContext()
        context.name = input.name
        context.epsg = input.epsg
        context.description = input.description
        context.basePoint = input.basePoint
        context.gridLayers = input.gridLayers
        return context
    }
}

export enum SchemasMenuItem {
    CREATE_NEW_SCHEMA = 'Create New Schema',
}

export default class SchemasScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas'
    semanticPath: string = 'root.topo.schemas'
    children: string[] = [
        'schema',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, SchemasMenuItem.CREATE_NEW_SCHEMA) }}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Create New Schema
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SchemasMenuItem.CREATE_NEW_SCHEMA:
                (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return (
            <SchemasPage node={nodeSelf} />
        )
    }
}