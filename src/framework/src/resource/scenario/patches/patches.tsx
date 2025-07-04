import { FileType2 } from 'lucide-react'
import { Tab } from '@/components/tabBar/types'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import store from '@/store'
import PatchesPage from './patchesPage'
import MapContainer, { MapContainerHandles } from '@/components/mapContainer/mapContainer'

export class PatchesPageContext extends DefaultPageContext {
    name: string
    bounds: number[]
    starred: boolean
    description: string

    constructor() {
        super()

        this.name = ''
        this.bounds = []
        this.starred = false
        this.description = ''
    }
}

export default class PatchesScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas.schema.patches'
    semanticPath: string = 'root.topo.schemas.schema.patches'
    children: string[] = [
        'patch',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf)}>
                    <FileType2 className='w-4 h-4 ml-2' />Create New Patch
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode): void {
        const _node = nodeSelf as SceneNode
        const _tree = nodeSelf.tree as SceneTree

        _tree.startEditingNode(_node)
    }

    // renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
    //     const map = store.get<mapboxgl.Map>('map')

    //     return 
    //     (
    //         <PatchesPage node={nodeSelf} />
    //     )
    // }

    renderMap(nodeSelf: ISceneNode, mapContainerRef: React.RefObject<MapContainerHandles>): React.JSX.Element | null {
        return (
            <MapContainer node={nodeSelf} ref={mapContainerRef} />
        )
    }
}