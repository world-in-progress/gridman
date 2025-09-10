import DefaultPageContext from "@/core/context/default"
import DefaultScenarioNode from "@/core/scenario/default"
import { ISceneNode } from "@/core/scene/iscene"
import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { Delete, FilePlus2, Info, PersonStanding } from "lucide-react"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import * as apis from '@/core/apis/apis'
import store from "@/store"
import { toast } from "sonner"
import SolutionPage from "./solutionPage"
import SolutionInformation from "./solutionInformation"
import { SolutionMeta } from "@/core/apis/types"
import DemoPage from "../solutionD/demoPage"

export interface HumanAction {
    id: string;
    node_key: string;
    action_type: string;
    elevation_delta: string;
    landuse_type: string;
    geometry: any
    registered: boolean
}

export class SolutionPageContext extends DefaultPageContext {
    solutionData: SolutionMeta
    humanActions: HumanAction[]

    constructor() {
        super()
        this.solutionData = {
            name: '',
            model_type: '',
            env: {
                grid_node_key: '',
            },
            action_types: [],
        }
        this.humanActions = []
    }

    static async create(node: ISceneNode): Promise<SolutionPageContext> {
        const n = node as SceneNode
        const context = new SolutionPageContext()
        const solution = await apis.solution.getSolutionByNodeKey.fetch(node.key, node.tree.isPublic)
        context.solutionData = solution.data
        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        return context
    }
}

export enum SolutionMenuItem {
    SOLUTION_INFORMATION = 'Solution Information',
    ADD_HUMAN_ACTION = 'Add Human Action',
    DELETE_THIS_SOLUTION = 'Delete This Solution'
}

export default class SolutionScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.solutions.solution'
    semanticPath: string = 'root.solutions.solution'
    children: string[] = []

    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null {
        return (
            <ContextMenuContent>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionMenuItem.SOLUTION_INFORMATION)}>
                    <Info className='w-4 h-4' />Solution Information
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer' onClick={() => handleContextMenu(nodeSelf, SolutionMenuItem.ADD_HUMAN_ACTION)}>
                    <PersonStanding className='w-4 h-4' />Add Human Action
                </ContextMenuItem>
                <ContextMenuItem className='cursor-pointer flex bg-red-500 hover:!bg-red-600' onClick={() => { handleContextMenu(nodeSelf, SolutionMenuItem.DELETE_THIS_SOLUTION) }}>
                    <Delete className='w-4 h-4 text-white rotate-180' />
                    <span className='text-white'>Delete This Solution</span>
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    async handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): Promise<void> {
        switch (menuItem) {
            case SolutionMenuItem.DELETE_THIS_SOLUTION:
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                const deleteResponse = await apis.solution.deleteSolution.fetch(nodeSelf.key, nodeSelf.tree.isPublic)
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                if (deleteResponse.success) {
                    toast.success('Solution deleted successfully')
                        ; (nodeSelf.tree as SceneTree).removeNode(nodeSelf)
                } else {
                    toast.error('Failed to delete solution')
                }
                break
            case SolutionMenuItem.ADD_HUMAN_ACTION:
                (nodeSelf as SceneNode).pageId = 'default'
                store.get<{ on: Function, off: Function }>('isLoading')!.on()
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
            case SolutionMenuItem.SOLUTION_INFORMATION:
                (nodeSelf as SceneNode).pageId = 'information'
                    ; (nodeSelf.tree as SceneTree).startEditingNode(nodeSelf as SceneNode)
                break
        }
    }

    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null {
        switch ((nodeSelf as SceneNode).pageId) {
            case 'default':
                return (
                    // <SolutionPage node={nodeSelf} />
                    <DemoPage node={nodeSelf} />
                )
            case 'information':
                return (
                    <SolutionInformation />
                )
            default:
                return (
                    <SolutionPage node={nodeSelf} />
                )
        }
    }
}