import { Delete, FilePlus2 } from 'lucide-react'
import { SchemaInfo } from './types'
import SchemaPage from './schemaPage'
import { deleteSchema, getSchemaInfo } from './util'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import { toast } from 'sonner'

export class SchemaPageContext extends DefaultPageContext {
    schema: SchemaInfo | null

    constructor() {
        super()
        this.schema = null
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
            <ContextMenuContent className=''>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SchemaMenuItem.CHECK_INFO)}>
                    <FilePlus2 className='w-4 h-4' />Check Info
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SchemaMenuItem.DELETE)}>
                    <Delete className='w-4 h-4' />Delete
                    
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
                const response = await deleteSchema(nodeSelf.name, nodeSelf.tree.isPublic)
                if (response) {
                    toast.success(`Schema ${nodeSelf.name} deleted successfully`)
                    const parent = nodeSelf.parent!
                    await parent.tree.alignNodeInfo(parent, true)
                    const tree = parent.tree as SceneTree
                    if (nodeSelf.pageContext !== undefined) {
                        await tree.stopEditingNode(nodeSelf as SceneNode)
                    }
                    tree.notifyDomUpdate()
                } else {
                    toast.error(`Failed to delete schema ${nodeSelf.name}`)
                }
                break
            }
        }
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return (
            <SchemaPage node={nodeSelf} />
        )
    }
}