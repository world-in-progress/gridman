import { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Box,
    Dam,
    Info,
    Plus,
    RotateCcw,
    Paintbrush,
    TrafficCone,
    CheckCircle,
    Trash2,
    Shrimp,
    Waves,
    DoorOpen,
    MapPin,
} from "lucide-react"
import store from '@/store'
import { toast } from 'sonner'
import * as apis from '@/core/apis/apis'
import { HumanAction } from './solution'
import mapboxgl from 'mapbox-gl'
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from "@/components/ui/card"
import MapContainer from '@/components/mapContainer/mapContainer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { pickingFromMap } from '../schemas/utils'
import type { GeoJSON } from 'geojson';

const actionTypes = [
    {
        value: 'add_fence',
        name: 'Add GeiWai',
        icon: Shrimp
    },
    {
        value: 'transfer_water',
        name: 'Transfer Water',
        icon: Waves
    },
    {
        value: 'add_gate',
        name: 'Add Gate',
        icon: DoorOpen
    }
]

// 定义自定义的HumanAction类型或扩展现有类型
interface DisplayHumanAction {
    action_type: string;
    action_id: string;
    params: {
        elevation_delta?: number;
        landuse_type?: number;
        feature?: GeoJSON | any;  // 明确指定类型
        from_grid?: string;
        to_grid?: string;
        q?: number;
        up_stream?: string;
        down_stream?: string;
        height?: number;
    };
}

