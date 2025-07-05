import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, SquaresIntersect } from "lucide-react";
import { useCallback, useState } from "react";
import { ExtendedFormErrors, RectangleCoordinates } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import CoordinateBox from "./coordinateBox";
import { formatCoordinate } from "./utils";

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

export default function PatchesPage({ }) {

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

    const handleButtonClick = () => {
        handleDrawRectangle(!isDrawing);
    };


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

    <form onSubmit={handleSubmit} className="pt-0 w-2/5 h-full">
        <ScrollArea className="h-full">
            <div className="h-50 w-full border-b border-gray-700 flex flex-row">
                <div className="w-1/3 h-full flex justify-center items-center">
                    <Avatar className="bg-[#007ACC] h-28 w-28 border-2 border-white">
                        <AvatarFallback>
                            <SquaresIntersect className="h-15 w-15 text-white" />
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="w-2/3 h-full p-4 space-y-2 text-white">
                    <h1 className="font-bold text-3xl">Create New Schema</h1>
                    <div className="  text-sm p-2 px-4 w-full">
                        <ul className="list-disc space-y-1">
                            {patchTips.map((tip, index) => (
                                <li key={index}>
                                    {Object.values(tip)[0]}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="w-2/3 mx-auto mt-4 mb-4 space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-2">
                        New Patch Name
                    </h2>
                    <div className="space-y-2">
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={'Enter new patch name'}
                            className={`w-full ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                        />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Patch Description
                    </h2>
                    <div className="space-y-2">
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={'Enter description information'}
                            className={`w-full ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                        />
                    </div>
                </div>
                {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mt-4 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-2">
                        Belong To Schema
                    </h2>
                    <div className="space-y-2">
                        <Input
                            id="belongToProject"
                            value={node.schemaName}
                            readOnly
                            className="w-full bg-gray-100"
                        />
                    </div>
                </div> */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Target Coordinate System (EPSG)
                    </h2>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <span className="mr-2">EPSG:</span>
                            <Input
                                id="epsg"
                                placeholder={'e.g. 3857'}
                                className={`w-full ${formErrors.epsg || (formErrors && formErrors.epsg) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                    } ${epsgFromProps ? 'bg-gray-100' : ''}`}
                                value={epsg}
                                onChange={(e) => !epsgFromProps && setEpsg(e.target.value)}
                                readOnly={epsgFromProps}
                            />
                        </div>
                        {formErrors && formErrors.epsg && (
                            <p className="text-red-500 text-sm mt-1">
                                Please enter a valid EPSG code
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Patch Bounds
                    </h2>
                    <div>
                        <div className="mb-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                            <div className="font-bold text-md mb-2">
                                Method One: Draw to generate
                            </div>
                            <button
                                className={`w-full py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${isDrawing
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : rectangleCoordinates
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                onClick={handleButtonClick}
                            >
                                {isDrawing
                                    ? drawPatchTips.drawing
                                    : rectangleCoordinates
                                        ? drawPatchTips.redraw
                                        : drawPatchTips.draw}
                            </button>

                            {isDrawing && (
                                <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-800">
                                    <p>
                                        {drawPatchTips.instructions.title}
                                    </p>
                                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                                        <li>
                                            {drawPatchTips.instructions.step1}
                                        </li>
                                        <li>
                                            {drawPatchTips.instructions.step2}
                                        </li>
                                        <li>
                                            {drawPatchTips.instructions.step3}
                                        </li>
                                    </ol>
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
                                                setConvertedRectangle({
                                                    northEast: [eVal, n],
                                                    southWest: [w, s],
                                                    southEast: [eVal, s],
                                                    northWest: [w, n],
                                                    center: [(w + eVal) / 2, (s + n) / 2],
                                                });
                                            }
                                        }}
                                        className="w-full text-center border border-gray-500 rounded-sm h-[22px]"
                                        placeholder={
                                            'Enter max Y'
                                        }
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
                                        placeholder={
                                            'Enter mix X'
                                        }
                                        step="any"
                                    />
                                </div>
                                {/* Center */}
                                <div className="text-center">
                                    <span className="font-bold text-[#FF8F2E] text-xl">
                                        Center
                                    </span>
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
                                        placeholder={
                                            'Enter max X'
                                        }
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
                                        placeholder={
                                            'Enter max X'
                                        }
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
                                onClick={() => {
                                    handleAdjustAndDraw(northValue, southValue, eastValue, westValue);
                                    if (drawExpandedRectangleOnMap) {
                                        drawExpandedRectangleOnMap();
                                    }
                                }}
                            >
                                Click
                            </button>
                        </div>
                    </div>
                </div>

                {convertedRectangle && (
                    <CoordinateBox
                        title={coordinateBoxTexts.coordinates.wgs84}
                        coordinates={convertedRectangle}
                        formatCoordinate={formatCoordinate}
                    />
                )}

                {expandedRectangle && epsg !== '4326' && (
                    <CoordinateBox
                        title={coordinateBoxTexts.coordinates.expanded}
                        coordinates={expandedRectangle}
                        formatCoordinate={formatCoordinate}
                    />
                )}

                {generalError &&
                    <div className={`mt-4 p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}>
                        {generalError}
                    </div>
                }

                <Button
                    type="submit"
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 items-center text-white cursor-pointer"
                >
                    <Save className="h-4 w-4" />Create and Back
                </Button>
            </div>
        </ScrollArea>
    </form>
}