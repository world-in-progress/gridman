import DefaultScenarioNode from '@/core/scenario/default'

export default class TopoScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.topo'
    semanticPath: string = 'root.topo'
    children: string[] = [
        'schemas',
    ]
}