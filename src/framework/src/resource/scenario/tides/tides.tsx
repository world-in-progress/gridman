import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import TidesPage from "./tidesPage"
import TidesInformation from "./tidesInformation"
import { CommonDataProps } from "../rainfall/rainfall"

export class TidesPageContext extends DefaultPageContext {
    tideMeta: {
        name: string
        type: string
        src_path: string
    }
    hasTide: boolean
    tideData: CommonDataProps
    

    constructor() {
        super()
        
        this.tideMeta = {
            name: '',
            type: 'tide',
            src_path: ''
        }
        this.hasTide = false
        this.tideData = {
            name: '',
            type: '',
            data: []
        }
    }

    static async create(node: ISceneNode): Promise<TidesPageContext> {
        return new TidesPageContext()
    }
}

export enum TidesMenuItem {
    TIDE_INFORMATION = 'Tide Information',
    CREATE_NEW_TIDE = 'Create New Tide'
}

export default class TidesScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.tides'
    semanticPath: string = 'root.tides'
    children: string[] = [
        'tide'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, TidesMenuItem.TIDE_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, TidesMenuItem.CREATE_NEW_TIDE)}>
                    <FilePlus2 className='w-4 h-4' />Create New Tide
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case TidesMenuItem.CREATE_NEW_TIDE:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case TidesMenuItem.TIDE_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<TidesPage node={nodeSelf} />)
            case 'information':
                return (<TidesInformation />)
            default:
                return (<TidesPage node={nodeSelf} />)
        }
    }
} 