import React, { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Dam,
    Eye,
    Info,
    MapPin,
    Upload,
    RotateCcw,
    TrafficCone,
    Box,
    BrushCleaning,
    CheckCircle,
    SquaresUnite,
    Mountain,
    MountainSnow,
    TentTree,
    CloudRainWind,
    Construction,
    Waves,
    Clipboard,
} from "lucide-react"
import * as apis from '@/core/apis/apis'
import { SolutionsPageProps } from './types'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { cn } from '@/utils/utils'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { SolutionsPageContext } from './solutions'
import { toast } from 'sonner'
import store from '@/store'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SolutionMeta } from '@/core/apis/types'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const REORDER_TYPE = 'application/x-lum-reorder'


export default function SolutionsPage({ node }: SolutionsPageProps) {

    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<SolutionsPageContext | null>(null)
    const [resetFormDialogOpen, setResetFormDialogOpen] = useState(false)
    const [resetDropZoneDialogOpen, setResetDropZoneDialogOpen] = useState(false)

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
        console.log('Component unmounted')
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent, type: string) => {
        e.preventDefault()
        setIsDragOver(false)

        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            return
        }

        const nodeKey = e.dataTransfer.getData('text/plain')

        // Upload Grid
        if (type === 'grid') {
            if (nodeKey.split('.')[4] === 'grids') {
                if (pageContext.current?.solutionData?.env.grid_node_key) {
                    toast.warning('Grid already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.grid_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Grid uploaded successfully')
            } else {
                toast.error('Please select the correct grid in grids')
            }
        } else if (type === 'dem') {
            if (nodeKey.split('.')[1] === 'dems') {
                if (pageContext.current?.solutionData?.env.dem_node_key) {
                    toast.warning('DEM already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.dem_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('DEM uploaded successfully')
            } else {
                toast.error('Please select the correct DEM in dems')
            }

        } else if (type === 'lum') {
            if (nodeKey.split('.')[1] === 'lums') {
                if (pageContext.current?.solutionData?.env.lum_node_key) {
                    toast.warning('LUM already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.lum_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('LUM uploaded successfully')
            } else {
                toast.error('Please select the correct LUM in lums')
            }
        } else if (type === 'rainfall') {
            if (nodeKey.split('.')[1] === 'rainfalls') {
                if (pageContext.current?.solutionData?.env.rainfall_node_key) {
                    toast.warning('Rainfall already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.rainfall_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Rainfall uploaded successfully')
            } else {
                toast.error('Please select the correct Rainfall in rainfalls')
            }
        } else if (type === 'gate') {
            if (nodeKey.split('.')[1] === 'gates') {
                if (pageContext.current?.solutionData?.env.gate_node_key) {
                    toast.warning('Gate already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.gate_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Gate uploaded successfully')
            } else {
                toast.error('Please select the correct Gate in gates')
            }
        } else if (type === 'tide') {
            if (nodeKey.split('.')[1] === 'tides') {
                if (pageContext.current?.solutionData?.env.tide_node_key) {
                    toast.warning('Tide already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.tide_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Tide uploaded successfully')
            } else {
                toast.error('Please select the correct Tide in tides')
            }
        } else if (type === 'inp') {
            if (nodeKey.split('.')[1] === 'inps') {
                if (pageContext.current?.solutionData?.env.inp_node_key) {
                    toast.warning('Inp already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.inp_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Inp uploaded successfully')
            } else {
                toast.error('Please select the correct Inp in inps')
            }
        }
    }

    const handleResourceRemove = (type: string) => {
        if (type === 'grid') {
            pageContext.current!.solutionData!.env.grid_node_key = ''
        } else if (type === 'dem') {
            pageContext.current!.solutionData!.env.dem_node_key = ''
        } else if (type === 'lum') {
            pageContext.current!.solutionData!.env.lum_node_key = ''
        } else if (type === 'rainfall') {
            pageContext.current!.solutionData!.env.rainfall_node_key = ''
        } else if (type === 'gate') {
            pageContext.current!.solutionData!.env.gate_node_key = ''
        } else if (type === 'tide') {
            pageContext.current!.solutionData!.env.tide_node_key = ''
        } else if (type === 'inp') {
            pageContext.current!.solutionData!.env.inp_node_key = ''
        }
        triggerRepaint()
    }

    const handleResetDropZone = () => {
        if (pageContext.current) {
            pageContext.current.solutionData!.env = {
                grid_node_key: '',
                dem_node_key: '',
                lum_node_key: '',
                rainfall_node_key: '',
                gate_node_key: '',
                tide_node_key: '',
                inp_node_key: '',
            }
            triggerRepaint()
            toast.info('Reset drop zone')
        }
    }

    const handleResetForm = () => {
        if (pageContext.current) {
            pageContext.current.solutionData = {
                name: '',
                model_type: '',
                env: {
                    grid_node_key: '',
                    dem_node_key: '',
                    lum_node_key: '',
                    rainfall_node_key: '',
                    gate_node_key: '',
                    tide_node_key: '',
                    inp_node_key: '',
                },
                action_types: [],
            }
            triggerRepaint()
        }
    }

    const handleCreateSolution = async () => {

        const solution = {
            name: pageContext.current?.solutionData?.name,
            model_type: pageContext.current?.solutionData?.model_type,
            env: pageContext.current?.solutionData?.env,
            action_types: pageContext.current?.solutionData?.action_types,
        } as SolutionMeta

        console.log(solution)

        const createSolutionRes = await apis.solution.createSolution.fetch(solution, node.tree.isPublic)

        if (createSolutionRes.success) {
            const tree = node.tree as SceneTree
            await tree.alignNodeInfo(node, true)
            tree.notifyDomUpdate()

            toast.success('Create Solution Success')
        } else {
            toast.error('Create Solution Failed')
        }

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
                            <h2 className="text-md font-semibold text-slate-900">Create New Solution</h2>
                            <p className="text-sm text-slate-500">New Solution Details</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='destructive'
                                className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                onClick={() => setResetFormDialogOpen(true)}
                            >
                                <RotateCcw className="w-4 h-4" />Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {/* Solution Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Basic Information</span>
                            </div>
                            <div className="ml-6 space-y-2">
                                {/* Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Name</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <Input
                                            placeholder='Enter name'
                                            className='w-50'
                                            value={pageContext.current?.solutionData?.name}
                                            onChange={(e) => {
                                                pageContext.current!.solutionData!.name = e.target.value
                                                triggerRepaint()
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Type */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Type</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <Select
                                            value={pageContext.current?.solutionData?.model_type || ''}
                                            onValueChange={(value) => {
                                                if (pageContext.current) {
                                                    pageContext.current.solutionData!.model_type = value;
                                                    triggerRepaint();
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-50">
                                                <SelectValue placeholder="Select Mode Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="flood_pipe">洪水-管道联合模拟</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>


                            </div>
                            {/* Action Types */}
                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrafficCone className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Action Types</span>
                                </div>
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_fence"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('add_fence')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('add_fence')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'add_fence')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="add_fence" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            add fence
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="transfer_water"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('transfer_water')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('transfer_water')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'transfer_water')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="transfer_water" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            transfer water
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_gate"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('add_gate')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('add_gate')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'add_gate')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="add_gate" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            add gate
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resource Upload Area */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="space-y-4">
                            {/* Upload Status */}
                            <div className=" flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Box className='w-4 h-4' />
                                    <span className='text-sm font-medium text-slate-500 uppercase tracking-wide'>Resources Upload</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 text-white hover:text-white cursor-pointer shadow-sm"
                                    onClick={() => setResetDropZoneDialogOpen(true)}
                                >
                                    <BrushCleaning className="w-4 h-4" />Clear
                                </Button>
                            </div>
                            {/* Grid */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <SquaresUnite className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Grid Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'grid')}
                                >
                                    {!pageContext.current?.solutionData?.env.grid_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Grid node here</p>
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
                                                            {pageContext.current.solutionData?.env.grid_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('grid')}
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
                            </div>
                            {/* Dem */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MountainSnow className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">DEM Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'dem')}
                                >
                                    {!pageContext.current?.solutionData?.env.dem_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag DEM node here</p>
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
                                                            {pageContext.current.solutionData.env.dem_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('dem')}
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
                            </div>
                            {/* LUM */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <TentTree className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">LUM Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'lum')}
                                >
                                    {!pageContext.current?.solutionData?.env.lum_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag LUM node here</p>
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
                                                            {pageContext.current.solutionData.env.lum_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('lum')}
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
                            </div>
                            {/* Rainfall */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CloudRainWind className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rainfall Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'rainfall')}
                                >
                                    {!pageContext.current?.solutionData?.env.rainfall_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Rainfall node here</p>
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
                                                            {pageContext.current.solutionData.env.rainfall_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('rainfall')}
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
                            </div>
                            {/* gate */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Construction className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gate Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'gate')}
                                >
                                    {!pageContext.current?.solutionData?.env.gate_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Gate node here</p>
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
                                                            {pageContext.current.solutionData.env.gate_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('gate')}
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
                            </div>
                            {/* Tide */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Waves className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tide Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'tide')}
                                >
                                    {!pageContext.current?.solutionData?.env.tide_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Tide node here</p>
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
                                                            {pageContext.current.solutionData.env.tide_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('tide')}
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
                            </div>
                            {/* INP */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clipboard className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">INP Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'inp')}
                                >
                                    {!pageContext.current?.solutionData?.env.inp_node_key ? (
                                        <div className="h-[5vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag INP node here</p>
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
                                                            {pageContext.current.solutionData.env.inp_node_key.split(".").pop()}
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
                                                        onClick={() => handleResourceRemove('inp')}
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
                            </div>

                        </CardContent>
                    </Card>
                    <div>
                        <Button
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            onClick={handleCreateSolution}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Create New Solution
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={node} style='w-full h-full' />
            </div>

            {/* Alert Dialog for Form Reset */}
            <AlertDialog open={resetFormDialogOpen} onOpenChange={setResetFormDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Form Reset?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will clear all form data entered, including all selections in the resource area. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetForm}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Confirm Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog for Drop Zone Reset */}
            <AlertDialog open={resetDropZoneDialogOpen} onOpenChange={setResetDropZoneDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Clearing Resource Area?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will clear all selected resource items. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetDropZone}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Confirm Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >

    )
}
