import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { FilePlus2, Info } from "lucide-react";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import LumInformation from "./lumInformation";
import LumPage from "./lumPage";
import { UpdateRasterData, UpdateRasterMeta } from "@/core/apis/types";

export interface Vectordata {
    name: string,
    type: string,
    color: string,
    epsg: string,
    feature_json: Record<string, any>
}

export class LumPageContext extends DefaultPageContext {

    uploadVectors: {
        node_key: string,
        data: Vectordata
        updateRasterData: UpdateRasterData
    } []
    updateRasterMeta: UpdateRasterMeta

    constructor() {
        super()

        this.uploadVectors = []
        this.updateRasterMeta = {
            updates: []
        }
    }

    static async create(): Promise<LumPageContext> {
        return new LumPageContext()
    }
}

export enum LumMenuItem {
    LUM_INFORMATION = 'LUM Information',
    LUM_EDIT = 'Edit this LUM'
}

export default class LumScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.lums.lum'
    semanticPath: string = 'root.lums.lum'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumMenuItem.LUM_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumMenuItem.LUM_EDIT)}>
                    <FilePlus2 className='w-4 h-4' />Edit this LUM
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case LumMenuItem.LUM_EDIT:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case LumMenuItem.LUM_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {

        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<LumPage node={nodeSelf} />)
            case 'information':
                return (<LumInformation />)
            default:
                return (<LumPage node={nodeSelf} />)
        }
    }
}