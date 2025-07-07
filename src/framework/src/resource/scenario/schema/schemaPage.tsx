import React from 'react'
import { SchemaPageProps } from './types'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPin, MapPinCheck, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@radix-ui/react-context-menu'
import { Button } from '@/components/ui/button'

const schemaCheckTips = [
    { tip1: 'You can view the information of this Schema on this page.' },
    { tip2: 'Click "Edit" button on left below to re-edit this schema.' },
    { tip3: 'Click "Delete" button on right below to delete this schema.' }
]

export default function SchemaPage({ node }: SchemaPageProps) {
    return (
        <div className='w-full h-full flex flex-row'>
            <div className='w-2/5 h-full flex flex-col'>
                <div className='flex-1 overflow-hidden'>
                    {/* ----------------- */}
                    {/* Page Introduction */}
                    {/* ----------------- */}
                    <div className='h-50 w-full border-b border-gray-700 flex flex-row'>
                        {/* ------------*/}
                        {/* Page Avatar */}
                        {/* ------------*/}
                        <div className='w-1/3 h-full flex justify-center items-center'>
                            <Avatar className='h-28 w-28 border-2 border-white'>
                                <AvatarFallback className='bg-[#007ACC]'>
                                    <MapPinCheck className='h-15 w-15 text-white' />
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
                            <h1 className='font-bold text-[25px]'>Check Schema Info ({node.name})</h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {schemaCheckTips.map((tip, index) => (
                                        <li key={index}>
                                            {Object.values(tip)[0]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className='text-sm w-full flex flex-row space-x-2'>
                                <Button variant='default' className='bg-sky-600 hover:bg-sky-500 text-white cursor-pointer w-14 h-6 rounded-sm'>Edit</Button>
                                <Button variant='destructive' className='bg-red-500 hover:bg-red-400 text-white cursor-pointer w-14 h-6 rounded-sm'>Delete</Button>
                            </div>
                        </div>
                    </div>
                    {/* ---------------- */}
                    {/* Grid Schema Form */}
                    {/* ---------------- */}
                    <ScrollArea className='h-full max-h-[calc(100vh-14.5rem)]'>
                        <div className='w-2/3 mx-auto mt-4 mb-4 space-y-4 pb-4'>
                            {/* ----------- */}
                            {/* Schema Name */}
                            {/* ----------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    New Schema Name
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='name'
                                        value={node.name}
                                        // onChange={handleSetName}
                                        placeholder={
                                            'Enter new schema name'
                                        }
                                        className={`w-full text-black border-gray-300 }`}
                                        // className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className='w-3/5 h-full py-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}
