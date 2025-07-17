import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SquaresIntersect } from 'lucide-react'

const patchTips = [
    { tip1: 'Provide a name for the Patch (required).' },
    { tip2: 'Add a description (optional).' },
    { tip3: 'Select the Schema it belongs to (EPSG code auto-associated).' },
    { tip4: 'Define Patch boundaries by drawing or entering coordinates.' },
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
                                    <SquaresIntersect className='h-15 w-15 text-white' />
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
                                About Patches
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full space-y-2'>
                                <p>Creating a Patch requires:</p>
                                <ul className='list-disc space-y-1'>
                                    {patchTips.map((tip, index) => (
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
                                Create new patch now!
                            </Button>
                        </div>

                    </div>

                    <ScrollArea>
                        <div className="w-[450px] h-full p-4 space-y-4 ml-50">
                            <h2 className="text-3xl font-semibold text-white">About Patches</h2>
                            <div className="text-sm text-gray-300 space-y-3">
                                <p>Patches are specific regional divisions based on Schema definitions, representing areas in geographic space used to organize and manage spatial data.</p>
                                <p>Steps to create a Patch:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Enter Patch name and optional description</li>
                                    <li>Select the Schema it belongs to (automatically gets EPSG coordinate system)</li>
                                    <li>
                                        Define boundary coordinates using two methods:
                                        <ul className="list-circle pl-5 space-y-1 mt-1">
                                            <li>Method 1: Draw a rectangle directly on the map</li>
                                            <li>Method 2: Manually input coordinate parameters</li>
                                        </ul>
                                    </li>
                                    <li>The system automatically adjusts boundaries to fit grid rules</li>
                                    <li>Submit creation request to complete Patch creation</li>
                                </ul>
                                <p>After creation, Patches can be managed in the Topology Editor for grid subdivision and management operations.</p>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
