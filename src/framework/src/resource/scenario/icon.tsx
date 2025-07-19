import DefaultScenarioNode from '@/core/scenario/default'

export default class IconScenarioNode extends DefaultScenarioNode {
    static classKey: string = 'root.icon'
    semanticPath: string = 'root.icon'
    children: string[] = [
        'settings',
        'simulation',
    ]
}