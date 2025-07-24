import DefaultPageContext from "@/core/context/default";
import DefaultScenarioNode from "@/core/scenario/default";
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { FilePlus2, Info } from "lucide-react";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import LumsInformation from "./lumsInformation";
import LumsPage from "./lumsPage";

export class LumsPageContext extends DefaultPageContext {
    hasLUM: boolean
    lumInfo:  {
        name: string,
        epsg: string,
        sourceKey: string
    }
    uploadLum: string = ''
    uploadVectors: string[] = []

    constructor() {
        super()

        this.hasLUM = false
        this.lumInfo = {
            name: '',
            epsg: '',
            sourceKey: ''
        }
        this.uploadVectors = []
    }

    static async create(node: ISceneNode): Promise<LumsPageContext> {
        return new LumsPageContext()
    }
}

export enum LumsMenuItem {
    LUM_INFORMATION = 'LUM Information',
    LUM_EDIT = 'LUM Editor'
}

export default class LumsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.lums'
    semanticPath: string = 'root.lums'
    children: string[] = [
        'lum'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumsMenuItem.LUM_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, LumsMenuItem.LUM_EDIT)}>
                    <FilePlus2 className='w-4 h-4' />LUM Editor
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case LumsMenuItem.LUM_EDIT:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case LumsMenuItem.LUM_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {

        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<LumsPage node={nodeSelf} />)
            case 'information':
                return (<LumsInformation />)
            default:
                return (<LumsPage node={nodeSelf} />)
        }
    }
}