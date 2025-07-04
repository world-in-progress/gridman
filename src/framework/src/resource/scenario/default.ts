import { IScenarioNode } from '@/core/scenario/iscenario'
import { ISceneNode, ISceneTree } from '../../core/scene/iscene'
import { MapContainerHandles } from '@/components/mapContainer/mapContainer'

export class DefaultPageContext {
}

export default class DefaultScenarioNode implements IScenarioNode {
    static classKey: string = 'default'
    semanticPath: string = 'default'
    children: string[] = []
    mapStyle: string = ''

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

    renderMap(nodeSelf: ISceneNode, mapContainerRef: React.RefObject<MapContainerHandles>): React.JSX.Element | null {
        return null
    }

    freezeMap(nodeSelf: ISceneNode): void {
    }

    meltMap(nodeSelf: ISceneNode): void {
    }
}