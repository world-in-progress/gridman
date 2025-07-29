import { ISceneNode } from '@/core/scene/iscene'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Dot,
    Info,
    Minus,
    Square,
    Upload,
    RotateCcw,
    Fullscreen,
    SquareCheck,
    Delete,
    TentTree,
    MapPin,
    Crosshair,
    Eye,
    EyeOff,
    Dam,
} from "lucide-react"
import { SolutionsPageProps } from './types'
import { Card, CardContent } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogTrigger,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { Slider } from '@/components/ui/slider'
import { cn } from '@/utils/utils'
import MapContainer from '@/components/mapContainer/mapContainer'
import { SceneNode } from '@/components/resourceScene/scene'
import { SolutionsPageContext } from './solutions'
import { toast } from 'sonner'
import store from '@/store'

const REORDER_TYPE = 'application/x-lum-reorder'

export default function SolutionsPage({ node }: SolutionsPageProps) {

    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<SolutionsPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await SolutionsPageContext.create(node)
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            return
        }

        const nodeKey = e.dataTransfer.getData('text/plain')
        // Upload Grid
        if (nodeKey.split('.')[1] === 'grids') {
            const isAlreadySelected = pageContext.current?.uploadResourcesNodeKey.grid === nodeKey
            if (!isAlreadySelected) {
                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                const map = store.get<mapboxgl.Map>('map')

                if (!map) return

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
            } else {
                toast.info('Grid already selected')
            }
        } else {
            toast.error('Please select the correct grid in grids')
        }

        // Upload DEM

        // Upload LUM
    }



    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[20vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Dam className='w-6 h-6' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">Create New Solution</h2>
                            <p className="text-sm text-slate-500">New Solution Details</p>
                        </div>
                        {/* <div className='flex items-center gap-2'>
                            <Button
                                variant='destructive'
                                className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                            >
                                <Delete className="w-4 h-4 rotate-180" />Delete
                            </Button>
                            <Button
                                className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
                                onClick={fitLumBounds}
                            >
                                <Fullscreen className="w-4 h-4" />Scale
                            </Button>
                        </div> */}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {/* LUM Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">LUM Information</span>
                                {/* <div className="ml-auto">
                                    <Button
                                        className={`cursor-pointer shadow-sm h-8 w-8 ${identifyActive ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-300 hover:bg-sky-300'}`}
                                        onClick={() => {
                                            setIdentifyActive(!identifyActive)
                                        }}
                                        title="Identify Raster Value"
                                    >
                                        <Crosshair className="w-3 h-3" />
                                    </Button>
                                </div> */}
                            </div>
                            <div className="ml-6 space-y-2">
                                {/* Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Name</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        {/* <span className="font-semibold text-slate-900">
                                            {node.name}
                                        </span> */}
                                        <Input
                                            placeholder='Enter name'
                                        />
                                    </div>
                                </div>
                                {/* EPSG */}
                                {/* <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">EPSG</span>
                                    <div className="flex items-center">
                                        <Badge variant="secondary" className={`text-xs font-semibold`}>
                                            {pageContext.current?.lumInfo?.epsg}
                                        </Badge>
                                    </div>
                                </div> */}
                                {/* Legend */}
                                {/* <div className="flex items-start">
                                    <span className="text-sm text-slate-600 w-20 items-center">Legend</span>
                                    <div className="grid grid-cols-2 gap-2 flex-1 mt-1">
                                        {lumTypeMap.map((item) => (
                                            <div key={item.value} className="flex items-center gap-1">
                                                <div
                                                    className="w-4 h-4 rounded-sm ml-6"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs text-slate-700">{item.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                                {/* Opacity */}
                                {/* <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Opacity</span>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Math.round(pageContext.current?.rasterOpacity! * 100)]}
                                            max={100}
                                            step={5}
                                            className='w-36 cursor-pointer'
                                            onValueChange={(value) => {
                                                const opacity = Math.round(value[0]) / 100;
                                                pageContext.current!.rasterOpacity = opacity;
                                                updateRasterOpacity(opacity);
                                                triggerRepaint();
                                            }}
                                        />
                                        <Badge variant="secondary" className={`w-10 text-xs font-semibold`}>
                                            {Math.round(pageContext.current?.rasterOpacity! * 100)}%
                                        </Badge>
                                    </div>
                                </div> */}
                            </div>

                            {/* Pixel identification info */}
                            {/* <div className="flex items-center gap-2 mb-2 mt-4 border-t border-slate-100 pt-4">
                                <Crosshair className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pixel Identification</span>
                            </div>
                            <div className="space-y-2 ml-6">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Coordinate X:</span>
                                    <span className="text-sm font-medium">{pixelInfo.x}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Coordinate Y:</span>
                                    <span className="text-sm font-medium">{pixelInfo.y}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Value:</span>
                                    <div>
                                        {pixelInfo.value !== null ? (
                                            <Badge variant="secondary">
                                                {pixelInfo.value}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm italic text-slate-400">No Data</span>
                                        )}
                                    </div>
                                </div>
                                {pixelInfo.value !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600">Type:</span>
                                        <div>
                                            {pixelInfo.value >= 1 && pixelInfo.value <= 7 ? (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-sm"
                                                        style={{ backgroundColor: lumTypeMap[pixelInfo.value - 1].color }}
                                                    />
                                                    <span className="text-sm">{lumTypeMap[pixelInfo.value - 1].type}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm italic text-slate-400">Unknown</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div> */}
                        </CardContent>
                    </Card>

                    {/* Vectors Upload Area */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="space-y-4">
                            {/* Upload Section Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vector Upload Drop Zone</span>
                                </div>

                                {/* Drop Zone */}
                                <div>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                            isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        {!pageContext.current?.uploadResourcesNodeKey.grid ? (
                                            <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                                <Upload className="w-8 h-8 mb-2" />
                                                <p className="text-sm font-medium mb-1">Drag vector files here</p>
                                                <p className="text-xs text-center">Drop files from the resource manager</p>
                                            </div>
                                        ) : (
                                            <div className="h-full overflow-y-auto pr-1">
                                                <div
                                                    className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                                            {/* <span className={`text-${resource.data.color}`}>{getFeatureTypeIcon(resource.data.type)}</span> */}
                                                            <p className="text-slate-900 text-sm font-medium truncate">
                                                                {pageContext.current.uploadResourcesNodeKey.grid.split(".").pop()}
                                                            </p>
                                                            {/* <Badge variant="secondary" className={`text-xs text-gray-800`}>
                                                                {resource.data.epsg}
                                                            </Badge> */}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        // onClick={(e) => {
                                                        //     e.stopPropagation()
                                                        //     toggleVectorVisibility(resource.node_key)
                                                        // }}
                                                        >
                                                            {/* {resource.visible ?
                                                                <Eye className="h-3 w-3" /> :
                                                                <EyeOff className="h-3 w-3" />
                                                            } */}
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                        // onClick={(e) => {
                                                        //     handleVectorPin(resource.node_key)
                                                        // }}
                                                        >
                                                            <MapPin className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        // onClick={(e) => {
                                                        //     handleVectorRemove(index)
                                                        // }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs shrink-0 bg-green-200 text-gray-800">
                                                            set
                                                        </Badge>
                                                        <Input
                                                            className="h-7 text-xs flex-1"
                                                            placeholder="Enter value"
                                                            // value={resource.updateRasterData.value || ''}
                                                            // onChange={(e) => handleValueChange(e, index)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Status */}
                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                        {/* <span>
                                            {pageContext.current?.uploadVectors.length || 0} vectors uploaded
                                        </span> */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className=" bg-red-500 hover:bg-red-600 text-white hover:text-white cursor-pointer shadow-sm"
                                            // onClick={handleResetDropZone}
                                            // disabled={!pageContext.current?.uploadVectors.length}
                                            >
                                                <RotateCcw className="w-4 h-4" />Reset
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className=" bg-blue-500 hover:bg-blue-600 text-white hover:text-white cursor-pointer shadow-sm"
                                            // onClick={handleSetLUM}
                                            // disabled={!pageContext.current?.uploadVectors.length}
                                            >
                                                <SquareCheck className="w-4 h-4" />Set
                                            </Button>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={node} style='w-full h-full' />
            </div>
        </div >
    )
}
