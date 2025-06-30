import React, { useCallback, useState } from 'react'
import {
    PatchNameCard,
    PatchDescriptionCard,
    BelongToProjectCard,
    ProjectEpsgCard,
    ProjectErrorMessage
} from './createPatchComponents'
import PatchBounds from './patchBounds'
import CoordinateBox from './coordinateBox'
import { Button } from '../ui/button'
import { Save, SquaresIntersect } from 'lucide-react'
import { CreatePatchFunctionAreaProps, ExtendedFormErrors, RectangleCoordinates } from './types'
import { formatCoordinate } from './utils'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback } from '../ui/avatar'

const patchTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

export default function CreatePatchFunctionArea({ mapInstance, remountMap }: CreatePatchFunctionAreaProps & { remountMap: () => void }) {
    const [name, setName] = useState('');
    const [epsg, setEpsg] = useState('');
    const [description, setDescription] = useState('');
    const [epsgFromProps, setEpsgFromProps] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<ExtendedFormErrors>({
        name: false,
        schemaName: false,
        description: false,
        coordinates: false,
        epsg: false,
    });
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [expandedRectangle, setExpandedRectangle] = useState<RectangleCoordinates | null>(null);
    const [convertedRectangle, setConvertedRectangle] = useState<RectangleCoordinates | null>(null);

    const texts = {
        drawButton: {
            start: 'Draw Rectangle',
            cancel: 'Cancel Drawing',
        },
        coordinates: {
            wgs84: `Original Bounds (EPSG:${epsg})`,
            expanded: `Adjusted Coordinates (EPSG:${epsg})`,
        },
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

    return (
        <form onSubmit={handleSubmit} className="pt-0 w-2/5 h-full">
            <ScrollArea className="h-full">
                <div className="h-50 w-full border-b border-gray-700 flex flex-row">
                    <div className="w-1/3 h-full flex justify-center items-center">
                        <Avatar className="bg-[#007ACC] h-28 w-28 border-2 border-white">
                            <AvatarFallback>
                                <SquaresIntersect  className="h-15 w-15 text-white" />
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
                    <PatchNameCard
                        name={name}
                        hasError={formErrors.name}
                        onChange={setName}
                    />

                    <PatchDescriptionCard
                        description={description}
                        hasError={formErrors.description}
                        onChange={setDescription}
                    />

                    {/* <BelongToProjectCard
                    projectName={parentProject?.name || ''}
                /> */}

                    <ProjectEpsgCard
                        epsg={epsg}
                        hasError={formErrors.epsg}
                        onChange={setEpsg}
                        epsgFromProps={epsgFromProps}
                        formErrors={formErrors}
                    />

                    {/* <PatchBounds
                    isDrawing={isDrawing}
                    rectangleCoordinates={rectangleCoordinates!}
                    onDrawRectangle={handleDrawRectangle}
                    onAdjustAndDraw={handleAdjustAndDraw}
                    convertedRectangle={convertedRectangle}
                    setConvertedRectangle={setConvertedRectangle}
                    drawExpandedRectangleOnMap={drawExpandedRectangleOnMap}
                /> */}

                    {convertedRectangle && (
                        <CoordinateBox
                            title={texts.coordinates.wgs84}
                            coordinates={convertedRectangle}
                            formatCoordinate={formatCoordinate}
                        />
                    )}

                    {expandedRectangle && epsg !== '4326' && (
                        // rectangleCoordinates &&
                        <CoordinateBox
                            title={texts.coordinates.expanded}
                            coordinates={expandedRectangle}
                            formatCoordinate={formatCoordinate}
                        />
                    )}

                    <ProjectErrorMessage message={generalError} />

                    <Button
                        type="submit"
                        className="w-full mt-4 bg-green-500 hover:bg-green-600 items-center text-white cursor-pointer"
                    >
                        <Save className="h-4 w-4" />Create and Back
                    </Button>
                </div>
            </ScrollArea>
        </form>
    )
}
