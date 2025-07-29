import React, { useEffect, useRef, useState, useReducer, useCallback } from 'react'
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
    MapPin,
    Crosshair,
    Mountain,
    Eye,
    EyeOff,
} from "lucide-react"
import store from '@/store'
import { toast } from 'sonner'
import { cn } from '@/utils/utils'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as apis from '@/core/apis/apis'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { UpdateRasterData } from '@/core/apis/types'
import { Card, CardContent } from "@/components/ui/card"
import { convertCoordinate, convertToWGS84 } from '@/components/mapContainer/utils'
import MapContainer from '@/components/mapContainer/mapContainer'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { Slider } from '@/components/ui/slider'
import { DemPageProps } from './types'
import { DemPageContext, Vectordata } from './dem'
import TerrainByProxyTile from './terrainLayer/terrainLayer'
import mapboxgl from 'mapbox-gl'

const REORDER_TYPE = 'application/x-dem-reorder'

const featureColorMap = [
    { value: "sky-500", color: "#0ea5e9", name: "Sky" },
    { value: "green-500", color: "#22c55e", name: "Green" },
    { value: "red-500", color: "#ef4444", name: "Red" },
    { value: "purple-500", color: "#a855f7", name: "Purple" },
    { value: "yellow-300", color: "#FFDF20", name: "Yellow" },
    { value: "orange-500", color: "#FF6900", name: "Orange" },
    { value: "pink-500", color: "#ec4899", name: "Pink" },
    { value: "indigo-500", color: "#6366f1", name: "Indigo" }
]

const operationColorMap = {
    set: "bg-blue-200",
    add: "bg-green-200",
    subtract: "bg-red-200",
    max_fill: "bg-orange-200",
};

export type RasterOperation = "set" | "add" | "subtract" | "max_fill"

