import MapContainer from '../mapContainer/mapContainer'
import { CreatePageProps } from './types'
import { ISceneNode } from '@/core/scene/iscene'

export default function ResorucePage({ node }: CreatePageProps) {
    if (!node) {
        console.debug('Rendering MapContainer for null node')
        return <MapContainer node={null} />
    } else {
        console.debug('Rendering page for valid node:', node.id)
        return (
            <div className='w-full h-full flex flex-row bg-[#1E1E1E]'>
                {node.scenarioNode.renderPage(node)}
            </div>
        )
    }
}