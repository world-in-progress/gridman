import { FilePlus, FilePlus2, FileType2, Info, SquaresIntersect } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import PatchesPage from './patchesPage'
import { SchemaInfo } from '../schema/types'
import { getSchemaInfo } from '../schema/utils'
import PatchesInformation from './patchInformation'

export class PatchesPageContext extends DefaultPageContext {
    name: string
    description: string
    originBounds: [number, number, number, number] | null       // EPSG: 4326
    adjustedBounds: [number, number, number, number] | null     // EPSG: 4326
    inputBounds: [number, number, number, number] | null        // EPSG: schema
    schema: SchemaInfo | null
    widthCount: number
    heightCount: number
    hasBounds: boolean

    constructor() {
        super()

        this.name = ''
        this.originBounds = null
        this.adjustedBounds = null
        this.inputBounds = null
        this.description = ''
        this.schema = null
        this.widthCount = 0
        this.heightCount = 0
        this.hasBounds = false
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
    PATCH_INFORMATION = 'Patch Information',
}

export default class PatchesScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.patches'
    semanticPath: string = 'root.topo.schemas.schema.patches'
    children: string[] = [
        'patch',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, PatchesMenuItem.PATCH_INFORMATION)}>
                    <FileType2 className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, PatchesMenuItem.CREATE_NEW_PATCH)}>
                    <SquaresIntersect className='w-4 h-4' />Create New Patch
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case PatchesMenuItem.CREATE_NEW_PATCH:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case PatchesMenuItem.PATCH_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<PatchesPage node={nodeSelf} />)
            case 'information':
                return (<PatchesInformation node={nodeSelf} />)
            default:
                return (<PatchesPage node={nodeSelf} />)
        }
    }
}