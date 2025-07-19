import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import SimulationPage from "./simulationPage";

export class SimulationPageContext extends DefaultPageContext {
    constructor() {
        super()
    }
}

export enum SimulationMenuItem {
    SIMULATION = 'Simulation',
}

export default class SimulationScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.icon.simulation'
    semanticPath: string = 'root.icon.simulation'
    children: string[] = []

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        return (
            <SimulationPage />
        )
    }
}