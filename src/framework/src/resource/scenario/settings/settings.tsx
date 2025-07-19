import { SceneNode } from "@/components/resourceScene/scene";
import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene";
import SettingsPage from "./settingsPage";

export class SettingsPageContext extends DefaultPageContext {
    highSpeed: boolean

    constructor() {
        super()

        this.highSpeed = false
    }

    static async create(node: ISceneNode): Promise<SettingsPageContext> {
        const n = node as SceneNode
        const context = new SettingsPageContext()

        return context
    }
}

export enum SettingsMenuItem {
    SETTINGS = 'Settings',
}

export default class SettingsScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.icon.settings'
    semanticPath: string = 'root.icon.settings'
    children: string[] = []

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        return (
            <SettingsPage />
        )
    }
}