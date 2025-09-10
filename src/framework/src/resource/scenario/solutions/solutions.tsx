import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info, Wrench } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import SolutionsPage from "./solutionsPage"
import SolutionsInformation from "./solutionsInformation"
import { RasterMeta } from "@/core/apis/types"
import DemoPage from "../solutionD/demoPage"

export class SolutionsPageContext extends DefaultPageContext {
    solutionData: {
        name: string;
        model_type: string
        env: {
            grid_node_key: string
            dem_node_key: string
            lum_node_key: string
            rainfall_node_key: string
            gate_node_key: string
            tide_node_key: string
            inp_node_key: string
        }
        action_types: string[]
    }
    demOpacity: number
    demInfo: RasterMeta['data'] | null
    lumOpacity: number
    lumInfo: RasterMeta['data'] | null
    inpOpacity: number
    inpData: any | null
    gridVisible: boolean
    demVisible: boolean
    lumVisible: boolean
    gateVisible: boolean
    inpVisible: boolean

    constructor() {
        super()

        this.solutionData = {
            name: '',
            model_type: '',
            env: {
                grid_node_key: '',
                dem_node_key: '',
                lum_node_key: '',
                rainfall_node_key: '',
                gate_node_key: '',
                tide_node_key: '',
                inp_node_key: '',
            },
            action_types: [],
        }
        this.demOpacity = 0.8
        this.demInfo = null
        this.lumOpacity = 0.8
        this.lumInfo = null
        this.inpOpacity = 1
        this.inpData = null
        this.gridVisible = true
        this.demVisible = true
        this.lumVisible = true
        this.gateVisible = true
        this.inpVisible = true
    }

    static async create(node: ISceneNode): Promise<SolutionsPageContext> {
        return new SolutionsPageContext()
    }
}

export enum SolutionsMenuItem {
    SOLUTION_INFORMATION = 'Solution Information',
    CREATE_NEW_SOLUTION = 'Create New Solution',
    DISPLAY_SOLUTION = 'Display Solution'
}

export default class SolutionsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.solutions'
    semanticPath: string = 'root.solutions'
    children: string[] = [
        'solution'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionsMenuItem.SOLUTION_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionsMenuItem.CREATE_NEW_SOLUTION)}>
                    <FilePlus2 className='w-4 h-4' />Create New Solution
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionsMenuItem.DISPLAY_SOLUTION)}>
                    <Wrench className='w-4 h-4' />Display Solution
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SolutionsMenuItem.CREATE_NEW_SOLUTION:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SolutionsMenuItem.SOLUTION_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SolutionsMenuItem.DISPLAY_SOLUTION:
                (nodeSelf as SceneNode).pageId = 'display'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<SolutionsPage node={nodeSelf} />)
            case 'information':
                return (<SolutionsInformation />)
            case 'display':
                return (<DemoPage node={nodeSelf} />)
            default:
                return (<SolutionsPage node={nodeSelf} />)
        }
    }
}