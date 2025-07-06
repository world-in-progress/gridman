import { CreatePageProps } from './types'
import { ISceneNode } from '@/core/scene/iscene'

const renderPage = (node: ISceneNode) => {
    return node.scenarioNode.renderPage(node)
}

export default function CreatePage({
    node
}: CreatePageProps) {
    return (
        <div className='w-full h-full flex flex-row bg-[#1E1E1E]'>
            {renderPage(node)}
        </div>
    )
}