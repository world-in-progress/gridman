
import { ISceneNode } from '@/core/scene/iscene'
import { FilePlus2, Info, Paintbrush } from 'lucide-react'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import VectorsPage from './vectorsPage'
import VectorsInformation from './vectorsInformation'

export class VectorsPageContext extends DefaultPageContext {
    hasFeature: boolean
    drawFeature: GeoJSON.FeatureCollection | null
    featureData: {
        type: "point" | "line" | "polygon"
        name: string
        epsg: string
        color: string
    }


    constructor() {
        super()
        this.hasFeature = false
        this.drawFeature = null
        this.featureData = {
            type: "point",
            name: '',
            epsg: '',
            color: '#0ea5e9'
        }
    }

    static async create(): Promise<VectorsPageContext> {
        return new VectorsPageContext()
    }
}

export enum VectorsMenuItem {
    VECTORS_INFORMATION = 'Vectors Information',
    CREATE_NEW_FEATURE = 'Create New Feature',
}

export default class VectorsScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.vectors'
    semanticPath: string = 'root.vectors'
    children: string[] = [
        'patches',
        'grids',
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, VectorsMenuItem.VECTORS_INFORMATION) }}>
                    <Info className='w-4 h-4' />Vectors Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, VectorsMenuItem.CREATE_NEW_FEATURE) }}>
                    <Paintbrush className='w-4 h-4' />Create New Feature
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case VectorsMenuItem.VECTORS_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case VectorsMenuItem.CREATE_NEW_FEATURE: {
                // TODO: add second confirm dialog
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            }
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<VectorsPage node={nodeSelf} />)
            case 'information':
                return (<VectorsInformation node={nodeSelf} />)
            default:
                return (<VectorsPage node={nodeSelf} />)
        }
    }
}