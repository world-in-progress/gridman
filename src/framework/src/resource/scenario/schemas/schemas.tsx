import store from '@/store'
import SchemasPage from './schemasPage'
import { FilePlus2 } from 'lucide-react'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import DefaultScenarioNode, { DefaultPageContext } from '@/resource/scenario/default'
import MapContainer, { MapContainerHandles } from '@/components/mapContainer/mapContainer'
import { addMapMarker, clearMapMarkers } from '@/components/mapContainer/utils'

interface MapState {
    isDrawingPoint: boolean
}

export class SchemasPageContext extends DefaultPageContext {
    name: string
    epsg: number | null
    starred: boolean
    description: string
    base_point: number[]
    grid_info: number[][]

    // isDrawingPoint: boolean
    mapState: MapState

    constructor() {
        super()

        this.name = ''
        this.epsg = null
        this.starred = false
        this.description = ''
        this.base_point = []
        this.grid_info = []

        this.mapState = {
            isDrawingPoint: false,
        }
    }
}

export default class SchemasScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo.schemas'
    semanticPath: string = 'root.topo.schemas'
    children: string[] = [
        'schema',
    ]
    mapStyle: string = 'w-full h-full rounded-lg shadow-lg bg-gray-200 p-2'

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent className='w-50 bg-white text-gray-900 border-gray-200'>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf); this.handleMenuOpen(nodeSelf) }}>
                    <FilePlus2 className='w-4 h-4 ml-2' />Create New Schema
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode): void {
        const _node = nodeSelf as SceneNode
        const _tree = nodeSelf.tree as SceneTree

        _tree.startEditingNode(_node)
    }

    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null {
        const map = store.get<mapboxgl.Map>('map')

        return (
            <SchemasPage node={nodeSelf} mapInstance={map} />
        )
    }

    renderMap(nodeSelf: ISceneNode, mapContainerRef: React.RefObject<MapContainerHandles>): React.JSX.Element | null {
        return (
            <MapContainer node={nodeSelf} ref={mapContainerRef} />
        )
    }

    freezeMap(nodeSelf: ISceneNode): void {
        const map: mapboxgl.Map = store.get<mapboxgl.Map>('map')!
        const mapMethods = store.get<MapContainerHandles>('mapMethods')!
        const context: SchemasPageContext = (nodeSelf as SceneNode).pageContext

        // clearMapMarkers()
    }

    meltMap(nodeSelf: ISceneNode): void {
        const map: mapboxgl.Map = store.get<mapboxgl.Map>('map')!
        const context: SchemasPageContext = (nodeSelf as SceneNode).pageContext

        clearMapMarkers()

        addMapMarker(context.base_point)
    }
}