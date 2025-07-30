import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import SimulationPage from "./simulationPage"
import { FilePlus, FilePlus2, FileType2, Info } from 'lucide-react'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";

export class SimulationPageContext extends DefaultPageContext {
    constructor() {
        super()
    }
}

export enum SimulationMenuItem {
    SIMULATION_INFORMATION = 'Simulation Information',
    SIMULATION = 'Simulation',
}

export default class SimulationScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.simulation'
    semanticPath: string = 'root.simulation'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SimulationMenuItem.SIMULATION_INFORMATION)}>
                    <Info className='w-4 h-4' />Simulation Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SimulationMenuItem.SIMULATION)}>
                    <FilePlus2 className='w-4 h-4' />Simulation
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SimulationMenuItem.SIMULATION:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SimulationMenuItem.SIMULATION_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<SimulationPage node={nodeSelf} />)
            case 'information':
                // return (<SimulationInformation node={nodeSelf} />)
            default:
                return (<SimulationPage node={nodeSelf} />)
        }
    }
}