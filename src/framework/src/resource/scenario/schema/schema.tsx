import { toast } from 'sonner'
import { SchemaInfo } from './types'
import SchemaPage from './schemaPage'
import { ISceneNode } from '@/core/scene/iscene'
import { Delete, FilePlus2, Info } from 'lucide-react'
import { deleteSchema, getSchemaInfo } from './utils'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

export class SchemaPageContext extends DefaultPageContext {
    schema: SchemaInfo | null
    isEditing: boolean

    constructor() {
        super()
        this.schema = null
        this.isEditing = false
    }

    static async create(node: ISceneNode): Promise<SchemaPageContext> {
        const n = node as SceneNode
        const context = new SchemaPageContext()

        try {
            const schema = await getSchemaInfo(n, n.tree.isPublic)
            context.schema = schema
        } catch (error) {
            console.error('Process schema info failed:', error)
        }

        return context
    }
}

export enum SchemaMenuItem {
    CHECK_INFO = 'Check Info',
    DELETE = 'Delete',
}

export default class SchemaScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema'
    semanticPath: string = 'root.topo.schemas.schema'
    children: string[] = [
        'patches',
        'grids',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SchemaMenuItem.CHECK_INFO)}>
                    <Info className='w-4 h-4' />
                    <span>Check Info</span>
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => handleContextMenu(nodeSelf, SchemaMenuItem.DELETE)}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case SchemaMenuItem.CHECK_INFO:
                (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SchemaMenuItem.DELETE: {
                // TODO: add second confirm dialog
                const response = await deleteSchema(nodeSelf.name, nodeSelf.tree.isPublic)
                if (response) {
                    toast.success(`Schema ${nodeSelf.name} deleted successfully`)
                    await (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                } else {
                    toast.error(`Failed to delete schema ${nodeSelf.name}`)
                }
                break
            }
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        return (
            <SchemaPage node={nodeSelf} />
        )
    }
}