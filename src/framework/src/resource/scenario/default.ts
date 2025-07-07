import { ISceneNode } from '../../core/scene/iscene'
import { IScenarioNode } from '@/core/scenario/iscenario'

export class DefaultPageContext {
    serialize(): any {}

    static deserialize(input: any): DefaultPageContext {
        return new DefaultPageContext()
    }

    static async create(node: ISceneNode): Promise<DefaultPageContext> {
        return new DefaultPageContext()
    }
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

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        return null
    }
}