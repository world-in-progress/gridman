import MapContainer from '../mapContainer/mapContainer'
import { CreatePageProps } from './types'

export default function ResourcePage({
    node,
    menuItem
}: CreatePageProps) {
    if (!node) {
        console.debug('Rendering MapContainer for null node')
        return <MapContainer node={null} />

    } else {
        console.debug('Rendering page for valid node:', node.id)
        return (
            <div className='w-full h-[96vh] flex flex-row bg-[#1E1E1E]'>
                {node.scenarioNode.renderPage(node, menuItem)}
            </div>
        )
    }
}