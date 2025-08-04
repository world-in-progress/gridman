import { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Box,
    Dam,
    Info,
    Plus,
    BookOpen,
    RotateCcw,
    Paintbrush,
    CircleCheck,
    ChevronLeft,
    TrafficCone,
    CheckCircle,
    CircleDashed,
    ChevronRight,
    CircleCheckBig,
    Edit,
    Eye,
    Trash2,
    Check,
    BadgeEuro,
} from "lucide-react"
import store from '@/store'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import * as apis from '@/core/apis/apis'
import { HumanAction } from './solution'

import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from "@/components/ui/card"
import MapContainer from '@/components/mapContainer/mapContainer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

const actionTypes = [
    {
        value: 'add_fence',
        name: 'Add Fence'
    },
    {
        value: 'transfer_water',
        name: 'Transfer Water'
    },
    {
        value: 'add_gate',
        name: 'Add Gate'
    }
]

export default function DemoPage() {

    const drawInstance = store.get<MapboxDraw>("mapDraw")
    const map = store.get<mapboxgl.Map>("map")

    const nodeKey = useRef<string | null>(null)

    const [addActionPanelOpen, setAddActionPanelOpen] = useState(false)
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [actionTypeSelectorOpen, setActionTypeSelectorOpen] = useState(false)

    const [currentAction, setCurrentAction] = useState<HumanAction>({
        id: '',
        node_key: '',
        action_type: '',
        elevation_delta: '',
        landuse_type: '',
        geometry: null,
    })

    const [actionList, setActionList] = useState<HumanAction[]>([])

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    useEffect(() => {
        async function createSolution() {
            const res = await apis.solution.createSolution.fetch({
                "name": String(Date.now()),
                "model_type": "flood_pipe",
                "env": {
                    "grid_node_key": "root.topo.schemas.123.grids.grid",
                    "dem_node_key": "root.dems.28",
                    "lum_node_key": "root.lums.11lum",
                    "rainfall_node_key": "root.rainfalls.rainfall",
                    "gate_node_key": "root.gates.gate",
                    "tide_node_key": "root.tides.tide",
                    "inp_node_key": "root.inps.inp"
                },
                "action_types": [
                    "add_fence",
                    "transfer_water",
                    "add_gate"
                ]
            }, false)
            if (!res.success) {
                toast.error('Failed to create solution')
                return
            }

            nodeKey.current = res.message
        }
        createSolution()
    }, [])

    const updateActionList = async () => {
        if (!nodeKey.current) return
        const response = await apis.solution.getHumanActions.fetch(nodeKey.current, false)
        if (!response.success) {
            toast.error('Failed to update human action list')
        }
        const newActionList = response.data.map((action) => {
            return {
                id: action.action_id,
                node_key: nodeKey.current,
                action_type: action.action_type,
                elevation_delta: String(action.params.elevation_delta),
                landuse_type: String(action.params.landuse_type),
                geometry: action.params.feature
            } as HumanAction
        })
        setActionList(newActionList)
        
        // Add action geometries to map
        newActionList.forEach((action) => {
            if (action.geometry && map) {
                const sourceId = `action-${action.id}`
                const layerId = `action-layer-${action.id}`
                
                // Remove existing source and layer if they exist
                if (map.getSource(sourceId)) {
                    map.removeLayer(layerId)
                    map.removeSource(sourceId)
                }
                
                // Add new source and layer
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: action.geometry
                })
                
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': '#3B82F6',
                        'fill-opacity': 0.3,
                        'fill-outline-color': '#1E40AF'
                    }
                })
            }
        })

    }

    const handlePackageSolution = async () => {
        if (!nodeKey.current) {
            toast.error('No solution created yet')
            return
        }
        const response = await apis.solution.packageSolution.fetch(nodeKey.current, false)
        if (response.success) {
            toast.success('Solution packaged successfully')
        } else {
            toast.error('Failed to package solution')
        }
    }

    const registerHumanAction = async (action: HumanAction) => {
        if (!nodeKey.current) return
        if (!currentAction.action_type || !currentAction.elevation_delta || !currentAction.landuse_type) {
            toast.error('Please fill in all required fields')
            triggerRepaint()
            return
        }

        const actionFeature = drawInstance?.getAll()

        if (actionFeature?.features.length === 0) {
            toast.error('Map drawing cannot be empty')
            triggerRepaint()
            return
        }
        currentAction.geometry = actionFeature

        const humanAction = {
            node_key: nodeKey.current,
            action_type: currentAction.action_type,
            params: {
                elevation_delta: Number(currentAction.elevation_delta),
                landuse_type: Number(currentAction.landuse_type),
                feature: currentAction.geometry
            }
        }
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        try {
            const registerResponse = await apis.solution.addHumanAction.fetch(humanAction, false)
            store.get<{ on: Function, off: Function }>('isLoading')!.off()

            if (registerResponse.success) {
                resetActionDrawing()
                setAddActionPanelOpen(false)
                updateActionList()
                toast.success('Human action registered successfully')
            } else {
                toast.error('Failed to register human action')
            }
        } catch (err) {
            toast.error('Failed to register human action')
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
        }

        triggerRepaint()
    }

    /*
    ** Action drawing logic
    */
    const startActionDrawing = () => {
        // TODO: Set color to draw vector

        drawInstance?.changeMode("draw_polygon")
        setIsDrawingMode(true)

    }

    const stopActionDrawing = () => {
        setIsDrawingMode(false)
        drawInstance?.changeMode("simple_select")
    }

    const resetActionDrawing = () => {
        stopActionDrawing()
        drawInstance?.deleteAll()
    }

    useEffect(() => {

        if (!map || !drawInstance || !isDrawingMode) return

        const handleDrawCreate = (e: any) => {
            if (e.features && e.features.length > 0) {

                setCurrentAction({ ...currentAction, geometry: e.features[0] })
                triggerRepaint()

                setTimeout(() => {
                    drawInstance.changeMode("draw_polygon")
                }, 10)
            }
        }

        // TODO: Change draw mode by selected action type

        const handleModeChange = (e: any) => {
            if (isDrawingMode && e.mode === "simple_select" &&
                (e.oldMode && !e.oldMode.startsWith("direct_select"))) {

                setTimeout(() => {
                    drawInstance.changeMode("draw_polygon")
                }, 50)
            }
        }

        map.on("draw.create", handleDrawCreate)
        map.on("draw.modechange", handleModeChange)

        return () => {
            map.off("draw.create", handleDrawCreate)
            map.off("draw.modechange", handleModeChange)
        }
    }, [isDrawingMode])



    const handleTypeSelected = (type: string) => {
        if (!nodeKey.current) return
        setAddActionPanelOpen(true)
        setActionTypeSelectorOpen(false)
        setCurrentAction({
            id: Date.now().toString(),
            action_type: type,
            elevation_delta: '',
            landuse_type: '',
            node_key: nodeKey.current,
            geometry: null,
        })
    }

    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[25vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Dam className='w-6 h-6' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-md font-semibold text-slate-900">Create New Solution</h2>
                            <p className="text-sm text-slate-500">New Solution Details</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Solution Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className='space-y-4'>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Basic Information</span>
                                </div>
                                <div className="ml-6 space-y-2">
                                    {/* Name */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Name</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            WorkShop
                                        </div>
                                    </div>
                                    {/* Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Type</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            洪水-管道聯合模擬
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Action Types */}
                            <div className='border-t border-slate-200 pt-4'>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrafficCone className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 tracking-wide uppercase">Permitted Action Types</span>
                                </div>
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_fence"
                                            className='w-4 h-4'
                                            checked={true}
                                            disabled={true}
                                        />
                                        <label htmlFor="add_fence" className="text-sm font-medium leading-none text-slate-600">
                                            Add GeiWai
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="transfer_water"
                                            className='w-4 h-4'
                                            checked={true}
                                            disabled={true}
                                        />
                                        <label htmlFor="transfer_water" className="text-sm font-medium leading-none text-slate-600">
                                            Transfer water
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_gate"
                                            className='w-4 h-4'
                                            checked={true}
                                            disabled={true}
                                        />
                                        <label htmlFor="add_gate" className="text-sm font-medium leading-none text-slate-600">
                                            add gate
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/* Uploaded Resources */}
                            <div className='border-t border-slate-200 pt-4'>
                                <div className="flex items-center gap-2 mb-2">
                                    <Box className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Resources</span>
                                </div>
                                <div className="ml-6 space-y-2">
                                    {/* Grid */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Grid</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            Yuen Long
                                        </div>
                                    </div>
                                    {/* DEM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">DEM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            HK DEM 5m
                                        </div>
                                    </div>
                                    {/* LUM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">LUM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            HK LUM 2023
                                        </div>
                                    </div>
                                    {/* Rainfall */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Rainfall</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            HK Rainfall
                                        </div>
                                    </div>
                                    {/* Gate */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Gate</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            HK Gates
                                        </div>
                                    </div>
                                    {/* Tide */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Tide</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            HK Tide
                                        </div>
                                    </div>
                                    {/* INP */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">INP</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            Yuen Long Pipe
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Human Actions */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="space-y-4">
                            {/* Human Actions Title */}
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Box className='w-4 h-4' />
                                    <span className='text-sm font-medium text-slate-500 uppercase tracking-wide'>Human Actions</span>
                                </div>
                            </div>

                            {/* Action List */}
                            <div
                                className={`rounded-xl p-4 border border-slate-600" bg-slate-50
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-medium text-slate-500">Configured Actions</div>

                                    <Button size="sm" onClick={() => setActionTypeSelectorOpen(true)} className="bg-green-600 hover:bg-green-700" disabled={addActionPanelOpen}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Action
                                    </Button>
                                </div>

                                <ScrollArea className="h-48 overflow-y-auto">
                                    <div className="space-y-3 pr-2">
                                        {actionList.map((action, index) => (
                                            <div
                                                key={action.id}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {actionTypes.find(item => item.value === action.action_type)?.name || action.action_type}
                                                            </div>
                                                        </div>
                                                        <div className="ml-9 space-y-1">
                                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                Elevation: {action.elevation_delta}
                                                            </div>
                                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                Landuse: {action.landuse_type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-3">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {actionList.length === 0 && (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No actions configured yet</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-500">Click Add Action to get started</div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Add Action Panel */}
                            {addActionPanelOpen && (
                                <div className="border rounded-lg p-4 bg-slate-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-slate-500">Add Human Action</h4>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                                variant="ghost"
                                                className="text-slate-700 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                onClick={() => {
                                                    setCurrentAction({
                                                        id: Date.now().toString(),
                                                        node_key: '',
                                                        action_type: '',
                                                        elevation_delta: '',
                                                        landuse_type: '',
                                                        geometry: null,
                                                    })
                                                    setAddActionPanelOpen(false)
                                                }}
                                            >
                                                <X />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor={`action-type-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                Action Type
                                            </Label>
                                            <Badge>
                                                {actionTypes.find(item => item.value === currentAction.action_type)?.name}
                                            </Badge>
                                        </div>

                                        <div>
                                            <Label htmlFor={`elevation-delta-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                Elevation Delta
                                            </Label>
                                            <Input
                                                id={`elevation-delta-${currentAction.id}`}
                                                type="text"
                                                value={currentAction.elevation_delta}
                                                onChange={(e) => {
                                                    setCurrentAction({ ...currentAction, elevation_delta: e.target.value })
                                                    triggerRepaint()
                                                }}
                                                className="h-8 text-sm"
                                                placeholder="Enter Number"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor={`landuse-type-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                Landuse Type
                                            </Label>
                                            <Input
                                                id={`landuse-type-${currentAction.id}`}
                                                type="text"
                                                value={currentAction.landuse_type}
                                                onChange={(e) => {
                                                    setCurrentAction({ ...currentAction, landuse_type: e.target.value })
                                                    triggerRepaint()
                                                }}
                                                className="h-8 text-sm"
                                                placeholder="Enter Number"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-sm mb-1 block text-slate-500">
                                                Map Drawing
                                            </Label>
                                            <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className={`cursor-pointer flex-1 min-w-0 ${!isDrawingMode ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                                    onClick={() => !isDrawingMode ? startActionDrawing() : stopActionDrawing()}
                                                >
                                                    <span className="hidden sm:inline">{isDrawingMode ? <X className="w-3 h-3 mr-1" /> : <Paintbrush className="w-3 h-3 mr-1" />}</span>
                                                    <span className="truncate">{isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={`cursor-pointer flex-1 min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50`}
                                                    onClick={() => {
                                                        resetActionDrawing()
                                                    }}
                                                >
                                                    <span className="hidden sm:inline"><RotateCcw className="w-3 h-3 mr-1" /></span>
                                                    <span className="truncate">Reset Drawing</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Add Action Button */}
                                        <div className="mt-6 pt-4 border-t border-slate-200">
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                                                onClick={() => registerHumanAction(currentAction)}
                                                disabled={!currentAction.action_type || !currentAction.elevation_delta || !currentAction.landuse_type || !currentAction.geometry}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Apply This Action
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Type Selector Dialog */}
                    <Dialog open={actionTypeSelectorOpen} onOpenChange={setActionTypeSelectorOpen}>
                        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-white text-lg">Select Action Type</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                {actionTypes.map((type) => (
                                    <Button
                                        key={type.value}
                                        variant="outline"
                                        className="w-full justify-start bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-white hover:from-slate-600 hover:to-slate-500 hover:border-blue-400 transition-all duration-200 transform hover:scale-105"
                                        onClick={() => handleTypeSelected(type.value)}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 mr-3"></div>
                                        <span className="capitalize">{type.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div>
                        <Button
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            onClick={handlePackageSolution}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Start Simulation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={null} style='w-full h-full' />
            </div>
        </div >
    )
}
