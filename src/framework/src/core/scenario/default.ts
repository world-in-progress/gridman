import { ISceneNode } from '@/core/scene/iscene'
import { IScenarioNode } from '@/core/scenario/iscenario'

export default class DefaultScenarioNode implements IScenarioNode {
    static classKey: string = 'default'
    semanticPath: string = 'default'
    children: string[] = []

    get name(): string {
        return this.semanticPath.split('.').pop() || ''
    }

    get degree(): number {
        return this.children.length
    }

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return null
    }

    
    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        return null
    }
}