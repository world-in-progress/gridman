import { cn } from '@/utils/utils'
import MapContainer from '../mapContainer/mapContainer'
import { CreatePageProps } from './types'

export default function ResourcePage({ node }: CreatePageProps) {
    return (
        <div className='w-full h-full flex flex-row bg-[#1E1E1E]'>
            {node.scenarioNode.renderPage(node)}
        </div>
    )
}