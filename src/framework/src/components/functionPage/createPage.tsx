import { useEffect, useRef, useState } from "react";
import MapContainer, { MapContainerHandles } from "../mapContainer/mapContainer";
import CreateSchemaFunctionArea from '../schemas/createSchemaFunctionArea'
import CreatePatchFunctionArea from "../patches/createPatchFunctionArea";
import { CreatePageProps } from "./types";

export default function CreatePage({
    creationType, 
    resourceTree,
    onCreationSuccess
}: CreatePageProps) {
    const mapContainerRef = useRef<MapContainerHandles>(null);
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
    const [mapKey, setMapKey] = useState(0);

    const remountMap = () => {
        setMapKey(prevKey => prevKey + 1);
    }

    useEffect(() => {
        if (mapContainerRef.current) {
            setMapInstance(mapContainerRef.current.getMap());
        }
    }, [mapKey]);

    const handleCreationSuccess = () => {
        if (onCreationSuccess && resourceTree) {
            onCreationSuccess(resourceTree, creationType);
        }
    }

    return (
        <div className="w-full h-full flex flex-row bg-[#1E1E1E]">
            {creationType === 'schema' && <CreateSchemaFunctionArea mapInstance={mapInstance} remountMap={remountMap} resourceTree={resourceTree} onCreationSuccess={handleCreationSuccess} />}
            {creationType === 'patch' && <CreatePatchFunctionArea mapInstance={mapInstance} remountMap={remountMap} />}
            <div className="w-3/5 h-full py-4 pr-2">
                <div className="w-full h-full rounded-lg shadow-lg bg-gray-200 p-2">
                    <MapContainer key={mapKey} ref={mapContainerRef} />
                </div>
            </div>
        </div>
    )
}
