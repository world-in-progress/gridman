import MapContainer from "@/components/mapContainer/mapContainer"
import { SimulationPageProps } from "./types"


export default function SimulationPage({ node }: SimulationPageProps) {

    return (
        <div className="flex h-[96vh] w-full bg-slate-900 text-white">
            {/* Left Sidebar */}
            <div className="w-80 bg-slate-800 p-6 flex flex-col">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white">Simulation</h1>
                </div>
            </div>

            {/* Right Map Container */}
            <div className="flex-1 bg-slate-700 relative">
                <MapContainer node={null} style='w-full h-full' />
            </div>
        </div>
    )
}