export default function DemPage({ node }: DemPageProps) {

    const pageContext = useRef<DemPageContext | null>(null)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const terrainLayer = useRef<TerrainByProxyTile | null>(null)
    const bbox84 = useRef<number[] | null>(null)
    const mapMarker = useRef<mapboxgl.Marker | null>(null)

    const [identifyActive, setIdentifyActive] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [pixelInfo, setPixelInfo] = useState<{ x: number, y: number, value: number | null } | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    useEffect(() => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
            if (!identifyActive) return

            const { lng, lat } = e.lngLat

            try {
                const response = await apis.raster.getSamplingValue.fetch({
                    node_key: node.key,
                    x: lng,
                    y: lat
                }, node.tree.isPublic)

                if (response.success) {

                    setPixelInfo({
                        x: Math.round(lng * 10000) / 10000,
                        y: Math.round(lat * 10000) / 10000,
                        value: response.data.value
                    })
                    if (!mapMarker.current) {
                        mapMarker.current = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map)
                    }
                    mapMarker.current.setLngLat([lng, lat])
                } else {
                    toast.error('Unable to get raster value')
                    setPixelInfo(null)
                }
            } catch (error) {
                console.error('Failed to get raster value:', error)
                toast.error('Failed to get raster value')
            }
        }

        if (identifyActive) {
            map.getCanvas().style.cursor = 'crosshair'
            map.on('click', handleMapClick)
        } else {
            map.getCanvas().style.cursor = ''
            map.off('click', handleMapClick)
            setPixelInfo(null)
            if (mapMarker.current) {
                mapMarker.current.remove()
                mapMarker.current = null
            }
        }

        return () => {
            map.getCanvas().style.cursor = ''
            map.off('click', handleMapClick)
        }
    }, [identifyActive, node.key, node.tree.isPublic])

    const loadContext = async (node: SceneNode) => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        pageContext.current = await node.getPageContext() as DemPageContext

        const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, node.key, 'terrainrgb', new Date().getTime().toString())

        const computeBBOX = () => {
            console.log(pageContext.current)
            const bbox = pageContext.current!.demInfo!.bbox
            const LB = convertCoordinate(bbox[0], bbox[1], '2326', '4326')
            const TR = convertCoordinate(bbox[2], bbox[3], '2326', '4326')
            if (LB && TR) {
                const bbox84 = [LB.x, LB.y, TR.x, TR.y]
                return bbox84
            } else {
                return null
            }
        }

        const loadDemLayer = () => {
            terrainLayer.current = new TerrainByProxyTile(node.key, tileUrl, bbox84.current!)
            map.addLayer(terrainLayer.current);
            fitDemBounds()
        }

        bbox84.current = computeBBOX()

        if (!bbox84.current) {
            toast.error('Failed to get bounding box')
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            return
        }
        if (map.isStyleLoaded()) {
            loadDemLayer()
        } else {
            map.once('style.load', () => {
                loadDemLayer()
            })
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        toast.success('DEM loaded successfully')
        triggerRepaint()
    }

    const unloadContext = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (map) {
            terrainLayer.current && map.removeLayer(terrainLayer.current?.id)

            pageContext.current?.uploadVectors.forEach(vector => {
                if (map.getLayer(`${vector.node_key}-layer`)) {
                    map.removeLayer(`${vector.node_key}-layer`)
                }
                if (map.getSource(`${vector.node_key}-source`)) {
                    map.removeSource(`${vector.node_key}-source`)
                }
            })
        }
    }

    const handleDeleteDEM = async () => {
        if (!pageContext.current) return
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        const deleteResponse = await apis.raster.deleteRaster.fetch(node.key, node.tree.isPublic)
        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        if (deleteResponse.success) {
            await (node.tree as SceneTree).removeNode(node)
            toast.success(deleteResponse.message)
        } else {
            toast.error(deleteResponse.message)
        }
    }

    const fitDemBounds = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const bbox = bbox84.current!
        map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
            padding: 80,
            duration: 1000,
        })
    }

    const updateRasterOpacity = (opacity: number) => {
        return
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
        if (nodeKey.split('.')[1] === 'vectors') {
            const isAlreadySelected = pageContext.current?.uploadVectors.some((resource) => resource.node_key === nodeKey)
            if (!isAlreadySelected) {
                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                const map = store.get<mapboxgl.Map>('map')

                if (!map) return

                const vectorData = (await apis.feature.getFeatureData.fetch(nodeKey, node.tree.isPublic)).data as Vectordata
                const vectorColor = featureColorMap.find(c => c.value === vectorData.color)!.color

                const sourceId = `${nodeKey}-source`
                const layerId = `${nodeKey}-layer`

                map.addSource(sourceId, {
                    type: 'geojson',
                    data: vectorData.feature_json
                })
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-outline-color': vectorColor,
                        'fill-color': vectorColor,
                        'fill-opacity': 0.5
                    }
                })

                const updateRasterData: UpdateRasterData = {
                    feature_node_key: nodeKey,
                    operation: 'set',
                    value: null
                }
                pageContext.current?.uploadVectors.push({
                    node_key: nodeKey,
                    data: vectorData,
                    updateRasterData: updateRasterData,
                    visible: true
                })
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
            } else {
                toast.info('Vector already selected')
            }
        } else {
            toast.error('Please select the correct feature in vectors')
        }
    }

    const handleVectorRemove = (index: number) => {
        if (!pageContext.current) return
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const resource = pageContext.current.uploadVectors[index]

        map.removeLayer(`${resource.node_key}-layer`)
        map.removeSource(`${resource.node_key}-source`)

        pageContext.current.uploadVectors = pageContext.current.uploadVectors.filter((_, i) => i !== index)

        triggerRepaint()
    }

    const handleVectorPin = (resourceKey: string) => {

        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const vectorResource = pageContext.current?.uploadVectors.find(vector => vector.node_key === resourceKey)

        if (vectorResource && vectorResource.data.feature_json) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

            vectorResource.data.feature_json.features.forEach(feature => {
                if (feature.geometry) {
                    switch (feature.geometry.type) {
                        case 'Point':
                            {
                                const point = feature.geometry.coordinates;
                                minX = Math.min(minX, point[0])
                                maxX = Math.max(maxX, point[0])
                                minY = Math.min(minY, point[1])
                                maxY = Math.max(maxY, point[1])
                                break
                            }
                        case 'LineString':
                            feature.geometry.coordinates.forEach(coord => {
                                minX = Math.min(minX, coord[0])
                                maxX = Math.max(maxX, coord[0])
                                minY = Math.min(minY, coord[1])
                                maxY = Math.max(maxY, coord[1])
                            })
                            break

                        case 'Polygon':
                            feature.geometry.coordinates.forEach(ring => {
                                ring.forEach(coord => {
                                    minX = Math.min(minX, coord[0])
                                    maxX = Math.max(maxX, coord[0])
                                    minY = Math.min(minY, coord[1])
                                    maxY = Math.max(maxY, coord[1])
                                })
                            })
                            break
                    }
                }
            });


            map.fitBounds([[minX, minY], [maxX, maxY]], {
                padding: 80,
                duration: 1000,
            })
        }
    }

    const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index)
        e.dataTransfer.setData(REORDER_TYPE, index.toString())
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'move'
        }
    }

    const handleOperationTypeChange = (index: number, value: string) => {
        if (!pageContext.current) return

        pageContext.current.uploadVectors[index].updateRasterData.operation = value as RasterOperation
        triggerRepaint()
    }

    const handleOperationValueChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!pageContext.current) return

        pageContext.current.uploadVectors[index].updateRasterData.value = Number(e.target.value)
        triggerRepaint()
    }

    const handleItemDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            e.preventDefault()
            e.stopPropagation()

            if (draggedIndex === null || draggedIndex === index) return

            if (pageContext.current) {
                const items = [...pageContext.current.uploadVectors]
                const draggedItem = items[draggedIndex]
                items.splice(draggedIndex, 1)
                items.splice(index, 0, draggedItem)
                pageContext.current.uploadVectors = items

                setDraggedIndex(index)
                triggerRepaint()
            }
        }
    }

    const handleItemDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            e.preventDefault()
            e.stopPropagation()
            setDraggedIndex(null)
        }
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    const getFeatureTypeIcon = (type: string) => {
        switch (type) {
            case "point":
                return <Dot className="w-6 h-6 " />
            case "line":
                return <Minus className="w-6 h-6 " />
            case "polygon":
                return <Square className="w-6 h-6" />
            default:
                return null
        }
    }

    const handleResetDropZone = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        pageContext.current!.uploadVectors.forEach(vector => {
            map.removeLayer(`${vector.node_key}-layer`)
            map.removeSource(`${vector.node_key}-source`)
        })

        pageContext.current!.uploadVectors = []

        triggerRepaint()
    }

    const handleSetDEM = async () => {
        if (!pageContext.current) return

        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        pageContext.current.updateRasterMeta.updates = []

        pageContext.current.uploadVectors.forEach(vector => {
            pageContext.current?.updateRasterMeta.updates.push(vector.updateRasterData)
        })

        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        try {
            console.log(pageContext.current.updateRasterMeta)
            await apis.raster.updateRasterByFeature.fetch({ node_key: node.key, updateRasterMeta: pageContext.current.updateRasterMeta }, node.tree.isPublic)
            toast.success('DEM successfully updated')
            map.triggerRepaint()
        } catch (error) {
            console.error('Failed to update DEM:', error)
            toast.error('Failed to update DEM')
        } finally {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
        }
    }

    function toggleVectorVisibility(resourceKey: string) {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const vectorIndex = pageContext.current?.uploadVectors.findIndex(v => v.node_key === resourceKey)
        if (vectorIndex === undefined || vectorIndex < 0) return

        const resource = pageContext.current!.uploadVectors[vectorIndex]
        resource.visible = !resource.visible

        const layerId = `${resource.node_key}-layer`
        const visibility = resource.visible ? 'visible' : 'none'

        map.setLayoutProperty(layerId, 'visibility', visibility)
        triggerRepaint()
    }

    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[20vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Mountain className='w-6 h-6' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">DEM Editor</h2>
                            <p className="text-sm text-slate-500">Edit Details</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant='destructive'
                                        className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                    >
                                        <Delete className="w-4 h-4 rotate-180" />Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure to delete this DEM?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this DEM.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className='cursor-pointer border border-gray-300'>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className='bg-red-500 hover:bg-red-600 cursor-pointer'
                                            onClick={handleDeleteDEM}
                                        >
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button
                                className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
                                onClick={fitDemBounds}
                            >
                                <Fullscreen className="w-4 h-4" />Scale
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {/* DEM Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">DEM Information</span>
                                <div className="ml-auto">
                                    <Button
                                        className={`cursor-pointer shadow-sm h-8 w-8 ${identifyActive ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-300 hover:bg-sky-300'}`}
                                        onClick={() => {
                                            setIdentifyActive(!identifyActive)
                                        }}
                                        title="Identify Raster Value"
                                    >
                                        <Crosshair className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="ml-6 space-y-2">
                                {/* Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Name</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <span className="font-semibold text-slate-900">
                                            {node.name}
                                        </span>
                                    </div>
                                </div>
                                {/* EPSG */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">EPSG</span>
                                    <div className="flex items-center">
                                        <Badge variant="secondary" className={`text-xs font-semibold`}>
                                            {pageContext.current?.demInfo?.epsg}
                                        </Badge>
                                    </div>
                                </div>
                                {/* Opacity */}
                                <div className="flex items-center justify-between">
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
                                </div>
                            </div>

                            {/* Pixel identification info */}
                            {identifyActive && pixelInfo && (
                                <>
                                    <div className="flex items-center gap-2 mb-2 mt-4 border-t border-slate-100 pt-4">
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
                                                    {/* {pixelInfo.value >= 1 && pixelInfo.value <= 7 ? (
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-sm"
                                                                style={{ backgroundColor: lumTypeMap[pixelInfo.value - 1].color }}
                                                            />
                                                            <span className="text-sm">{lumTypeMap[pixelInfo.value - 1].type}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm italic text-slate-400">Unknown</span>
                                                    )} */}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
                                        {!pageContext.current?.uploadVectors.length ? (
                                            <div className="h-[32vh] flex flex-col justify-center items-center text-slate-400">
                                                <Upload className="w-8 h-8 mb-2" />
                                                <p className="text-sm font-medium mb-1">Drag vector files here</p>
                                                <p className="text-xs text-center">Drop files from the resource manager</p>
                                            </div>
                                        ) : (
                                            <div className="h-full overflow-y-auto pr-1">
                                                <div className="space-y-2">
                                                    {pageContext.current?.uploadVectors.map((resource, index) => (
                                                        <div
                                                            key={resource.node_key}
                                                            className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                                            draggable
                                                            onDragStart={(e) => handleItemDragStart(e, index)}
                                                            onDragOver={(e) => handleItemDragOver(e, index)}
                                                            onDragEnter={(e) => handleItemDragEnter(e, index)}
                                                            onDragEnd={handleDragEnd}
                                                            onDrop={handleItemDrop}
                                                            style={{ opacity: draggedIndex === index ? 0.5 : 1 }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                    <span className={`text-${resource.data.color}`}>{getFeatureTypeIcon(resource.data.type)}</span>
                                                                    <p className="text-slate-900 text-sm font-medium truncate">
                                                                        {resource.node_key.split(".").pop()}
                                                                    </p>
                                                                    <Badge variant="secondary" className={`text-xs text-gray-800`}>
                                                                        {resource.data.epsg}
                                                                    </Badge>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleVectorVisibility(resource.node_key)
                                                                    }}
                                                                >
                                                                    {resource.visible ?
                                                                        <Eye className="h-3 w-3" /> :
                                                                        <EyeOff className="h-3 w-3" />
                                                                    }
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        handleVectorPin(resource.node_key)
                                                                    }}
                                                                >
                                                                    <MapPin className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        handleVectorRemove(index)
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    defaultValue="set"
                                                                    onValueChange={(value) => handleOperationTypeChange(index, value)}
                                                                >
                                                                    <SelectTrigger className={`text-xs w-25 ${operationColorMap[pageContext.current!.uploadVectors[index].updateRasterData.operation]}`}>
                                                                        <SelectValue placeholder="select an operation" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem className="bg-blue-200 text-xs text-gray-800 my-1" value="set">Set</SelectItem>
                                                                        <SelectItem className="bg-green-200 text-xs text-gray-800 my-1" value="add">Add</SelectItem>
                                                                        <SelectItem className="bg-red-200 text-xs text-gray-800 my-1" value="subtract">Subtract</SelectItem>
                                                                        <SelectItem className="bg-orange-200 text-xs text-gray-800 my-1" value="max_fill">Max Fill</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                {pageContext.current!.uploadVectors[index].updateRasterData.operation !== 'max_fill'
                                                                    && <Input
                                                                        className="h-9 text-xs flex-1"
                                                                        placeholder="Enter value"
                                                                        value={resource.updateRasterData.value || 0}
                                                                        onChange={(e) => handleOperationValueChange(e, index)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Status */}
                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            {pageContext.current?.uploadVectors.length || 0} vectors uploaded
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className=" bg-red-500 hover:bg-red-600 text-white hover:text-white cursor-pointer shadow-sm"
                                                onClick={handleResetDropZone}
                                                disabled={!pageContext.current?.uploadVectors.length}
                                            >
                                                <RotateCcw className="w-4 h-4" />Reset
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className=" bg-blue-500 hover:bg-blue-600 text-white hover:text-white cursor-pointer shadow-sm"
                                                onClick={handleSetDEM}
                                                disabled={!pageContext.current?.uploadVectors.length}
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
        </div>
    )
}
