import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPinPlus } from "lucide-react"
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'

const schemaTips = [
    { tip1: 'Grid size specifications for different levels' },
    { tip2: 'Reference point coordinates' },
    { tip3: 'EPSG code for coordinate reference system' },
    { tip4: 'A unique name for identification' },
]

export default function NodeInformation() {

    const handleCreateNow = (): void => {
        // TODO: Implement create logic here
    }

    return (
        <div className="w-full h-[96vh] flex flex-row">
            <div className='w-full h-full flex flex-col'>
                <div className='flex-1 overflow-hidden'>
                    <div className='w-full border-b border-gray-700 flex flex-row'>
                        {/* ------------*/}
                        {/* Page Avatar */}
                        {/* ------------*/}
                        <div className='w-1/3 h-full flex justify-center items-center my-auto'>
                            <Avatar className='h-28 w-28 border-2 border-white'>
                                <AvatarFallback className='bg-[#007ACC]'>
                                    <MapPinPlus className='h-15 w-15 text-white' />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        {/* -----------------*/}
                        {/* Page Description */}
                        {/* -----------------*/}
                        <div className='w-2/3 h-full p-4 space-y-2 text-white'>
                            {/* -----------*/}
                            {/* Page Title */}
                            {/* -----------*/}
                            <h1 className='font-bold text-[25px] relative flex items-center'>
                                About Schemas
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full space-y-2'>
                                <p>Each schema requires:</p>
                                <ul className='list-disc space-y-1'>
                                    {schemaTips.map((tip, index) => (
                                        <li key={index}>
                                            {Object.values(tip)[0]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                type='button'
                                className='px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                                onClick={handleCreateNow}
                            >
                                Create new Schemas now!
                            </Button>
                        </div>

                    </div>

                    <ScrollArea>
                        <div className="w-[450px] h-full p-4 space-y-4 ml-50">
                            <h2 className="text-3xl font-semibold text-white">About Schemas</h2>
                            <div className="text-sm text-gray-300 space-y-3">
                                <p>Schemas are the fundamental structure for organizing spatial data in the grid system. They define how geographical areas are divided into hierarchical grid cells.</p>
                                <p>Each schema requires:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>A unique name for identification</li>
                                    <li>EPSG code for coordinate reference system</li>
                                    <li>Reference point coordinates</li>
                                    <li>Grid size specifications for different levels</li>
                                </ul>
                            </div>
                        </div>

                    </ScrollArea>



                </div>
            </div>
        <div className='w-full bg-white'></div>
        </div>
    )
}
