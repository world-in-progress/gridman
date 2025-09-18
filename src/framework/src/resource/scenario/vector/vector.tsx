import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene"
import * as apis from '@/core/apis/apis'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { Delete, FilePlus2, Info, PencilRuler } from "lucide-react";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import VectorPage from "./vectorPage";
import VectorInformation from "./vectorInformation";
import DefaultPageContext from "@/core/context/default";
import { toast } from "sonner";
import store from "@/store";

export class VectorPageContext extends DefaultPageContext {

    drawFeature: GeoJSON.FeatureCollection | null
    featureData: Record<string, any>
    vectorColor: string 
    isRuined: boolean

    constructor() {
        super()
        this.drawFeature = null
        this.featureData = {
            type: '',
            name: '',
            epsg: '',
            color: ''
        }
        this.vectorColor = ''
        this.isRuined = false
    }

    static async create(node: ISceneNode): Promise<VectorPageContext> {

        const n = node as SceneNode
        const context = new VectorPageContext()

        try {
            const nodeMeta = await apis.feature.getFeatureData.fetch(n.key, n.tree.isPublic)
            context.featureData = nodeMeta.data
            context.drawFeature = nodeMeta.data.feature_json
            context.vectorColor = nodeMeta.data.color
        } catch (error) {
            console.error('Process vector data failed:', error)
        }

        return context
    }
}

export enum VectorMenuItem {
    VECTOR_INFORMATION = 'Vector Information',
    EDIT_THIS_VECTOR = 'Edit This Vector',
    DELETE_THIS_VECTOR = 'Delete This Vector',
}

export default class VectorScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.vectors.vector'
    semanticPath: string = 'root.vectors.vector'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, VectorMenuItem.VECTOR_INFORMATION) }}>
                    <Info className='w-4 h-4' />Vector Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => { handleContextMenu(nodeSelf, VectorMenuItem.EDIT_THIS_VECTOR) }}>
                    <PencilRuler className='w-4 h-4' />Edit this vector
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, VectorMenuItem.DELETE_THIS_VECTOR) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete this vector</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case VectorMenuItem.VECTOR_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case VectorMenuItem.EDIT_THIS_VECTOR:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')?.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case VectorMenuItem.DELETE_THIS_VECTOR:
                store.get<{ on: Function, off: Function }>('isLoading')?.on()
                const deleteResponse = await apis.feature.deleteFeature.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
                store.get<{ on: Function, off: Function }>('isLoading')?.off()
                if (deleteResponse.success) {
                    await (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                    toast.success(deleteResponse.message)
                } else {
                    toast.error(deleteResponse.message)
                }
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<VectorPage node={nodeSelf} />)
            case 'information':
                return (<VectorInformation node={nodeSelf} />)
            default:
                return (<VectorPage node={nodeSelf} />)
        }
    }
}