import { IScenarioNode } from '@/core/scenario/iscenario'
import { ISceneNode, ISceneTree } from '../../core/scene/iscene'

export class DefaultPageContext {
}

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

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return null
    }
    
    handleMenuOpen(nodeSelf: ISceneNode): void {
    }

    renderNodePage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return null
    }
}