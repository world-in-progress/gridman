import { useState } from "react";
import MapContainer from "../mapContainer/mapContainer";
import FunctionArea from "../schemas/functionArea";

export default function CreatePage() {

    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

    return (
        <div className="w-full h-full flex flex-row bg-[#1E1E1E]">
            <FunctionArea mapInstance={mapInstance}/>
            <div className="w-3/5 h-full py-4 pr-2">
                <div className="w-full h-full rounded-lg shadow-lg bg-gray-200 p-2">
                    <MapContainer onMapLoad={setMapInstance} />
                </div>
            </div>
        </div>
    )
}
