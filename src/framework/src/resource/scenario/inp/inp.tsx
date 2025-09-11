import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import * as apis from '@/core/apis/apis'
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { Delete, FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import InpPage from "./inpPage"
import InpInformation from "./inpInformation"
import store from "@/store"
import { CommonDataProps } from "../rainfall/rainfall"
import { toast } from "sonner"

export class InpPageContext extends DefaultPageContext {

    inpData: CommonDataProps
    inpOpacity: number

    constructor() {
        super()
        this.inpData = {
            name: '',
            type: '',
            data: []
        }
        this.inpOpacity = 1

    }

    static async create(node: ISceneNode): Promise<InpPageContext> {

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const inpData = await apis.common.getCommonData.fetch(node.key, node.tree.isPublic)

        const context = new InpPageContext()

        context.inpData = {
            name: inpData.data.name,
            type: inpData.data.type,
            data: inpData.data.data
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        return context
    }
}

export enum InpMenuItem {
    INP_INFORMATION = 'Inp Information',
    CHECK_THIS_INP = 'Check This Inp',
    DELETE_THIS_INP = 'Delete This Inp'
}

export default class InpScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.inps.inp'
    semanticPath: string = 'root.inps.inp'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, InpMenuItem.INP_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, InpMenuItem.CHECK_THIS_INP)}>
                    <FilePlus2 className='w-4 h-4' />Check This Inp
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, InpMenuItem.DELETE_THIS_INP) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete This Inp</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case InpMenuItem.CHECK_THIS_INP:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case InpMenuItem.INP_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case InpMenuItem.DELETE_THIS_INP:
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                const deleteResponse = await apis.common.deleteCommonData.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                if (deleteResponse.success) {
                    await(nodeSelf.tree as SceneTree).removeNode(nodeSelf)
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
                return (<InpPage node={nodeSelf} />)
            case 'information':
                return (<InpInformation />)
            default:
                return (<InpPage node={nodeSelf} />)
        }
    }
}