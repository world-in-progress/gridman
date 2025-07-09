import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { PatchesPageContext } from "./patches";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, SquaresIntersect } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MapContainer from "@/components/mapContainer/mapContainer";
import { PatchesPageProps, PatchMeta, RectangleCoordinates } from "./types";
import { SceneNode, SceneTree } from "@/components/resourceScene/scene";
import * as apis from '@/core/apis/apis'
import {
    addMapLineBetweenPoints,
    addMapMarker,
    addMapPatchBounds,
    adjustPatchBounds,
    calculateGridCounts,
    clearDrawPatchBounds,
    clearGridLines,
    clearMapMarkers,
    convertSinglePointCoordinate,
    flyToMarker,
    getDrawnRectangleCoordinates,
    startDrawingRectangle,
    stopDrawingRectangle
} from "@/components/mapContainer/utils";

const patchTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

export default function PatchesPage({
    node
}: PatchesPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<PatchesPageContext>(new PatchesPageContext())
    const [generalMessage, setGeneralMessage] = useState<string | null>(null)
    const [formErrors, setFormErrors] = useState<{
        name: boolean
        description: boolean
        bounds: boolean
    }>({
        name: false,
        description: false,
        bounds: false,
    })
    const [isDrawingBounds, setIsDrawingBounds] = useState(false)

    const convertedRectangle = useRef<RectangleCoordinates | null>(null);
    const adjustedRectangle = useRef<RectangleCoordinates | null>(null);

    const schemaEPSG = useRef<string>('')
    const schemaBasePoint = useRef<[number, number]>([0, 0])
    const schemaGridLevel = useRef<[number, number]>([0, 0])
    const schemaMarkerPoint = useRef<[number, number]>([0, 0])
    const drawCoordinates = useRef<RectangleCoordinates | null>(null)

    const [eastValue, setEastValue] = useState<string>('');
    const [westValue, setWestValue] = useState<string>('');
    const [northValue, setNorthValue] = useState<string>('');
    const [southValue, setSouthValue] = useState<string>('');
    const [center, setCenter] = useState<{ x: number; y: number } | null>(null);

    const [isError, setIsError] = useState<boolean>(false);



    ///////////////////////////////////////////////////////////////////////////////

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

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext(node as SceneNode)
        }
    }, [node])

    const loadContext = (node: SceneNode) => {
        pageContext.current = node.pageContext as PatchesPageContext
        const pc = pageContext.current

        schemaEPSG.current = pc.schema!.epsg.toString()
        schemaGridLevel.current = pc.schema!.grid_info[0]
        schemaBasePoint.current = pc.schema!.base_point
        schemaMarkerPoint.current = convertSinglePointCoordinate(schemaBasePoint.current, schemaEPSG.current, '4326')
        flyToMarker(schemaMarkerPoint.current, 11)

        console.log('pc.originBounds', pc.originBounds)
        console.log('pc.adjustedBounds', pc.adjustedBounds)

        if (pc.originBounds && pc.adjustedBounds) {
            addMapPatchBounds(pc.originBounds)
            addMapPatchBounds(pc.adjustedBounds, 'adjusted-bounds')
            const adjustedSWPoint = [pc.adjustedBounds[0], pc.adjustedBounds[1]] as [number, number]
            addMapLineBetweenPoints(schemaMarkerPoint.current, adjustedSWPoint, pageContext.current.widthCount, pageContext.current.heightCount)
            addMapMarker(adjustedSWPoint, { color: 'red', draggable: false })
        }
    }

    const unloadContext = (node: SceneNode) => {
        clearDrawPatchBounds()
        clearMapMarkers()
        clearGridLines()
    }

    // Draw adjusted bounds, aligned LB marker and grid counts line on map after drawing original bounds
    useEffect(() => {
        if (drawCoordinates.current !== null) {
            const coords = drawCoordinates.current
            pageContext.current.originBounds = [coords.southWest[0], coords.southWest[1], coords.northEast[0], coords.northEast[1]]

            const drawBounds = [coords?.southWest[0], coords?.southWest[1], coords?.northEast[0], coords?.northEast[1]] as [number, number, number, number]
            if (drawBounds && drawBounds.length === 4 && schemaEPSG.current && schemaBasePoint.current && schemaGridLevel.current) {
                const { convertedBounds, alignedBounds, expandedBounds } = adjustPatchBounds(drawBounds, schemaGridLevel.current, schemaEPSG.current, schemaBasePoint.current)
                convertedRectangle.current = convertedBounds
                adjustedRectangle.current = expandedBounds

                setWestValue(convertedBounds!.southWest[0].toString());
                setSouthValue(convertedBounds!.southWest[1].toString());
                setEastValue(convertedBounds!.northEast[0].toString());
                setNorthValue(convertedBounds!.northEast[1].toString());
                setCenter({ x: convertedBounds!.center[0], y: convertedBounds!.center[1] });

                const alignedSWPoint = convertSinglePointCoordinate(expandedBounds!.southWest, schemaEPSG.current, '4326')
                const alignedNEPoint = convertSinglePointCoordinate(expandedBounds!.northEast, schemaEPSG.current, '4326')
                pageContext.current.adjustedBounds = [alignedSWPoint[0], alignedSWPoint[1], alignedNEPoint[0], alignedNEPoint[1]]
                addMapMarker(alignedSWPoint, { color: 'red', draggable: false })
                const adjustedDrawBoundsOn4326 = [alignedSWPoint[0], alignedSWPoint[1], alignedNEPoint[0], alignedNEPoint[1]] as [number, number, number, number]
                addMapPatchBounds(adjustedDrawBoundsOn4326, 'adjusted-bounds')
                const { widthCount, heightCount } = calculateGridCounts(expandedBounds!.southWest, schemaBasePoint.current, schemaGridLevel.current)
                pageContext.current.widthCount = widthCount
                pageContext.current.heightCount = heightCount
                addMapLineBetweenPoints(schemaMarkerPoint.current, alignedSWPoint, widthCount, heightCount)
                triggerRepaint()
            }
        }
    }, [drawCoordinates.current])

    const formatSingleValue = (value: number): string => value.toFixed(6);

    const formatCoordinate = (coord: [number, number] | undefined) => {
        if (!coord) return '---';
        return `[${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`;
    };

    const handleSetName = (e: React.ChangeEvent<HTMLInputElement>) => {
        pageContext.current.name = e.target.value
        triggerRepaint()
    }

    const handleSetDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        pageContext.current.description = e.target.value
        triggerRepaint()
    }

    const handleDrawBounds = () => {
        if (isDrawingBounds) {
            setIsDrawingBounds(false)
            stopDrawingRectangle()
            document.removeEventListener('rectangle-draw-complete', onDrawComplete);
            return
        } else {
            setIsDrawingBounds(true)
            clearMapMarkers()
            addMapMarker(schemaMarkerPoint.current)
            clearGridLines()
            clearDrawPatchBounds()
            startDrawingRectangle()
            document.addEventListener('rectangle-draw-complete', onDrawComplete);
        }
    };

    const onDrawComplete = (event: Event) => {
        const customEvent = event as CustomEvent<{ coordinates: RectangleCoordinates | null }>;
        handleDrawComplete(customEvent.detail.coordinates);
    };



    const handleDrawComplete = (coords: RectangleCoordinates | null) => {
        if (coords) {
            drawCoordinates.current = coords
            addMapPatchBounds([coords.southWest[0], coords.southWest[1], coords.northEast[0], coords.northEast[1]], '4326')
        }
        document.removeEventListener('rectangle-draw-complete', onDrawComplete);
        setIsDrawingBounds(false);
        stopDrawingRectangle()
        triggerRepaint()
    }
    
    const drawBoundsByParams = () => {
        clearMapMarkers()
        addMapMarker(schemaMarkerPoint.current)
        // addMapPatchBounds()
        // addMapPatchBounds()
    }

    const resetForm = () => {
        console.log('我要清空表单')
        // const db = store.get<ContextStorage>('contextDB')!
        // db.delete(node)

        // pageContext.current = new SchemasPageContext()
        // picking.current.marker?.remove()

        // setFormErrors({
        //     name: false,
        //     epsg: false,
        //     description: false,
        //     coordinates: false,
        // })
        // setLayerErrors({})
        // setGeneralMessage(null)
        // setConvertedCoord(null)
        // setIsSelectingPoint(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        console.log('点击了submit')
        e.preventDefault()

        const pc = pageContext.current
        const validation = validatePatchForm({})

        const patchData: PatchMeta = {
            name: pc.name!,
            starred: false,
            description: pc.description,
            bounds: pc.adjustedBounds!
        }

        setGeneralMessage('Submitting data...')

        const res = await apis.patch.createPatch.fetch({projectName: pc.schema!.name, patchMeta: patchData}, node.tree.isPublic)
        if (res.success === false) {
            console.error(res.message)
            setGeneralMessage(`Failed to create patch: ${res.message}`)
        } else {
            setGeneralMessage('Created successfully')

            const tree = node.tree as SceneTree
            await tree.alignNodeInfo(node, true)

            setTimeout(() => {
                resetForm()
                tree.notifyDomUpdate()
            }, 500)
        }
    };

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
                            <Avatar className=' h-28 w-28 border-2 border-white'>
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
                                Create New Schema
                                <span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">{node.tree.isPublic ? 'Public' : 'Private'}</span>
                                <span>[{node.parent?.name}]</span>
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {patchTips.map((tip, index) => (
                                        <li key={index}>
                                            {Object.values(tip)[0]}
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
                            {/* Patch Name */}
                            {/* ----------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    New Patch Name
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='name'
                                        value={pageContext.current.name}
                                        onChange={handleSetName}
                                        placeholder={'Enter new patch name'}
                                        className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                            {/* ------------------ */}
                            {/* Patch Description */}
                            {/* ------------------ */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    Patch Description (Optional)
                                </h2>
                                <div className='space-y-2'>
                                    <Textarea
                                        id='description'
                                        value={pageContext.current.description}
                                        onChange={handleSetDescription}
                                        placeholder={'Enter patch description'}
                                        className={`w-full text-black border-gray-300 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                            {/* --------- */}
                            {/* Belong To Schema */}
                            {/* --------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    Belong To Schema
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='schema'
                                        value={pageContext.current.schema?.name}
                                        // onChange={handleSetEPSG}
                                        placeholder='Schema Name'
                                        className={`text-black w-full border-gray-300`}
                                    />
                                </div>
                            </div>
                            {/* --------- */}
                            {/* EPSG Code */}
                            {/* --------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    EPSG Code
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='epsg'
                                        value={pageContext.current.schema?.epsg.toString()}
                                        readOnly={true}
                                        placeholder='EPSG Code'
                                        className={`text-black w-full border-gray-300`}
                                    />
                                </div>
                            </div>
                            {/* --------- */}
                            {/* Patch Bounds */}
                            {/* --------- */}
                            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <h2 className="text-lg font-semibold mb-2">
                                    Patch Bounds
                                </h2>
                                <div className="space-y-2">
                                    <div className="p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                        <div className="font-bold text-md mb-2">
                                            Method One: Draw to generate
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDrawBounds}
                                            className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${isDrawingBounds
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        >
                                            {isDrawingBounds
                                                ? 'Click to cancel rectangle drawing'
                                                : 'Click to draw rectangle'}
                                        </button>
                                        {isDrawingBounds && (
                                            <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200 text-xs text-yellow-800">
                                                <p>Drawing method:</p>
                                                <ul className="list-disc pl-4 mt-1">
                                                    <li>
                                                        Click on the map to set starting point
                                                    </li>
                                                    <li>
                                                        Move the mouse to desired location
                                                    </li>
                                                    <li>
                                                        Click again to complete drawing
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <Separator className="h-px mb-2 bg-gray-300" />
                                    <div className=" p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                        <div className="mb-2 font-bold text-md">
                                            Method Two: Input parameters to generate
                                        </div>
                                        <div className="grid grid-cols-3 mb-2 gap-1 text-xs">
                                            {/* Top Left Corner */}
                                            <div className="relative h-12 flex items-center justify-center">
                                                <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
                                            </div>
                                            {/* North/Top - northEast[1] */}
                                            <div className="text-center -mt-2">
                                                <span className="font-bold text-blue-600 text-xl">
                                                    N
                                                </span>
                                                {/* Input for North */}
                                                <input
                                                    type="number"
                                                    value={northValue}
                                                    onChange={(e) => {
                                                        setNorthValue(e.target.value);
                                                        const n = parseFloat(e.target.value);
                                                        const s = parseFloat(southValue);
                                                        const eVal = parseFloat(eastValue);
                                                        const w = parseFloat(westValue);
                                                        if (!isNaN(n) && !isNaN(s) && !isNaN(eVal) && !isNaN(w)) {
                                                            convertedRectangle.current = {
                                                                northEast: [eVal, n],
                                                                southWest: [w, s],
                                                                southEast: [eVal, s],
                                                                northWest: [w, n],
                                                                center: [(w + eVal) / 2, (s + n) / 2],
                                                            };
                                                        }
                                                    }}
                                                    className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                                    placeholder={'Enter max Y'}
                                                    step="any"
                                                />
                                            </div>
                                            {/* Top Right Corner */}
                                            <div className="relative h-12 flex items-center justify-center">
                                                <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
                                            </div>
                                            {/* West/Left - southWest[0] */}
                                            <div className="text-center">
                                                <span className="font-bold text-green-600 text-xl">
                                                    W
                                                </span>
                                                {/* Input for West */}
                                                <input
                                                    type="number"
                                                    value={westValue}
                                                    onChange={(e) => setWestValue(e.target.value)}
                                                    className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                                    placeholder={'Enter mix X'}
                                                    step="any"
                                                />
                                            </div>
                                            {/* Center */}
                                            <div className="text-center">
                                                <span className="font-bold text-[#FF8F2E] text-xl">Center</span>
                                                <div
                                                    className={`text-[10px] mt-1 ${isError ? 'text-red-600' : ''
                                                        }`}
                                                >
                                                    {isError
                                                        ? 'Coordinate Error'
                                                        : center
                                                            ? `${formatSingleValue(
                                                                center.x
                                                            )}, ${formatSingleValue(center.y)}`
                                                            : 'Enter bounds'}
                                                </div>
                                            </div>
                                            {/* East/Right - southEast[0] */}
                                            <div className="text-center">
                                                <span className="font-bold text-red-600 text-xl">
                                                    E
                                                </span>
                                                {/* Input for East */}
                                                <input
                                                    type="number"
                                                    value={eastValue}
                                                    onChange={(e) => setEastValue(e.target.value)}
                                                    className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                                    placeholder={'Enter max X'}
                                                    step="any"
                                                />
                                            </div>
                                            {/* Bottom Left Corner */}
                                            <div className="relative h-12 flex items-center justify-center">
                                                <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
                                            </div>
                                            {/* South/Bottom - southWest[1] */}
                                            <div className="text-center mt-2">
                                                <span className="font-bold text-purple-600 text-xl">
                                                    S
                                                </span>
                                                {/* Input for South */}
                                                <input
                                                    type="number"
                                                    value={southValue}
                                                    onChange={(e) => setSouthValue(e.target.value)}
                                                    className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                                    placeholder={'Enter max X'}
                                                    step="any"
                                                />
                                            </div>
                                            {/* Bottom Right Corner */}
                                            <div className="relative h-12 flex items-center justify-center">
                                                <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
                                            </div>
                                        </div>
                                        <button
                                            className="w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                                        onClick={drawBoundsByParams}
                                        >
                                            Click to adjust and draw bounds
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* --------------- */}
                            {/* Original Coordinates */}
                            {/* --------------- */}
                            {convertedRectangle.current &&
                                <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-lg mb-2">Original Bounds (EPSG:{schemaEPSG.current})</h3>
                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                        {/* Top Left Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
                                        </div>
                                        {/* North/Top - northEast[1] */}
                                        <div className="text-center">
                                            <span className="font-bold text-blue-600 text-xl">N</span>
                                            <div>[{formatSingleValue(convertedRectangle.current.northEast[1])}]</div>
                                        </div>
                                        {/* Top Right Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
                                        </div>
                                        {/* West/Left - southWest[0] */}
                                        <div className="text-center">
                                            <span className="font-bold text-green-600 text-xl">W</span>
                                            <div>[{formatSingleValue(convertedRectangle.current.southWest[0])}]</div>
                                        </div>
                                        {/* Center */}
                                        <div className="text-center">
                                            <span className="font-bold text-xl">Center</span>
                                            <div>{formatCoordinate(convertedRectangle.current.center)}</div>
                                        </div>
                                        {/* East/Right - southEast[0] */}
                                        <div className="text-center">
                                            <span className="font-bold text-red-600 text-xl">E</span>
                                            <div>[{formatSingleValue(convertedRectangle.current.northEast[0])}]</div>
                                        </div>
                                        {/* Bottom Left Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
                                        </div>
                                        {/* South/Bottom - southWest[1] */}
                                        <div className="text-center">
                                            <span className="font-bold text-purple-600 text-xl">S</span>
                                            <div>[{formatSingleValue(convertedRectangle.current.southWest[1])}]</div>
                                        </div>
                                        {/* Bottom Right Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {/* --------------- */}
                            {/* Adjusted Coordinates */}
                            {/* --------------- */}
                            {adjustedRectangle.current &&
                                <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-lg mb-2">Adjusted Coordinates (EPSG:{schemaEPSG.current})</h3>
                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                        {/* Top Left Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
                                        </div>
                                        {/* North/Top - northEast[1] */}
                                        <div className="text-center">
                                            <span className="font-bold text-blue-600 text-xl">N</span>
                                            <div>[{formatSingleValue(adjustedRectangle.current.northEast[1])}]</div>
                                        </div>
                                        {/* Top Right Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
                                        </div>
                                        {/* West/Left - southWest[0] */}
                                        <div className="text-center">
                                            <span className="font-bold text-green-600 text-xl">W</span>
                                            <div>[{formatSingleValue(adjustedRectangle.current.southWest[0])}]</div>
                                        </div>
                                        {/* Center */}
                                        <div className="text-center">
                                            <span className="font-bold text-xl">Center</span>
                                            <div>{formatCoordinate(adjustedRectangle.current.center)}</div>
                                        </div>
                                        {/* East/Right - southEast[0] */}
                                        <div className="text-center">
                                            <span className="font-bold text-red-600 text-xl">E</span>
                                            <div>[{formatSingleValue(adjustedRectangle.current.northEast[0])}]</div>
                                        </div>
                                        {/* Bottom Left Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
                                        </div>
                                        {/* South/Bottom - southWest[1] */}
                                        <div className="text-center">
                                            <span className="font-bold text-purple-600 text-xl">S</span>
                                            <div>[{formatSingleValue(adjustedRectangle.current.southWest[1])}]</div>
                                        </div>
                                        {/* Bottom Right Corner */}
                                        <div className="relative h-12 flex items-center justify-center">
                                            <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {/* --------------- */}
                            {/* General Message */}
                            {/* --------------- */}
                            {generalMessage &&
                                <div
                                    className={`p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
                                >
                                    {generalMessage}
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
                                    Create and Back
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </form>
            <div className='w-3/5 h-full py-4 pr-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}