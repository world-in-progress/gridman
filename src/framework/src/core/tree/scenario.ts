import { ScenarioNodeDescription } from '../../core/types'

export class ScenarioNode implements ScenarioNodeDescription {
    semanticPath: string
    children: string[]

    constructor(description: ScenarioNodeDescription) {
        this.semanticPath = description.semanticPath
        this.children = description.children
    }

    get name(): string {
        return this.semanticPath.split('.').pop() || ''
    }

    get degree(): number {
        return this.children.length
    }
}

export class ScenarioTree {
    nodeMap: Map<string, ScenarioNode> = new Map()

    constructor(description: ScenarioNodeDescription[]) {
        if (description.length === 0) {
            throw new Error('ScenarioTree must have at least one node')
        }

        description.forEach((nodeDesc) => {
            const node = new ScenarioNode(nodeDesc)
            this.nodeMap.set(node.semanticPath, node)
        })
    }

    getNode(path: string): ScenarioNode | undefined {
        return this.nodeMap.get(path)
    }
}