import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import { FilePlus2, Info } from 'lucide-react'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import SimulationsPage from "./simulationsPage";
import SimulationsInformation from "./simulationsInformation";
import { SolutionMeta } from "@/core/apis/types";

export class SimulationsPageContext extends DefaultPageContext {
    name: string
    solutionNodeKey: string
    solutionData: SolutionMeta | null
    constructor() {
        super()
        this.name = ''
        this.solutionNodeKey = ''
        this.solutionData = null
    }
}

export enum SimulationsMenuItem {
    SIMULATION_INFORMATION = 'Simulation Information',
    CREATE_NEW_SIMULATION = 'Create New Simulation',
}

export default class SimulationsScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.simulations'
    semanticPath: string = 'root.simulations'
    children: string[] = [
        'simulation'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SimulationsMenuItem.SIMULATION_INFORMATION)}>
                    <Info className='w-4 h-4' />Simulation Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SimulationsMenuItem.CREATE_NEW_SIMULATION)}>
                    <FilePlus2 className='w-4 h-4' />Create New Simulation
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SimulationsMenuItem.CREATE_NEW_SIMULATION:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SimulationsMenuItem.SIMULATION_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<SimulationsPage node={nodeSelf} />)
            case 'information':
                return (<SimulationsInformation />)
            default:
                return (<SimulationsPage node={nodeSelf} />)
        }
    }
}