import store from '@/store'
import mapboxgl from 'mapbox-gl'
import * as apis from '@/core/apis/apis'
import { SchemasPageProps } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SchemasPageContext } from './schemas'
import { GridSchema } from '@/core/apis/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Crosshair, MapPin, MapPinPlus, Save, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEffect, useReducer, useRef, useState } from 'react'
import MapContainer from '@/components/mapContainer/mapContainer'
import { addMapMarker, clearMapMarkers, convertCoordinate } from '@/components/mapContainer/utils'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { validateGridLayers, validateSchemaForm, pickingFromMap } from './utils'
import { useTranslation } from 'react-i18next'

const schemaTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

const gridLevelText = {
    title: 'Grid Level',
    addButton: 'Add Grid Level',
    noLayers: 'No layers added yet. Click the button above to add a layer.',
    rulesTitle: 'Grid levels should follow these rules:',
    rule1: 'Each level should have smaller cell dimensions than the previous level',
    rule2: "Previous level's width/height must be a multiple of the current level's width/height",
    rule3: 'First level defines the base grid cell size, and higher levels define increasingly finer grids'
}

const gridItemText = {
    level: 'Level',
    remove: 'Remove',
    width: 'Width/m',
    height: 'Height/m',
    widthPlaceholder: 'Width',
    heightPlaceholder: 'Height'
}

