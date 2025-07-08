import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, SquaresExclude, SquaresIntersect } from "lucide-react";
import { useCallback, useState } from "react";
import { ExtendedFormErrors, PatchesPageProps, RectangleCoordinates } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import CoordinateBox from "./coordinateBox";
import { formatCoordinate } from "./utils";
import MapContainer from "@/components/mapContainer/mapContainer";

const patchTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

const drawPatchTips = {
    drawing: 'Click to cancel rectangle drawing',
    redraw: 'Delete rectangle and redraw',
    draw: 'Click to draw rectangle',
    instructions: {
        title: 'Drawing method:',
        step1: 'Click on the map to set starting point',
        step2: 'Move the mouse to desired location',
        step3: 'Click again to complete drawing'
    }
};

export default function PatchesPage({
    node
}: PatchesPageProps) {

    let bgColor = 'bg-red-50';
    let textColor = 'text-red-700';
    let borderColor = 'border-red-200';

    const [name, setName] = useState('');
    const [epsg, setEpsg] = useState('');
    const [description, setDescription] = useState('');
    const [epsgFromProps, setEpsgFromProps] = useState<boolean>(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<ExtendedFormErrors>({
        name: false,
        schemaName: false,
        description: false,
        coordinates: false,
        epsg: false,
    });

    const [expandedRectangle, setExpandedRectangle] = useState<RectangleCoordinates | null>(null);
    const [convertedRectangle, setConvertedRectangle] = useState<RectangleCoordinates | null>(null);

    const [isError, setIsError] = useState<boolean>(false);
    const [eastValue, setEastValue] = useState<string>('');
    const [westValue, setWestValue] = useState<string>('');
    const [northValue, setNorthValue] = useState<string>('');
    const [southValue, setSouthValue] = useState<string>('');
    const [center, setCenter] = useState<{ x: number; y: number } | null>(null);

    const formatSingleValue = (value: number): string => value.toFixed(6);

    const coordinateBoxTexts = {
        drawButton: {
            start: 'Draw Rectangle',
            cancel: 'Cancel Drawing',
        },
        coordinates: {
            wgs84: `Original Bounds (EPSG:${epsg})`,
            expanded: `Adjusted Coordinates (EPSG:${epsg})`,
        },
    };

    if (
        generalError?.includes('正在提交数据') ||
        generalError?.includes('Submitting data')
    ) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        borderColor = 'border-orange-200';
    } else if (
        generalError?.includes('创建成功') ||
        generalError?.includes('created successfully') ||
        generalError?.includes('Created successfully')
    ) {
        bgColor = 'bg-green-50';
        textColor = 'text-green-700';
        borderColor = 'border-green-200';
    }

    // const handleButtonClick = () => {
    //     handleDrawRectangle(!isDrawing);
    // };


    const drawExpandedRectangleOnMap = useCallback(() => {
        console.log('drawExpandedRectangleOnMap')
    }, [])

    const handleAdjustAndDraw = useCallback(() => {
        console.log('handleAdjustAndDraw')
    }, [])

    const handleDrawRectangle = useCallback(() => {
        console.log('handleDrawRectangle')
    }, []);

    const handleSubmit = () => {
        console.log('点击了submit')
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
                            <Avatar className='bg-blue-500 h-28 w-28 border-2 border-white'>
                                <AvatarFallback className='bg-blue-500'>
                                    <SquaresExclude className='h-15 w-15 text-white' />
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
                            <h1 className='font-bold text-[25px]'>Create New Schema {node.tree.isPublic ? '(Public)' : '(Private)'}</h1>
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
                                            // value={pageContext.current.name}
                                            // onChange={handleSetName}
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
                                            // value={pageContext.current.description}
                                            // onChange={handleSetDescription}
                                            placeholder={'Enter patch description'}
                                            className={`w-full text-black border-gray-300 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                                            // value={pageContext.current.epsg ? pageContext.current.epsg.toString() : ''}
                                            // onChange={handleSetEPSG}
                                            placeholder='EPSG Code'
                                            className={`text-black w-full border-gray-300 ${formErrors.epsg ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                                                    value={pageContext.current.basePoint[0] || ''}
                                                    onChange={handleSetBasePointLon}
                                                    placeholder={'Enter longitude'}
                                                    className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                        }`}
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
                                                    value={pageContext.current.basePoint[1] || ''}
                                                    onChange={handleSetBasePointLat}
                                                    placeholder={'Enter latitude'}
                                                    className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                />
                                            </div>
                                        </div>
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
                                                    <MapPin className='h-8 w-8 mb-1 stroke-2' />
                                                )}
                                                <span>
                                                    {isSelectingPoint
                                                        ? 'Cancel'
                                                        : 'Draw'
                                                    }
                                                </span>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                                {/* --------------------- */}
                                {/* Converted Coordinates */}
                                {/* --------------------- */}
                                {convertedCoord &&
                                    <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-black'>
                                        <h2 className='text-lg font-semibold mb-2'>
                                            Converted Coordinate (EPSG:{pageContext.current.epsg ? pageContext.current.epsg.toString() : ''}
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
                                        <h3 className='text-lg font-semibold'>{gridLevelText.title}</h3>
                                        <Button
                                            type='button'
                                            className='px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                                            onClick={handleAddGridLayer}
                                        >
                                            <span className='text-lg'>+</span> {gridLevelText.addButton}
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
                                                        <h4 className='text-sm font-medium'>{gridItemText.level} {layer.id + 1}</h4>
                                                        <Button
                                                            type='button'
                                                            className='px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs cursor-pointer'
                                                            onClick={() => handleRemoveLayer(layer.id)}
                                                        >
                                                            {gridItemText.remove}
                                                        </Button>
                                                    </div>
                                                    <div className='grid grid-cols-2 gap-2'>
                                                        <div>
                                                            <label className='block text-xs mb-1'>{gridItemText.width}</label>
                                                            <input
                                                                type='number'
                                                                className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                                value={layer.width}
                                                                onChange={(e) => handleUpdateWidth(layer.id, e.target.value)}
                                                                placeholder={gridItemText.widthPlaceholder}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className='block text-xs mb-1'>{gridItemText.height}</label>
                                                            <input
                                                                type='number'
                                                                className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                                                                value={layer.height}
                                                                onChange={(e) => handleUpdateHeight(layer.id, e.target.value)}
                                                                placeholder={gridItemText.heightPlaceholder}
                                                            />
                                                        </div>
                                                    </div>
                                                    {layerErrors[layer.id] && (
                                                        <div className='mt-2 p-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200'>
                                                            {layerErrors[layer.id]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='text-sm text-gray-500 text-center py-2'>
                                            {gridLevelText.noLayers}
                                        </div>
                                    )}
                                    {/* ----------------------- */}
                                    {/* Grid Layer Adding Rules */}
                                    {/* ----------------------- */}
                                    {pageContext.current.gridLayers.length > 0 && (
                                        <div className='mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200'>
                                            <p>{gridLevelText.rulesTitle}</p>
                                            <ul className='list-disc pl-4 mt-1'>
                                                <li>
                                                    {gridLevelText.rule1}
                                                </li>
                                                <li>
                                                    {gridLevelText.rule2}
                                                </li>
                                                <li>
                                                    {gridLevelText.rule3}
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {/* --------------- */}
                                {/* General Message */}
                                {/* --------------- */}
                                {generalMessage &&
                                    <>
                                        <div
                                            className={`p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
                                        >
                                            {generalMessage}
                                        </div>
                                    </>
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
                </div>
            </form>
            <div className='w-3/5 h-full py-4 pr-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}