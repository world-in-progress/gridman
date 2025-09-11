import store from '@/store'
import { toast } from 'sonner'
import GatePage from './gatePage'
import * as apis from '@/core/apis/apis'
import GateInformation from './gateInformation'
import { ISceneNode } from '@/core/scene/iscene'
import { Delete, FilePlus2, Info } from 'lucide-react'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'

export class GatePageContext extends DefaultPageContext {
    constructor() {
        super()
    }

    static async create(node: ISceneNode): Promise<GatePageContext> {
        return new GatePageContext()
    }
}

export enum GateMenuItem {
    GATE_INFORMATION = 'Gate Information',
    CHECK_THIS_GATE = 'Check This Gate',
    DELETE_THIS_GATE = 'Delete This Gate'
}

export default class GateScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.gates.gate'
    semanticPath: string = 'root.gates.gate'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GateMenuItem.GATE_INFORMATION)}>
                    <Info className='w-4 h-4' />Gate Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GateMenuItem.CHECK_THIS_GATE)}>
                    <FilePlus2 className='w-4 h-4' />Check This Gate
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => handleContextMenu(nodeSelf, GateMenuItem.DELETE_THIS_GATE)}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete This Gate</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case GateMenuItem.CHECK_THIS_GATE:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case GateMenuItem.GATE_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case GateMenuItem.DELETE_THIS_GATE:
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                const deleteResponse = await apis.common.deleteCommonData.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                if (deleteResponse.success) {
                    await (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                    toast.success(deleteResponse.message)
                } else {
                    toast.error(deleteResponse.message)
                }
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<GatePage node={nodeSelf} />)
            case 'information':
                return (<GateInformation />)
            default:
                return null
        }
    }
}