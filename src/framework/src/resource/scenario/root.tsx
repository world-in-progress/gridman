import DefaultScenarioNode from '@/core/scenario/default'

export default class RootScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root'
    semanticPath: string = 'root'
    children: string[] = [
        'topo',
        'dems',
        'lums',
        'vectors',
        'rainfalls',
        'solutions',
        'instances',
        'settings',
        'simulation',
    ]
}