import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import InpsPage from "./inpsPage"
import InpsInformation from "./inpsInformation"
import { CommonDataProps } from "../rainfall/rainfall"

export class InpsPageContext extends DefaultPageContext {
    inpMeta: {
        name: string
        type: string
        src_path: string
    }
    hasInp: boolean
    inpData: string | null

    constructor() {
        super()

        this.inpMeta = {
            name: '',
            type: 'inp',
            src_path: ''
        }
        this.hasInp = false
        this.inpData = null
    }

    static async create(node: ISceneNode): Promise<InpsPageContext> {
        return new InpsPageContext()
    }
}

export enum InpsMenuItem {
    INP_INFORMATION = 'Inp Information',
    CREATE_NEW_INP = 'Create New Inp'
}

export default class InpsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.inps'
    semanticPath: string = 'root.inps'
    children: string[] = [
        'inp'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, InpsMenuItem.INP_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, InpsMenuItem.CREATE_NEW_INP)}>
                    <FilePlus2 className='w-4 h-4' />Create New Inp
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case InpsMenuItem.CREATE_NEW_INP:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case InpsMenuItem.INP_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<InpsPage node={nodeSelf} />)
            case 'information':
                return (<InpsInformation />)
            default:
                return (<InpsPage node={nodeSelf} />)
        }
    }
} 