export default function SchemasPage({
    node,
}: SchemasPageProps) {
    //i18
    const { t, i18n } = useTranslation("schemasPage")

    const picking = useRef<{ marker: mapboxgl.Marker | null, cancel: () => void }>({ marker: null, cancel: () => { } })
    const pageContext = useRef<SchemasPageContext>(new SchemasPageContext())
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [isSelectingPoint, setIsSelectingPoint] = useState(false)
    const [generalMessage, setGeneralMessage] = useState<string | null>(null)
    const [layerErrors, setLayerErrors] = useState<Record<number, string>>({})
    const [convertedCoord, setConvertedCoord] = useState<{ x: number, y: number } | null>(null)
    const [formErrors, setFormErrors] = useState<{
        name: boolean
        epsg: boolean
        description: boolean
        coordinates: boolean
    }>({
        name: false,
        epsg: false,
        description: false,
        coordinates: false,
    })

    // Style variables for general message
    let bgColor = 'bg-red-50'
    let textColor = 'text-red-700'
    let borderColor = 'border-red-200'
    if (generalMessage?.includes('Submitting data')) {
        bgColor = 'bg-orange-50'
        textColor = 'text-orange-700'
        borderColor = 'border-orange-200'
    }
    else if (generalMessage?.includes('Created successfully')) {
        bgColor = 'bg-green-50'
        textColor = 'text-green-700'
        borderColor = 'border-green-200'
    }

    const loadContext = async (node: SceneNode) => {
        const context = await node.getPageContext() as SchemasPageContext

        // Load page context if exists
        // Action 1: melt page context if exists
        // Action 2: update coordinates if exists
        // Action 3: add picking marker if exists
        if (context) {
            pageContext.current = context

            updateCoords()

            if (context.basePoint[0] && context.basePoint[1]) {
                const map = store.get<mapboxgl.Map>('map')!
                const marker = new mapboxgl.Marker({ color: '#FF0000' })
                    .setLngLat([context.basePoint[0], context.basePoint[1]])
                    .addTo(map)
                picking.current.marker = marker
            }
        }

        triggerRepaint()
    }

    const unloadContext = async (node: SceneNode) => {
        picking.current.marker?.remove()
        picking.current.cancel()
        picking.current.marker = null

        setIsSelectingPoint(false)

        node.freezePageContext()

        triggerRepaint()
    }

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext(node as SceneNode)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [node])

    const handleSetName = (e: React.ChangeEvent<HTMLInputElement>) => {
        pageContext.current.name = e.target.value
        triggerRepaint()
    }

    const handleSetDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        pageContext.current.description = e.target.value
        triggerRepaint()
    }

    const updateCoords = () => {
        const pc = pageContext.current

        let converted: { x: number, y: number } | null = null
        if (pc.basePoint[0] && pc.basePoint[1] && pc.epsg) {
            const epsg = pc.epsg
            const epsgString = epsg.toString()

            // Check if EPSG is valid
            if (epsg < 1000 || epsg > 32767) converted = null

            // Additional length check - most EPSG codes are 4-5 digits
            else if (epsgString.length < 4) converted = null

            // Try to reproject coordinate
            else converted = convertCoordinate(pc.basePoint[0], pc.basePoint[1], '4326', epsgString)
        }
        setConvertedCoord(converted)
    }

    const handleSetEPSG = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pc = pageContext.current
        pc.epsg = parseInt(e.target.value)
        updateCoords()
        triggerRepaint()
    }

    const handleSetBasePointLon = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pc = pageContext.current
        pc.basePoint[0] = parseFloat(e.target.value)
        updateCoords()
        triggerRepaint()
    }

    const handleSetBasePointLat = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pc = pageContext.current
        pc.basePoint[1] = parseFloat(e.target.value)
        updateCoords()
        triggerRepaint()
    }

    const handleBasePointPicking = () => {
        if (isSelectingPoint) {
            setIsSelectingPoint(false)
            picking.current.cancel()
            picking.current.cancel = () => { }
            return
        }

        clearMapMarkers()
        picking.current.marker = null

        picking.current.cancel = pickingFromMap({ color: '#FF0000' }, (marker) => {
            picking.current.marker = marker

            // Update converted coordinates
            const pc = pageContext.current
            const bp = marker.getLngLat()
            pc.basePoint = [bp.lng, bp.lat]
            updateCoords()
            setIsSelectingPoint(false)
        })

        // Update State
        setIsSelectingPoint(true)
    }

    const handleBasePointDrawing = () => {
        if (!pageContext.current.basePoint[0] || !pageContext.current.basePoint[1]) return

        const markerCoords = [pageContext.current.basePoint[0], pageContext.current.basePoint[1]] as [number, number]

        clearMapMarkers()
        addMapMarker(markerCoords)
    }

    const handleAddGridLayer = () => {
        const pc = pageContext.current
        if (!pc) return

        const gridLayers = pc.gridLayers
        gridLayers[gridLayers.length] = { id: gridLayers.length, width: '', height: '' }
        triggerRepaint()
    }

    const handleUpdateWidth = (id: number, width: string) => {
        const pc = pageContext.current
        if (!pc) return

        const gridLayers = pc.gridLayers
        if (id >= gridLayers.length) gridLayers[id] = { id, width: '', height: '' }

        gridLayers[id].width = width
        const { errors } = validateGridLayers(gridLayers)
        setLayerErrors(errors)
        triggerRepaint()
    }

    const handleUpdateHeight = (id: number, height: string) => {
        const pc = pageContext.current
        if (!pc) return

        const gridLayers = pc.gridLayers
        if (id >= gridLayers.length) gridLayers[id] = { id, width: '', height: '' }

        gridLayers[id].height = height
        const { errors } = validateGridLayers(gridLayers)
        setLayerErrors(errors)
        triggerRepaint()
    }

    const handleRemoveLayer = (id: number) => {
        const pc = pageContext.current
        if (!pc) return
        if (id >= pageContext.current.gridLayers.length) return

        // Remove the layer with the specified id
        pc.gridLayers = pc.gridLayers.filter(layer => layer.id !== id)

        // Reorder grid layers
        pc.gridLayers.forEach((layer, index) => layer.id = index)

        const { errors } = validateGridLayers(pc.gridLayers)
        setLayerErrors(errors)
        triggerRepaint()
    }

    const resetForm = async () => {
        await (node as SceneNode).deletePageContext()

        pageContext.current = new SchemasPageContext()
        picking.current.marker?.remove()

        setFormErrors({
            name: false,
            epsg: false,
            description: false,
            coordinates: false,
        })
        setLayerErrors({})
        setGeneralMessage(null)
        setConvertedCoord(null)
        setIsSelectingPoint(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const pc = pageContext.current
        const validation = validateSchemaForm({
            name: pc.name,
            convertedCoord,
            epsg: pc.epsg!,
            gridLayerInfos: pc.gridLayers,
            lon: pc.basePoint[0] !== null ? pc.basePoint[0].toString() : '',
            lat: pc.basePoint[1] !== null ? pc.basePoint[1].toString() : '',
        })

        if (!validation.isValid) {
            setFormErrors(validation.errors)
            setGeneralMessage(validation.generalError)
            return
        }

        const schemaData: GridSchema = {
            name: pc.name,
            epsg: pc.epsg!,
            starred: false,
            description: pc.description,
            base_point: [convertedCoord!.x, convertedCoord!.y],
            grid_info: pc.gridLayers.map(layer => [parseFloat(layer.width), parseFloat(layer.height)]),
        }

        setGeneralMessage('Submitting data...')

        const res = await apis.schema.createSchema.fetch(schemaData, node.tree.isPublic)
        if (res.success === false) {
            console.error(res.message)
            setGeneralMessage(`Failed to create schema: ${res.message}`)
        }
        else {
            setGeneralMessage('Created successfully')

            const tree = node.tree as SceneTree
            await tree.alignNodeInfo(node, true)

            setTimeout(async () => {
                await resetForm()
                tree.notifyDomUpdate()
            }, 500)
        }
    }

    return (
        <div className='w-full h-[96vh] flex flex-row'>
            <form onSubmit={handleSubmit} className='w-2/5 h-full flex flex-col'>
                <div className='flex-1 overflow-hidden'>
                    {/* ----------------- */}
                    {/* Page Introduction */}
                    {/* ----------------- */}
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
                                {t('Create New Schema')}
                                <span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">{t(node.tree.isPublic ? 'Public' : 'Private')}</span>
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {schemaTips.map((tip, index) => (
                                        <li key={index}>
                                            {t(Object.values(tip)[0])}
                                        </li>
                                    ))}
                                </ul>
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
                                    {t('New Schema Name')}
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='name'
                                        value={pageContext.current.name}
                                        onChange={handleSetName}
                                        placeholder={t('Enter new schema name')}
                                        className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''
                                            }`}
                                    />
                                </div>
                            </div>
                            {/* ------------------ */}
                            {/* Schema Description */}
                            {/* ------------------ */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    {t('Schema Description (Optional)')}
                                </h2>
                                <div className='space-y-2'>
                                    <Textarea
                                        id='description'
                                        value={pageContext.current.description}
                                        onChange={handleSetDescription}
                                        placeholder={t('Enter schema description')}
                                        className={`w-full text-black border-gray-300 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''
                                            }`}
                                    />
                                </div>
                            </div>
                            {/* --------- */}
                            {/* EPSG Code */}
                            {/* --------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    {t('EPSG Code')}
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='epsg'
                                        placeholder={t('Enter EPSG code (e.g. 4326)')}
                                        className={`text-black w-full border-gray-300 ${formErrors.epsg ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        value={pageContext.current.epsg ? pageContext.current.epsg.toString() : ''}
                                        onChange={handleSetEPSG}
                                    />
                                </div>
                            </div>
                            {/* ----------------------- */}
                            {/* Coordinates (EPSG:4326) */}
                            {/* ----------------------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-black text-lg font-semibold mb-2'>
                                    {t('Coordinates (EPSG:4326)')}
                                </h2>
                                <div className='flex items-stretch gap-4'>
                                    <div className='flex-1 flex flex-col justify-between text-black'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label htmlFor='lon' className='text-sm font-medium w-1/4'>
                                                {t('Longitude')}
                                            </Label>
                                            <Input
                                                id='lon'
                                                type='number'
                                                step='0.000001'
                                                value={pageContext.current.basePoint[0] || ''}
                                                onChange={handleSetBasePointLon}
                                                placeholder={t('Enter longitude')}
                                                className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                            />
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Label htmlFor='lat' className='text-sm font-medium w-1/4'>
                                                {t('Latitude')}
                                            </Label>
                                            <Input
                                                id='lat'
                                                type='number'
                                                step='0.000001'
                                                value={pageContext.current.basePoint[1] || ''}
                                                onChange={handleSetBasePointLat}
                                                placeholder={t('Enter latitude')}
                                                className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className='flex items-center justify-center gap-2'>
                                        {/* ---------------------- */}
                                        {/* Base Point Map Drawing */}
                                        {/* ---------------------- */}
                                        <Button
                                            type='button'
                                            onClick={handleBasePointDrawing}
                                            disabled={!pageContext.current.basePoint[0] || !pageContext.current.basePoint[1]}
                                            className={`w-[80px] h-[84px] shadow-sm bg-sky-500 hover:bg-sky-600 text-white cursor-pointer`}
                                        >
                                            <div className='flex flex-col items-center'>
                                                <MapPin className='h-8 w-8 mb-1 stroke-2' />
                                                <span>{t('Draw')}</span>
                                            </div>
                                        </Button>
                                        {/* ---------------------- */}
                                        {/* Base Point Map Picking */}
                                        {/* ---------------------- */}
                                        <Button
                                            type='button'
                                            onClick={handleBasePointPicking}
                                            className={`w-[80px] h-[84px] shadow-sm ${isSelectingPoint
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                                } text-white cursor-pointer`}
                                        >
                                            <div className='flex flex-col items-center'>
                                                {isSelectingPoint ? (
                                                    <X className='h-8 w-8 mb-1 font-bold stroke-6' />
                                                ) : (
                                                    <Crosshair className='h-8 w-8 mb-1 stroke-2' />
                                                )}
                                                <span>
                                                    {isSelectingPoint
                                                        ? t('Cancel')
                                                        : t('Pick')
                                                    }
                                                </span>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {/* --------------------- */}
                            {/* Converted Coordinates */}
                            {/* --------------------- */}
                            {convertedCoord &&
                                <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-black'>
                                    <h2 className='text-lg font-semibold mb-2'>
                                        {t('Converted Coordinate')} (EPSG:{pageContext.current.epsg ? pageContext.current.epsg.toString() : ''}
                                        )
                                    </h2>
                                    <div className='flex-1 flex flex-col justify-between'>
                                        <div className='flex items-center gap-2 mb-2 '>
                                            <Label className='text-sm font-medium w-1/4'>X</Label>
                                            <div className='w-3/4 p-2 bg-gray-100 rounded border border-gray-300'>
                                                {convertedCoord.x}
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            <Label className='text-sm font-medium w-1/4'>Y</Label>
                                            <div className='w-3/4 p-2 bg-gray-100 rounded border border-gray-300'>
                                                {convertedCoord.y}
                                            </div>
                                        </div>
                                    </div>
                                </div>}
                            {/* ----------- */}
                            {/* Grid Layers */}
                            {/* ----------- */}
                            <div className='p-3 bg-white text-black rounded-md shadow-sm border border-gray-200'>
                                <div className='flex justify-between items-center mb-2'>
                                    <h3 className='text-lg font-semibold'>{t(gridLevelText.title)}</h3>
                                    <Button
                                        type='button'
                                        className='px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                                        onClick={handleAddGridLayer}
                                    >
                                        <span className='text-lg'>+</span> {t(gridLevelText.addButton)}
                                    </Button>
                                </div>
                                {/* ---------- */}
                                {/* Grid Layer */}
                                {/* ---------- */}
                                {pageContext.current.gridLayers.length > 0 ? (
                                    <div className='space-y-3'>
                                        {pageContext.current.gridLayers.map(layer => (
                                            <div key={layer.id} className='p-2 bg-gray-50 rounded border border-gray-200'>
                                                <div className='flex justify-between items-center mb-2'>
                                                    <h4 className='text-sm font-medium'>{t(gridItemText.level)} {layer.id + 1}</h4>
                                                    <Button
                                                        type='button'
                                                        className='px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs cursor-pointer'
                                                        onClick={() => handleRemoveLayer(layer.id)}
                                                    >
                                                        {t(gridItemText.remove)}
                                                    </Button>
                                                </div>
                                                <div className='grid grid-cols-2 gap-2'>
                                                    <div>
                                                        <label className='block text-xs mb-1'>{t(gridItemText.width)}</label>
                                                        <input
                                                            type='number'
                                                            className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                            value={layer.width}
                                                            onChange={(e) => handleUpdateWidth(layer.id, e.target.value)}
                                                            placeholder={t(gridItemText.widthPlaceholder)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className='block text-xs mb-1'>{t(gridItemText.height)}</label>
                                                        <input
                                                            type='number'
                                                            className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                            value={layer.height}
                                                            onChange={(e) => handleUpdateHeight(layer.id, e.target.value)}
                                                            placeholder={t(gridItemText.heightPlaceholder)}
                                                        />
                                                    </div>
                                                </div>
                                                {layerErrors[layer.id] && (
                                                    <div className='mt-2 p-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200'>
                                                        {t(layerErrors[layer.id])}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='text-sm text-gray-500 text-center py-2'>
                                        {t(gridLevelText.noLayers)}
                                    </div>
                                )}
                                {/* ----------------------- */}
                                {/* Grid Layer Adding Rules */}
                                {/* ----------------------- */}
                                {pageContext.current.gridLayers.length > 0 && (
                                    <div className='mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200'>
                                        <p>{t(gridLevelText.rulesTitle)}</p>
                                        <ul className='list-disc pl-4 mt-1'>
                                            <li>
                                                {t(gridLevelText.rule1)}
                                            </li>
                                            <li>
                                                {t(gridLevelText.rule2)}
                                            </li>
                                            <li>
                                                {t(gridLevelText.rule3)}
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {/* --------------- */}
                            {/* General Message */}
                            {/* --------------- */}
                            {generalMessage &&
                                <div
                                    className={`p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
                                >
                                    {t(generalMessage || '')}
                                </div>
                            }
                            {/* ------ */}
                            {/* Submit */}
                            {/* ------ */}
                            <div className='mt-4'>
                                <Button
                                    type='submit'
                                    className='w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                >
                                    <Save className='h-4 w-4 mr-2' />
                                    {t('Create and Back')}
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </form>
            <div className='w-3/5 h-full py-4 pr-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200' />
            </div>
        </div>
    )
}