import { GridLayerInfo } from './types'
import SchemasPage from './schemasPage'
import SchemasInformation from './nodeInfomation'
import { FilePlus2, Info, MapPinPlus } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

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
    Node_INFORMATION = 'Node Information',
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
            <ContextMenuContent >
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, SchemasMenuItem.Node_INFORMATION) }}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, SchemasMenuItem.CREATE_NEW_SCHEMA) }}>
                    <MapPinPlus className='w-4 h-4' />Create New Schema
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SchemasMenuItem.CREATE_NEW_SCHEMA:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SchemasMenuItem.Node_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<SchemasPage node={nodeSelf} />)
            case 'information':
                return (<SchemasInformation node={nodeSelf} />)
            default:
                return (<SchemasPage node={nodeSelf} />)
        }
    }
}