export default function DemoPage() {

    // 使用新定义的类型
    const [actionList, setActionList] = useState<DisplayHumanAction[]>([])

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const map = store.get<mapboxgl.Map>("map")
    const drawInstance = store.get<MapboxDraw>("mapDraw")
    const nodeKey = useRef<string | null>(null)
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [addActionPanelOpen, setAddActionPanelOpen] = useState(false)


    const [isPickingUpstream, setIsPickingUpstream] = useState(false)
    const [isPickingDownstream, setIsPickingDownstream] = useState(false)

    const upstreamMarker = useRef<mapboxgl.Marker | null>(null)
    const downstreamMarker = useRef<mapboxgl.Marker | null>(null)
    const pickingCancel = useRef<() => void>(() => { })

    const [currentAction, setCurrentAction] = useState<{
        id: string;
        node_key: string;
        action_type: string
        
        geometry?: any
        
        elevation_delta?: string;
        landuse_type?: string;

        from_grid?: string;
        to_grid?: string;
        q?: string;

        up_stream?: string;
        down_stream?: string;
        height?: string;
    }>({
        id: '',
        node_key: '',
        action_type: '',
    });

    // 添加一个state来跟踪正在编辑的action ID
    const [editingActionId, setEditingActionId] = useState<string | null>(null);

    useEffect(() => {
        async function createSolution() {
            const res = await apis.solution.createSolution.fetch({
                "name": String(Date.now()),
                "model_type": "flood_pipe",
                "env": {
                    "grid_node_key": "root.topo.schemas.64.grids.grid",
                    "dem_node_key": "root.dems.dem",
                    "lum_node_key": "root.lums.lum",
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

        return () => {
            upstreamMarker.current?.remove()
            downstreamMarker.current?.remove()
            pickingCancel.current()
        }
    }, [])

    const updateActionList = async () => {
        if (!nodeKey.current) return
        const response = await apis.solution.getHumanActions.fetch(nodeKey.current, false)
        if (!response.success) {
            toast.error('Failed to update human action list')
            return
        }
        // 直接使用返回的数据，不需要额外处理
        setActionList(response.data)

        // 添加地图图层的代码
        if (map) {
            // 首先移除所有已有的action图层
            response.data.forEach(action => {
                const sourceId = `action-${action.action_id}`
                const layerId = `action-layer-${action.action_id}`
                if (map.getSource(sourceId)) {
                    map.removeLayer(layerId)
                    map.removeSource(sourceId)
                }
            })

            // 添加新图层
            response.data.forEach((action) => {
                if (action.params.feature && map) {
                    const sourceId = `action-${action.action_id}`
                    const layerId = `action-layer-${action.action_id}`

                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: action.params.feature as GeoJSON
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

    // 修改 registerHumanAction function
    const registerHumanAction = async (action: any) => {
        if (!nodeKey.current) return

        // Validate required fields
        let isValid = true;
        let errorMessage = '';

        if (action.action_type === 'add_fence') {
            if (!action.elevation_delta || !action.landuse_type) {
                isValid = false;
                errorMessage = 'Please fill in elevation change and land use type';
            }
        } else if (action.action_type === 'transfer_water') {
            if (!action.from_grid || !action.to_grid || !action.q) {
                isValid = false;
                errorMessage = 'Please fill in start point, end point coordinates and water volume';
            }
        } else if (action.action_type === 'add_gate') {
            if (!action.up_stream || !action.down_stream || !action.height) {
                isValid = false;
                errorMessage = 'Please fill in upstream, downstream coordinates and height';
            }
        }

        if (!isValid) {
            toast.error(errorMessage);
            triggerRepaint();
            return;
        }

        const actionFeature = drawInstance?.getAll();

        if (actionFeature?.features.length === 0) {
            toast.error('Map drawing cannot be empty');
            triggerRepaint();
            return;
        }
        currentAction.geometry = actionFeature;

        // Build different types of request parameters
        let params = {};
        if (action.action_type === 'add_fence') {
            params = {
                elevation_delta: Number(action.elevation_delta),
                landuse_type: Number(action.landuse_type),
                feature: currentAction.geometry
            };
        } else if (action.action_type === 'transfer_water') {
            params = {
                from_grid: action.from_grid,
                to_grid: action.to_grid,
                q: Number(action.q)
            };
        } else if (action.action_type === 'add_gate') {
            params = {
                up_stream: action.up_stream,
                down_stream: action.down_stream,
                height: Number(action.height),
                feature: currentAction.geometry,
            };
        }

        const humanAction = {
            node_key: nodeKey.current,
            action_type: currentAction.action_type,
            params: params
        };

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        try {
            const isUpdate = editingActionId !== null;
            let registerResponse;
            
            if (isUpdate) {
                // 直接使用 updateHumanAction 接口更新操作
                registerResponse = await apis.solution.updateHumanAction.fetch({
                    node_key: nodeKey.current!,
                    action_id: editingActionId,
                    action_type: action.action_type,
                    params: humanAction.params
                }, false);
            } else {
                // 普通添加操作
                registerResponse = await apis.solution.addHumanAction.fetch(humanAction, false);
            }
            
            store.get<{ on: Function, off: Function }>('isLoading')!.off();

            if (registerResponse.success) {
                resetActionDrawing();
                setAddActionPanelOpen(false);
                setEditingActionId(null); // 重置编辑状态
                await updateActionList();
                toast.success(isUpdate ? 'Human action updated successfully' : 'Human action registered successfully');
            } else {
                toast.error(isUpdate ? 'Failed to update human action' : 'Failed to register human action');
            }
        } catch (err) {
            toast.error('Operation failed');
            store.get<{ on: Function, off: Function }>('isLoading')!.off();
        }

        triggerRepaint();
    }

    const startActionDrawing = () => {
        // TODO: Set color to draw vector

        switch (currentAction.action_type) {
            case 'add_fence':
                drawInstance?.changeMode("draw_polygon")
                break
            case 'transfer_water':
                drawInstance?.changeMode("draw_point")
                break
            case 'add_gate':
                drawInstance?.changeMode("draw_line_string")
                break
            default:
                drawInstance?.changeMode("draw_polygon")
        }

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
                    switch (currentAction.action_type) {
                        case 'add_fence':
                            drawInstance.changeMode("draw_polygon")
                            break
                        case 'transfer_water':
                            drawInstance.changeMode("draw_point")
                            break
                        case 'add_gate':
                            drawInstance.changeMode("draw_line_string")
                            break
                        default:
                            drawInstance.changeMode("draw_polygon")
                    }
                }, 10)
            }
        }

        const handleModeChange = (e: any) => {
            if (isDrawingMode && e.mode === "simple_select" &&
                (e.oldMode && !e.oldMode.startsWith("direct_select"))) {

                setTimeout(() => {
                    switch (currentAction.action_type) {
                        case 'add_fence':
                            drawInstance.changeMode("draw_polygon")
                            break
                        case 'transfer_water':
                            drawInstance.changeMode("draw_point")
                            break
                        case 'add_gate':
                            drawInstance.changeMode("draw_line_string")
                            break
                        default:
                            drawInstance.changeMode("draw_polygon")
                    }
                }, 50)
            }
        }

        map.on("draw.create", handleDrawCreate)
        map.on("draw.modechange", handleModeChange)

        return () => {
            map.off("draw.create", handleDrawCreate)
            map.off("draw.modechange", handleModeChange)
        }
    }, [isDrawingMode, currentAction.action_type])

    const handleTypeSelected = (type: string) => {
        if (!nodeKey.current) return
        setAddActionPanelOpen(true)
        setCurrentAction({
            id: Date.now().toString(),
            action_type: type,
            node_key: nodeKey.current,
            geometry: null,
            elevation_delta: type === 'add_fence' ? '' : undefined,
            landuse_type: type === 'add_fence' ? '' : undefined,
            from_grid: type === 'transfer_water' ? '' : undefined,
            to_grid: type === 'transfer_water' ? '' : undefined,
            q: type === 'transfer_water' ? '' : undefined,
            up_stream: type === 'add_gate' ? '' : undefined,
            down_stream: type === 'add_gate' ? '' : undefined,
            height: type === 'add_gate' ? '' : undefined,
        })

        stopActionDrawing()
    }

    const handleFromGridPicking = () => {

    }

    const handleToGridPicking = () => {

    }

    // 处理上游坐标拾取
    const handleUpstreamPicking = () => {
        if (isPickingUpstream) {
            setIsPickingUpstream(false)
            pickingCancel.current()
            return
        }

        if (isPickingDownstream) {
            setIsPickingDownstream(false)
            pickingCancel.current()
        }

        pickingCancel.current = pickingFromMap({ color: '#3B82F6' }, (marker) => {

            upstreamMarker.current?.remove()

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML('<div class="font-semibold text-blue-600">Upstream</div>')

            marker.setPopup(popup)
            marker.togglePopup()

            upstreamMarker.current = marker

            // 更新坐标
            const coordinates = marker.getLngLat()
            setCurrentAction({
                ...currentAction,
                up_stream: `${coordinates.lng.toFixed(6)},${coordinates.lat.toFixed(6)}`
            })

            setIsPickingUpstream(false)
        })

        setIsPickingUpstream(true)
    }

    // 处理下游坐标拾取
    const handleDownstreamPicking = () => {
        if (isPickingDownstream) {
            setIsPickingDownstream(false)
            pickingCancel.current()
            return
        }

        if (isPickingUpstream) {
            setIsPickingUpstream(false)
            pickingCancel.current()
        }

        pickingCancel.current = pickingFromMap({ color: '#FBBF24' }, (marker) => {
            downstreamMarker.current?.remove()

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML('<div class="font-semibold text-amber-600">Downstream</div>')

            marker.setPopup(popup)
            marker.togglePopup()

            downstreamMarker.current = marker

            const coordinates = marker.getLngLat()
            setCurrentAction({
                ...currentAction,
                down_stream: `${coordinates.lng.toFixed(6)},${coordinates.lat.toFixed(6)}`
            })

            setIsPickingDownstream(false)
        })

        setIsPickingDownstream(true)
    }

    const handleRemoveHumanAction = async () => {

        setCurrentAction({
            id: Date.now().toString(),
            node_key: '',
            action_type: '',
            elevation_delta: '',
            landuse_type: '',
            geometry: null,
        })
        setAddActionPanelOpen(false)
        setEditingActionId(null); // 重置编辑状态

        updateActionList()

    }


    useEffect(() => {
        if (nodeKey.current) {
            updateActionList()
            triggerRepaint()
        }
    }, [nodeKey.current])


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
                                            Flood-Pipe Joint Simulation
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
                                {/* Action Type Selector Dialog */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="bg-green-500 hover:bg-green-600 cursor-pointer" disabled={addActionPanelOpen}>
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Action
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gradient-to-b from-slate-50 to-slate-100 border-slate-200 shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-slate-800 text-lg">Select Action Type</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                            {actionTypes.map((type) => (
                                                <Button
                                                    asChild
                                                    key={type.value}
                                                    variant="outline"
                                                    className="w-full justify-start bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 text-slate-800 hover:from-slate-200 hover:to-slate-300 hover:border-blue-400 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                                                    onClick={() => {
                                                        handleTypeSelected(type.value);
                                                    }}
                                                >
                                                    <DialogClose>
                                                        <div className="flex items-center w-full gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-300 to-slate-400"></div>
                                                            <type.icon className="w-4 h-4" />
                                                            <span className="capitalize">{type.name}</span>
                                                        </div>
                                                    </DialogClose>
                                                </Button>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* 已添加的 Action 列表 */}
                            {actionList.length > 0 && (
                                <div className="space-y-3">
                                    {actionList.map((action) => (
                                        <div key={action.action_id} className="border rounded-lg p-4 bg-slate-50">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-2">
                                                    {action.action_type === 'add_fence' && <Shrimp className="w-4 h-4 text-green-500" />}
                                                    {action.action_type === 'transfer_water' && <Waves className="w-4 h-4 text-blue-500" />}
                                                    {action.action_type === 'add_gate' && <DoorOpen className="w-4 h-4 text-amber-500" />}
                                                    <h4 className="font-medium text-slate-500">
                                                        {actionTypes.find(t => t.value === action.action_type)?.name || action.action_type}
                                                    </h4>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                                        onClick={() => {
                                                            // 处理修改操作
                                                            const actionParams = action.params;
                                                            setCurrentAction({
                                                                id: action.action_id,
                                                                node_key: nodeKey.current || '',
                                                                action_type: action.action_type,
                                                                geometry: actionParams.feature,
                                                                elevation_delta: actionParams.elevation_delta?.toString(),
                                                                landuse_type: actionParams.landuse_type?.toString(),
                                                                from_grid: actionParams.from_grid,
                                                                to_grid: actionParams.to_grid,
                                                                q: actionParams.q?.toString(),
                                                                up_stream: actionParams.up_stream,
                                                                down_stream: actionParams.down_stream,
                                                                height: actionParams.height?.toString(),
                                                            });
                                                            setEditingActionId(action.action_id);
                                                            setAddActionPanelOpen(true);
                                                        }}
                                                    >
                                                        <Paintbrush className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                                        onClick={async () => {
                                                            if (nodeKey.current) {
                                                                const res = await apis.solution.deleteHumanAction.fetch({
                                                                    node_key: nodeKey.current,
                                                                    action_id: action.action_id
                                                                }, false);
                                                                if (res.success) {
                                                                    await updateActionList();
                                                                    toast.success("Action deleted successfully");
                                                                } else {
                                                                    toast.error("Failed to delete action");
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {action.action_type === 'add_fence' && (
                                                <>
                                                    <div className="mt-3">
                                                        <Label htmlFor={`elevation-delta-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Elevation Change
                                                        </Label>
                                                        <Input
                                                            id={`elevation-delta-${action.action_id}`}
                                                            type="text"
                                                            value={action.params.elevation_delta}
                                                            className="h-8 text-sm"
                                                            disabled
                                                        />
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label htmlFor={`landuse-type-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Land Use Type
                                                        </Label>
                                                        <Input
                                                            id={`landuse-type-${action.action_id}`}
                                                            type="text"
                                                            value={action.params.landuse_type}
                                                            className="h-8 text-sm"
                                                            disabled
                                                        />
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <Label className="text-sm mb-1 block text-slate-500">
                                                            Draw Gate
                                                        </Label>
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex-1 min-w-0 bg-sky-500 text-white cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <span className="hidden sm:inline"><Paintbrush className="w-3 h-3 mr-1" /></span>
                                                                <span className="truncate">Start Drawing</span>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 min-w-0 text-red-500 cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <span className="hidden sm:inline"><RotateCcw className="w-3 h-3 mr-1" /></span>
                                                                <span className="truncate">Reset Drawing</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {action.action_type === 'transfer_water' && (
                                                <>
                                                    <div className="mt-3">
                                                        <Label htmlFor={`from-grid-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Start Point Coordinates
                                                        </Label>
                                                        <div className='flex items-center gap-2'>
                                                            <Input
                                                                id={`from-grid-${action.action_id}`}
                                                                type="text"
                                                                value={action.params.from_grid}
                                                                className="h-8 text-sm"
                                                                disabled
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                className="h-8 w-8 text-sm cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <MapPin className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label htmlFor={`to-grid-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            End Point Coordinates
                                                        </Label>
                                                        <div className='flex items-center gap-2'>
                                                            <Input
                                                                id={`to-grid-${action.action_id}`}
                                                                type="text"
                                                                value={action.params.to_grid}
                                                                className="h-8 text-sm"
                                                                disabled
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                className="h-8 w-8 text-sm cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <MapPin className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label htmlFor={`q-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Water Flow
                                                        </Label>
                                                        <Input
                                                            id={`q-${action.action_id}`}
                                                            type="text"
                                                            value={action.params.q}
                                                            className="h-8 text-sm"
                                                            disabled
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {action.action_type === 'add_gate' && (
                                                <>
                                                    <div className="mt-3">
                                                        <Label htmlFor={`up-stream-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Upstream Coordinates
                                                        </Label>
                                                        <div className='flex items-center gap-2'>
                                                            <Input
                                                                id={`up-stream-${action.action_id}`}
                                                                type="text"
                                                                value={action.params.up_stream}
                                                                className="h-8 text-sm"
                                                                disabled
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                className="h-8 w-8 text-sm cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <MapPin className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label htmlFor={`down-stream-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Downstream Coordinates
                                                        </Label>
                                                        <div className='flex items-center gap-2'>
                                                            <Input
                                                                id={`down-stream-${action.action_id}`}
                                                                type="text"
                                                                value={action.params.down_stream}
                                                                className="h-8 text-sm"
                                                                disabled
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                className="h-8 w-8 text-sm cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <MapPin className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label htmlFor={`height-${action.action_id}`} className="text-sm mb-1 block text-slate-500">
                                                            Gate Height
                                                        </Label>
                                                        <Input
                                                            id={`height-${action.action_id}`}
                                                            type="text"
                                                            value={action.params.height}
                                                            className="h-8 text-sm"
                                                            disabled
                                                        />
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <Label className="text-sm mb-1 block text-slate-500">
                                                            Draw Gate
                                                        </Label>
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex-1 min-w-0 bg-sky-500 text-white cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <span className="hidden sm:inline"><Paintbrush className="w-3 h-3 mr-1" /></span>
                                                                <span className="truncate">Start Drawing</span>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 min-w-0 text-red-500 cursor-not-allowed opacity-70"
                                                                disabled
                                                            >
                                                                <span className="hidden sm:inline"><RotateCcw className="w-3 h-3 mr-1" /></span>
                                                                <span className="truncate">Reset Drawing</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Action Panel */}
                            {addActionPanelOpen && (
                                <div className="border rounded-lg p-4 bg-slate-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-slate-500">Add Human Action #{actionList.length + 1}</h4>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                onClick={handleRemoveHumanAction}
                                            >
                                                <Trash2 />
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

                                        {/* Add Fence 表单字段 */}
                                        {currentAction.action_type === 'add_fence' && (
                                            <>
                                                <div>
                                                    <Label htmlFor={`elevation-delta-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Elevation Change
                                                    </Label>
                                                    <Input
                                                        id={`elevation-delta-${currentAction.id}`}
                                                        type="text"
                                                        value={currentAction.elevation_delta}
                                                        onChange={(e) => {
                                                            setCurrentAction({ ...currentAction, elevation_delta: e.target.value });
                                                            triggerRepaint();
                                                        }}
                                                        className="h-8 text-sm"
                                                        placeholder="Enter a number"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor={`landuse-type-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Land Use Type
                                                    </Label>
                                                    <Input
                                                        id={`landuse-type-${currentAction.id}`}
                                                        type="text"
                                                        value={currentAction.landuse_type}
                                                        onChange={(e) => {
                                                            setCurrentAction({ ...currentAction, landuse_type: e.target.value });
                                                            triggerRepaint();
                                                        }}
                                                        className="h-8 text-sm"
                                                        placeholder="Enter a number"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Transfer Water 表单字段 */}
                                        {currentAction.action_type === 'transfer_water' && (
                                            <>
                                                <div>
                                                    <Label htmlFor={`from-grid-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Start Point Coordinates
                                                    </Label>
                                                    <div className='flex items-center gap-2'>
                                                        <Input
                                                            id={`from-grid-${currentAction.id}`}
                                                            type="text"
                                                            value={currentAction.from_grid || ''}
                                                            onChange={(e) => {
                                                                setCurrentAction({ ...currentAction, from_grid: e.target.value });
                                                                triggerRepaint();
                                                            }}
                                                            className="h-8 text-sm"
                                                            placeholder="Enter start point coordinates"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className={`h-8 w-8 text-sm cursor-pointer ${isPickingUpstream ? 'bg-blue-100 border-blue-500' : ''}`}
                                                            onClick={handleFromGridPicking}
                                                        >
                                                            <MapPin className={`w-4 h-4 ${isPickingUpstream ? 'text-blue-500' : ''}`} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`to-grid-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        End Point Coordinates
                                                    </Label>
                                                    <div className='flex items-center gap-2'>
                                                        <Input
                                                            id={`to-grid-${currentAction.id}`}
                                                            type="text"
                                                            value={currentAction.to_grid || ''}
                                                            onChange={(e) => {
                                                                setCurrentAction({ ...currentAction, to_grid: e.target.value });
                                                                triggerRepaint();
                                                            }}
                                                            className="h-8 text-sm"
                                                            placeholder="Enter end point coordinates"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className={`h-8 w-8 text-sm cursor-pointer ${isPickingDownstream ? 'bg-amber-100 border-amber-500' : ''}`}
                                                            onClick={handleToGridPicking}
                                                        >
                                                            <MapPin className={`w-4 h-4 ${isPickingDownstream ? 'text-amber-500' : ''}`} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`q-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Water Volume
                                                    </Label>
                                                    <Input
                                                        id={`q-${currentAction.id}`}
                                                        type="text"
                                                        value={currentAction.q || ''}
                                                        onChange={(e) => {
                                                            setCurrentAction({ ...currentAction, q: e.target.value });
                                                            triggerRepaint();
                                                        }}
                                                        className="h-8 text-sm"
                                                        placeholder="Enter water volume"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Add Gate 表单字段 */}
                                        {currentAction.action_type === 'add_gate' && (
                                            <>
                                                <div>
                                                    <Label htmlFor={`up-stream-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Upstream Coordinates
                                                    </Label>
                                                    <div className='flex items-center gap-2'>
                                                        <Input
                                                            id={`up-stream-${currentAction.id}`}
                                                            type="text"
                                                            value={currentAction.up_stream || ''}
                                                            onChange={(e) => {
                                                                setCurrentAction({ ...currentAction, up_stream: e.target.value });
                                                                triggerRepaint();
                                                            }}
                                                            className="h-8 text-sm"
                                                            placeholder="Enter upstream coordinates"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className={`h-8 w-8 text-sm cursor-pointer ${isPickingUpstream ? 'bg-blue-100 border-blue-500' : ''}`}
                                                            onClick={handleUpstreamPicking}
                                                        >
                                                            <MapPin className={`w-4 h-4 ${isPickingUpstream ? 'text-blue-500' : ''}`} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`down-stream-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Downstream Coordinates
                                                    </Label>
                                                    <div className='flex items-center gap-2'>
                                                        <Input
                                                            id={`down-stream-${currentAction.id}`}
                                                            type="text"
                                                            value={currentAction.down_stream || ''}
                                                            onChange={(e) => {
                                                                setCurrentAction({ ...currentAction, down_stream: e.target.value });
                                                                triggerRepaint();
                                                            }}
                                                            className="h-8 text-sm"
                                                            placeholder="Enter downstream coordinates"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className={`h-8 w-8 text-sm cursor-pointer ${isPickingDownstream ? 'bg-amber-100 border-amber-500' : ''}`}
                                                            onClick={handleDownstreamPicking}
                                                        >
                                                            <MapPin className={`w-4 h-4 ${isPickingDownstream ? 'text-amber-500' : ''}`} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`height-${currentAction.id}`} className="text-sm mb-1 block text-slate-500">
                                                        Height
                                                    </Label>
                                                    <Input
                                                        id={`height-${currentAction.id}`}
                                                        type="text"
                                                        value={currentAction.height || ''}
                                                        onChange={(e) => {
                                                            setCurrentAction({ ...currentAction, height: e.target.value });
                                                            triggerRepaint();
                                                        }}
                                                        className="h-8 text-sm"
                                                        placeholder="Enter height"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {currentAction.action_type !== 'transfer_water' && (
                                            <div>
                                                <Label className="text-sm mb-1 block text-slate-500">
                                                    Draw Gate
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
                                                        className={`cursor-pointer flex-1 min-w-0 text-red-500 hover:text-red-600 hover:bg-red-50`}
                                                        onClick={() => {
                                                            resetActionDrawing()
                                                        }}
                                                    >
                                                        <span className="hidden sm:inline"><RotateCcw className="w-3 h-3 mr-1" /></span>
                                                        <span className="truncate">Reset Drawing</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Action Button */}
                                        <div className="mt-6 pt-4 border-t border-slate-200">
                                            <Button
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 cursor-pointer"
                                                onClick={() => registerHumanAction(currentAction)}
                                                disabled={
                                                    !currentAction.action_type ||
                                                    (currentAction.action_type === 'add_fence' && (!currentAction.elevation_delta || !currentAction.landuse_type)) ||
                                                    (currentAction.action_type === 'transfer_water' && (!currentAction.from_grid || !currentAction.to_grid || !currentAction.q)) ||
                                                    (currentAction.action_type === 'add_gate' && (!currentAction.up_stream || !currentAction.down_stream || !currentAction.height))
                                                }
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
