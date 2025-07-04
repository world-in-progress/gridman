import { CreatePageProps } from './types'
import { ISceneNode } from '@/core/scene/iscene'
import { SceneTree } from '../resourceScene/scene'
import React, { useEffect, useRef } from 'react'
import { MapContainerHandles } from '../mapContainer/mapContainer'


const renderPage = (node: ISceneNode) => {
    return node.scenarioNode.renderPage(node)
}

const renderMap = (node: ISceneNode, mapContainerRef: React.RefObject<MapContainerHandles>) => {
    return node.scenarioNode.renderMap(node, mapContainerRef)
}

export default function CreatePage({
    node
}: CreatePageProps) {
    const mapContainerRef = useRef<MapContainerHandles>(null) as React.RefObject<MapContainerHandles>

    // const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
    // const [mapKey, setMapKey] = useState(0)
    // const [creationType, setCreationType] = useState<string>()

    // const remountMap = () => {
    //     setMapKey(prevKey => prevKey + 1)
    // }

    // useEffect(() => {
    //     if (mapContainerRef.current) {
    //         setMapInstance(mapContainerRef.current.getMap())
    //     }
    // }, [mapKey])

    // const handleCreationSuccess = () => {
    //     if (onCreationSuccess && resourceTree) {
    //         onCreationSuccess(resourceTree, creationType)
    //     }
    // }

    useEffect(() => {
        if (node && node.tree) {
            (node.tree as SceneTree).mapContainerRef = mapContainerRef;
        }
    }, [node]);

    return (
        <div className='w-full h-full flex flex-row bg-[#1E1E1E]'>
            {renderPage(node)}
            <div className='w-3/5 h-full py-4 pr-2'>
                <div className={node.scenarioNode.mapStyle}>
                    {/* <MapContainer key={mapKey} ref={mapContainerRef} node={node} /> */}
                    {renderMap(node, mapContainerRef)}
                </div>

            </div>
        </div>
    )
}
