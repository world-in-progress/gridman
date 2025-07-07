import { SchemaPageProps } from './types'
import { useEffect, useReducer, useRef } from 'react'
import { SchemaPageContext } from './schema'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Delete, MapPin, MapPinCheck, Pencil, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Separator } from '@/components/ui/separator'
import { convertSinglePointCoordinate, flyToMarker } from '@/components/mapContainer/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteSchema } from './util'
import { toast } from 'sonner'

const schemaCheckTips = [
    { tip1: 'You can view the information of this Schema on this page.' },
    { tip2: 'Click "Edit" button to re-edit schema description.' },
    { tip3: 'Click "Delete" button to delete this schema.' }
]

export default function SchemaPage({ node }: SchemaPageProps) {

    const pageContext = useRef<SchemaPageContext>(new SchemaPageContext())
    const coordinateOn4326 = useRef<[number, number]>([0, 0])
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    useEffect(() => {
        const schemaContext = (node as SceneNode).pageContext
        if (schemaContext && schemaContext.schema) {
            pageContext.current = schemaContext
            const orginalCoordinates = schemaContext.schema?.base_point
            const schemaEPSG = schemaContext.schema?.epsg
            if (orginalCoordinates && schemaEPSG && schemaEPSG !== '4326') {
                coordinateOn4326.current = convertSinglePointCoordinate(orginalCoordinates, schemaEPSG, '4326')
            }
            flyToMarker(coordinateOn4326.current)
        }
    })

    const handleSchemaDelete = async () => {
        const response = await deleteSchema(pageContext.current.schema!.name, node.tree.isPublic)
        if (response) {
            toast.success(`Schema ${pageContext.current.schema!.name} deleted successfully`)
            const parent = node.parent!
            await parent.tree.alignNodeInfo(parent, true)

            const tree = parent.tree as SceneTree
            tree.stopEditingNode(node)
        } else {
            toast.error(`Failed to delete schema ${pageContext.current.schema!.name}`)
        }
    }

    return (
        <div className='w-full h-[96vh] flex flex-row'>
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
                            <div className='text-sm w-full flex flex-row space-x-2 px-4'>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='destructive'
                                            className='bg-red-500 hover:bg-red-400 h-8 text-white cursor-pointer rounded-sm flex'
                                        >
                                            <span>Delete</span>
                                            <Separator orientation='vertical' className='h-4' />
                                            <Delete className='w-4 h-4' />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure to delete this schema?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this schema and all its data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className='cursor-pointer border border-gray-300'>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className='bg-red-500 hover:bg-red-600 cursor-pointer'
                                                onClick={handleSchemaDelete}
                                            >
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                                        value={pageContext.current.schema?.name}
                                        // onChange={handleSetName}
                                        placeholder={
                                            'Enter new schema name'
                                        }
                                        className={`w-full text-black border-gray-300 }`}
                                        readOnly={true}
                                    // className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* ------------------ */}
                            {/* Schema Description */}
                            {/* ------------------ */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <div className='flex justify-between items-center mb-2'>
                                    <h2 className='text-black text-lg font-semibold'>
                                        Schema Description (Optional)
                                    </h2>
                                    <Button
                                        className='bg-blue-500 hover:bg-blue-600 text-white cursor-pointer h-8'
                                    // onClick={}
                                    >
                                        <span>Edit</span>
                                        <Separator orientation='vertical' className='h-4' />
                                        <Pencil className='w-4 h-4' />
                                    </Button>
                                </div>
                                <div className='space-y-2'>
                                    <Textarea
                                        id='description'
                                        value={pageContext.current.schema?.description}
                                        // onChange={handleSetDescription}
                                        readOnly={true}
                                        placeholder={'Enter schema description'}
                                        className={`w-full text-black border-gray-300`}
                                    />
                                </div>
                            </div>
                            {/* --------- */}
                            {/* EPSG Code */}
                            {/* --------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    EPSG Code
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='epsg'
                                        placeholder='Enter EPSG code (e.g. 4326)'
                                        className={`text-black w-full border-gray-300}`}
                                        value={pageContext.current.schema?.epsg}
                                    // onChange={handleSetEPSG}
                                    />
                                </div>
                            </div>
                            {/* ----------------------- */}
                            {/* Coordinates (EPSG:4326) */}
                            {/* ----------------------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    Coordinates (EPSG:4326)
                                </h2>
                                <div className='flex items-stretch gap-4'>
                                    <div className='flex-1 flex flex-col justify-between text-black'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label htmlFor='lon' className='text-sm font-medium w-1/4'>
                                                Longitude
                                            </Label>
                                            <Input
                                                id='lon'
                                                type='number'
                                                step='0.000001'
                                                value={coordinateOn4326.current?.[0].toString()}
                                                // onChange={handleSetBasePointLon}
                                                placeholder={'Enter longitude'}
                                                className={`w-3/4 border-gray-300`}
                                            />
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Label htmlFor='lat' className='text-sm font-medium w-1/4'>
                                                Latitude
                                            </Label>
                                            <Input
                                                id='lat'
                                                type='number'
                                                step='0.000001'
                                                value={coordinateOn4326.current?.[1].toString()}
                                                // onChange={handleSetBasePointLat}
                                                placeholder={'Enter latitude'}
                                                className={`w-3/4 border-gray-300`}
                                            />
                                        </div>
                                    </div>
                                    {/* ---------------------- */}
                                    {/* Base Point Map Picking */}
                                    {/* ---------------------- */}
                                    <Button
                                        type='button'
                                        onClick={() => flyToMarker(coordinateOn4326.current)}
                                        className={`w-[80px] h-[84px] shadow-sm bg-blue-500 hover:bg-blue-600 text-white cursor-pointer`}
                                    >
                                        <div className='flex flex-col items-center'>
                                            <MapPin className='mb-1 stroke-2' />
                                            <span>Locate</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                            {/* --------------------- */}
                            {/* Converted Coordinates */}
                            {/* --------------------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-black'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    Converted Coordinate (EPSG:{pageContext.current.schema?.epsg.toString()}
                                    )
                                </h2>
                                <div className='flex-1 flex flex-col justify-between'>
                                    <div className='flex items-center gap-2 mb-2 '>
                                        <Label className='text-sm font-medium w-1/4'>X</Label>
                                        <div className='w-3/4 p-2 bg-gray-100 rounded border border-gray-300'>
                                            {pageContext.current.schema?.base_point[0].toString()}
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-2'>
                                        <Label className='text-sm font-medium w-1/4'>Y</Label>
                                        <div className='w-3/4 p-2 bg-gray-100 rounded border border-gray-300'>
                                            {pageContext.current.schema?.base_point[1].toString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='p-3 bg-white text-black rounded-md shadow-sm border border-gray-200'>
                                <div className='flex justify-between items-center mb-2'>
                                    <h3 className='text-lg font-semibold'>Grid Level</h3>
                                </div>
                                {/* ---------- */}
                                {/* Grid Layer */}
                                {/* ---------- */}
                                <div className='space-y-3'>
                                    {pageContext.current.schema?.grid_info.map((layer, index) => (
                                        <div key={index} className='p-2 bg-gray-50 rounded border border-gray-200'>
                                            <div className='flex justify-between items-center mb-2'>
                                                <h4 className='text-sm font-medium'>Level {index + 1}</h4>
                                            </div>
                                            <div className='grid grid-cols-2 gap-2'>
                                                <div>
                                                    <label className='block text-xs mb-1'>Width/m</label>
                                                    <input
                                                        type='number'
                                                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                        value={layer[0]}
                                                        // onChange={(e) => handleUpdateWidth(layer.id, e.target.value)}
                                                        placeholder={'Width'}
                                                        readOnly={true}
                                                    />
                                                </div>
                                                <div>
                                                    <label className='block text-xs mb-1'>Height/m</label>
                                                    <input
                                                        type='number'
                                                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                        value={layer[1]}
                                                        // onChange={(e) => handleUpdateHeight(layer.id, e.target.value)}
                                                        placeholder={'Height'}
                                                        readOnly={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* ----------------------- */}
                                {/* Grid Layer Adding Rules */}
                                {/* ----------------------- */}
                                <div className='mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200'>
                                    <p>Grid levels follow these rules:</p>
                                    <ul className='list-disc pl-4 mt-1'>
                                        <li>
                                            Each level have smaller cell dimensions than the previous level
                                        </li>
                                        <li>
                                            Previous level's width/height is a multiple of the current level's width/height
                                        </li>
                                        <li>
                                            First level defines the base grid cell size, and higher levels define increasingly finer grids
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className='w-3/5 h-full py-4 px-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}
