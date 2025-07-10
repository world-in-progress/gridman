import { FileType2 } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import PatchesPage from './patchesPage'
import { SchemaInfo } from '../schema/types'
import { getSchemaInfo } from '../schema/util'

export class PatchesPageContext extends DefaultPageContext {
    name: string
    description: string
    originBounds: [number, number, number, number] | null       // EPSG: 4326
    adjustedBounds: [number, number, number, number] | null     // EPSG: 4326
    inputBounds: [number, number, number, number] | null        // EPSG: schema
    starred: boolean 
    schema: SchemaInfo | null
    widthCount: number
    heightCount: number 

    constructor() {
        super()

        this.name = ''
        this.originBounds = null
        this.adjustedBounds = null
        this.inputBounds = null
        this.starred = false
        this.description = ''
        this.schema = null
        this.widthCount = 0
        this.heightCount = 0
    }

    static async create(node: ISceneNode): Promise<PatchesPageContext> {
        const n = node as SceneNode
        const context = new PatchesPageContext()

        try {
            const schema = await getSchemaInfo(n.parent as SceneNode, n.tree.isPublic)
            context.schema = schema
        } catch (error) {
            console.error('Process schema info failed:', error)
        }
        return context
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