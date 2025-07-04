import { CreatePageProps } from './types'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneNode } from '../resourceScene/scene'
import React, { useEffect, useRef, useState } from 'react'
import MapContainer, { MapContainerHandles } from '../mapContainer/mapContainer'


const renderPage = (node: ISceneNode) => {
    return node.scenarioNode.renderPage(node)
}

const renderMap = (node: ISceneNode) => {
    console.log(node.scenarioNode.mapStyle)
    console.log(node.scenarioNode)
    return node.scenarioNode.renderMap(node)
}

export default function CreatePage({
    node
}: CreatePageProps) {
    const mapContainerRef = useRef<MapContainerHandles>(null)
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
    const [mapKey, setMapKey] = useState(0)
    const [creationType, setCreationType] = useState<string>()

    const remountMap = () => {
        setMapKey(prevKey => prevKey + 1)
    }

    useEffect(() => {
        if (mapContainerRef.current) {
            setMapInstance(mapContainerRef.current.getMap())
        }
    }, [mapKey])

    // const handleCreationSuccess = () => {
    //     if (onCreationSuccess && resourceTree) {
    //         onCreationSuccess(resourceTree, creationType)
    //     }
    // }

    return (
        <div className='w-full h-full flex flex-row bg-[#1E1E1E]'>
            { renderPage(node) }
            <div className='w-3/5 h-full py-4 pr-2'>
                <div className={node.scenarioNode.mapStyle}>
                    <MapContainer key={mapKey} ref={mapContainerRef} node={node} />
                    {/* { renderMap(node) } */}
                </div>
                
            </div>
        </div>
    )
}
