import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import RainfallsPage from "./rainfallsPage"
import RainfallsInformation from "./rainfallsInformation"
import { CommonDataProps } from "../rainfall/rainfall"


export class RainfallsPageContext extends DefaultPageContext {
    rainfallMeta: {
        name: string
        type: string
        src_path: string
    }
    hasRainfall: boolean
    rainfallData: CommonDataProps

    constructor() {
        super()

        this.rainfallMeta = {
            name: '',
            type: 'rainfall',
            src_path: ''
        }
        this.hasRainfall = false
        this.rainfallData = {
            name: '',
            type: '',
            data: []
        }
    }

    static async create(node: ISceneNode): Promise<RainfallsPageContext> {
        return new RainfallsPageContext()
    }
}

export enum RainfallsMenuItem {
    RAINFALL_INFORMATION = 'Rainfall Information',
    CREATE_NEW_RAINFALL = 'Create New Rainfall',
}

export default class RainfallsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.rainfalls'
    semanticPath: string = 'root.rainfalls'
    children: string[] = [
        'rainfall'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, RainfallsMenuItem.RAINFALL_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, RainfallsMenuItem.CREATE_NEW_RAINFALL)}>
                    <FilePlus2 className='w-4 h-4' />Create New Rainfall
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case RainfallsMenuItem.CREATE_NEW_RAINFALL:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case RainfallsMenuItem.RAINFALL_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<RainfallsPage node={nodeSelf} />)
            case 'information':
                return (<RainfallsInformation />)
            default:
                return (<RainfallsPage node={nodeSelf} />)
        }
    }
}