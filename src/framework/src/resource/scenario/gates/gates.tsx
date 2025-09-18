import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import GatesPage from "./gatesPage"
import GatesInformation from "./gatesInformation"

export class GatesPageContext extends DefaultPageContext {
    gateData: {
        name: string | null
        type: string
        src_path: string | null
    }

    constructor() {
        super()

        this.gateData = {
            name: null,
            type: 'gate',
            src_path: null,
        }
    }

    static async create(node: ISceneNode): Promise<GatesPageContext> {
        return new GatesPageContext()
    }
}

export enum GatesMenuItem {
    GATE_INFORMATION = 'Gate Information',
    CREATE_NEW_GATE = 'Create New Gate'
}

export default class GatesScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.gates'
    semanticPath: string = 'root.gates'
    children: string[] = [
        'gate'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GatesMenuItem.GATE_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, GatesMenuItem.CREATE_NEW_GATE)}>
                    <FilePlus2 className='w-4 h-4' />Create New Gate
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case GatesMenuItem.CREATE_NEW_GATE:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case GatesMenuItem.GATE_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<GatesPage node={nodeSelf} />)
            case 'information':
                return (<GatesInformation />)
            default:
                return (<GatesPage node={nodeSelf} />)
        }
    }
}
