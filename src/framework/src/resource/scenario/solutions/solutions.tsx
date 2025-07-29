import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { FilePlus2, Info } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import SolutionsPage from "./solutionsPage"
import SolutionsInformation from "./solutionsInformation"

export class SolutionsPageContext extends DefaultPageContext {
    name: string
    uploadResourcesNodeKey: {
        grid: string,
        dem: string,
        lum: string,
    }
    constructor() {
        super()
        this.name = ''
        this.uploadResourcesNodeKey = {
            grid: '',
            dem: '',
            lum: ''
        }
    }

    static async create(node: ISceneNode): Promise<SolutionsPageContext> {
        return new SolutionsPageContext()
    }
}

export enum SolutionsMenuItem {
    SOLUTION_INFORMATION = 'Solution Information',
    CREATE_NEW_SOLUTION = 'Create New Solution'
}

export default class SolutionsScenariNode extends DefaultScenarioNode {
    static classKey: string = 'root.solutions'
    semanticPath: string = 'root.solutions'
    children: string[] = [
        'solution'
    ]

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionsMenuItem.SOLUTION_INFORMATION)}>
                    <Info className='w-4 h-4' />Node Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionsMenuItem.CREATE_NEW_SOLUTION)}>
                    <FilePlus2 className='w-4 h-4' />Create New Solution
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void {
        switch (menuItem) {
            case SolutionsMenuItem.CREATE_NEW_SOLUTION:
                (nodeSelf as SceneNode).pageId = 'default'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SolutionsMenuItem.SOLUTION_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (<SolutionsPage node={nodeSelf} />)
            case 'information':
                return (<SolutionsInformation />)
            default:
                return (<SolutionsPage node={nodeSelf} />)
        }
    }
}