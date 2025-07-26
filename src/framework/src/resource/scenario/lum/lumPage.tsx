import React, { useEffect, useRef, useState, useReducer } from 'react'
import {
    X,
    Dot,
    Minus,
    Globe,
    Square,
    Upload,
    Palette,
    FileIcon,
    FilePlus2,
    RotateCcw,
    FolderOpen,
    Fullscreen,
    SquareCheck,
    Globe2,
    Info,
} from "lucide-react"
import store from '@/store'
import { toast } from 'sonner'
import { cn } from '@/utils/utils'
import { LumPageProps } from './types'
import * as apis from '@/core/apis/apis'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LumPageContext, Vectordata } from './lum'
import { UpdateRasterData } from '@/core/apis/types'
import { Card, CardContent } from "@/components/ui/card"
import { SceneNode } from '@/components/resourceScene/scene'
import MapContainer from '@/components/mapContainer/mapContainer'
import { convertToWGS84 } from '@/components/mapContainer/utils'

const REORDER_TYPE = 'application/x-lum-reorder'

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

const lumTypeMap = [
    { value: 1, type: 'Building', color: '#FFFF00' },
    { value: 2, type: 'Road', color: '#D6D6D6' },
    { value: 3, type: 'Farmland', color: '#00CC00' },
    { value: 4, type: 'Fishpond', color: '#00FF80' },
    { value: 5, type: 'Hills', color: '#E79852' },
    { value: 6, type: 'Waters', color: '#00FFFF' },
    { value: 7, type: 'Catchment', color: '#0099CC' }
]

export default function LumPage({ node }: LumPageProps) {

    const pageContext = useRef<LumPageContext | null>(null)
    const { t } = useTranslation('lumsPage')
    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as LumPageContext
        const map = store.get<mapboxgl.Map>('map')

        if (!map) return

        const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, node.key)

        if (map.isStyleLoaded()) {
            addSourceAndLayer(map, node.key, tileUrl)
        } else {
            map.once('style.load', () => {
                addSourceAndLayer(map, node.key, tileUrl)
            })
        }

        triggerRepaint()
    }

    const unloadContext = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (map) {
            map.removeLayer(node.key + 'layer')
            map.removeSource(node.key + 'source')

            pageContext.current?.uploadVectors.forEach(vector => {
                map.removeLayer(`${vector.node_key}-layer`)
                map.removeSource(`${vector.node_key}-source`)
            })
        }
    }

    const fitLumBounds = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        const lumBoundsOn4326 = convertToWGS84(pageContext.current?.lumInfo?.bbox!, pageContext.current?.lumInfo?.epsg.toString()!)
        map.fitBounds([
            [lumBoundsOn4326[0], lumBoundsOn4326[1]],
            [lumBoundsOn4326[2], lumBoundsOn4326[3]]
        ], {
            padding: 80,
            duration: 1000,
        })
    }

    const addSourceAndLayer = (map: mapboxgl.Map, nodeKey: string, tileUrl: string) => {
        map.addSource(nodeKey + 'source', {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            maxzoom: 18,
            minzoom: 0,
            scheme: "xyz",
        })

        map.addLayer({
            id: nodeKey + 'layer',
            type: "raster",
            source: nodeKey + 'source',
            paint: {
                "raster-opacity": 0.8,
            },
        })

        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        fitLumBounds()
        toast.success('LUM loaded successfully')
        triggerRepaint()
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
                // TODO:add vector to map
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
                const uploadVector = {
                    node_key: nodeKey,
                    data: vectorData,
                    updateRasterData: updateRasterData,
                }
                pageContext.current?.uploadVectors.push(uploadVector)
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

    const handleVectorClick = (resourceKey: string) => {
        const patchName = resourceKey.split('.').pop()!

        // if (pageContext.current.patchesBounds[patchName]) {
        //     const patchBoundsOn4326 = convertToWGS84(
        //         pageContext.current.patchesBounds[patchName],
        //         pageContext.current.schema.epsg.toString()
        //     )
        //     highlightPatchBounds(patchBoundsOn4326, patchName)
        // }
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

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
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

    const handleSetLUM = async () => {
        if (!pageContext.current) return

        pageContext.current.updateRasterMeta.updates = []

        pageContext.current.uploadVectors.forEach(vector => {
            pageContext.current?.updateRasterMeta.updates.push(vector.updateRasterData)
        })

        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        try {
            await apis.raster.updateRasterByFeature.fetch({ node_key: node.key, updateRasterMeta: pageContext.current.updateRasterMeta }, node.tree.isPublic)
            toast.success('LUM successfully updated')
        } catch (error) {
            console.error('Failed to update LUM:', error)
            toast.error('Failed to update LUM')
        } finally {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
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

    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[20vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FilePlus2 className='w-4 h-4' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">LUM Editor</h2>
                            <p className="text-sm text-slate-500">Edit Details</p>
                        </div>
                        <Button
                            className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
                            onClick={fitLumBounds}
                        >
                            <Fullscreen className="w-4 h-4" />Scale To Layer
                        </Button>
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
                                {/* type */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">EPSG</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={`text-xs font-semibold`}>
                                            {pageContext.current?.lumInfo?.epsg}
                                        </Badge>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="flex items-start">
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
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vectors Upload Area */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="space-y-4">
                            {/* Upload Section Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FileIcon className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vector Upload</span>
                                </div>
                                {/* Operation Instructions */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-sm font-medium text-blue-700 block mb-2">Instructions:</span>
                                    <ol className="space-y-2 text-xs text-blue-700 pl-5 list-decimal">
                                        <li>Drag resources from vectors folder to the area below to load.</li>
                                        <li>Drag uploaded resource items to arrange the assignment order.</li>
                                        <li>Click the set  button after confirming the assignment order.</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100"></div>

                            {/* Drop Zone */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Drop Zone</span>
                                </div>

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
                                        <div className="h-[300px] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag vector files here</p>
                                            <p className="text-xs text-center">Drop files from the resource manager</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[300px] overflow-y-auto pr-1">
                                            <div className="space-y-2">
                                                {pageContext.current?.uploadVectors.map((resource, index) => (
                                                    <div
                                                        key={resource.node_key}
                                                        className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                                        onClick={() => handleVectorClick(resource.node_key)}
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
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleVectorRemove(index)
                                                                }}
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
                                                                value={resource.updateRasterData.value || ''}
                                                                onChange={(e) => handleValueChange(e, index)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
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
                                            onClick={handleSetLUM}
                                            disabled={!pageContext.current?.uploadVectors.length}
                                        >
                                            <SquareCheck className="w-4 h-4" />Set
                                        </Button>

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
