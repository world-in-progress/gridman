import { SolutionPageProps } from './types'
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
    Plus,
    Pencil,
} from "lucide-react"
import * as apis from '@/core/apis/apis'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { cn } from '@/utils/utils'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { HumanAction, SolutionPageContext } from './solution'
import { HumanAction as HumanActionData } from '@/core/apis/types'
import { toast } from 'sonner'
import store from '@/store'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const REORDER_TYPE = 'application/x-lum-reorder'

const MODEL_TYPE_MAP: Record<string, string> = {
    'flood_pipe': '洪水-管道联合模拟',
}

export default function SolutionPage({ node }: SolutionPageProps) {

    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<SolutionPageContext | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [clearActionsDialogOpen, setClearActionsDialogOpen] = useState(false)
    const [canAddAction, setCanAddAction] = useState(true)


    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await SolutionPageContext.create(node)
        console.log(pageContext.current?.solutionData)

        // 检查是否有未注册的action，如果有则不允许添加新的
        if (pageContext.current?.humanActions && pageContext.current.humanActions.length > 0) {
            const lastAction = pageContext.current.humanActions[pageContext.current.humanActions.length - 1];
            setCanAddAction(lastAction.registered === true);
        }

        triggerRepaint()
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

    const handleDrop = async (e: React.DragEvent, index: number) => {
        e.preventDefault()
        setIsDragOver(false)

        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            return
        }

        const nodeKey = e.dataTransfer.getData('text/plain')

        console.log(nodeKey)

        // Upload Vector
        if (nodeKey.split('.')[1] === 'vectors') {
            if (pageContext.current?.humanActions[index || 0]?.node_key) {
                toast.warning('Vector already selected')
                return
            }

            store.get<{ on: Function, off: Function }>('isLoading')!.on()

            pageContext.current!.humanActions[index || 0]!.node_key = nodeKey

            const featureJson = await apis.feature.getFeatureJsonComputation.fetch(nodeKey, node.tree.isPublic)

            pageContext.current!.humanActions[index || 0]!.geometry = featureJson.feature_json

            console.log(pageContext.current!.humanActions[index || 0]!.geometry)

            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            toast.success('Grid uploaded successfully')
            triggerRepaint()
        } else {
            toast.error('Please select the correct vector in vectors')
        }
        // Upload Human Action Resource
        // if (type === 'humanAction') {
        //     if (nodeKey.split('.')[1] === 'vectors') {
        //         if (pageContext.current?.humanActions?.[index || 0]?.node_key) {
        //             toast.warning('Resource already selected')
        //             return
        //         }

        //         store.get<{ on: Function, off: Function }>('isLoading')!.on()

        //         pageContext.current!.humanActions![index || 0]!.node_key = nodeKey

        //         store.get<{ on: Function, off: Function }>('isLoading')!.off()
        //         triggerRepaint()
        //         toast.success('Resource uploaded successfully')
        //     } else {
        //         toast.error('Please select the correct resource in resources')
        //     }
        // }
    }

    const handlePackageSolution = async () => {
        const response = await apis.solution.packageSolution.fetch(node.key, node.tree.isPublic)
        if (response.success) {
            toast.success('Solution packaged successfully')
        } else {
            toast.error('Failed to package solution')
        }
    }

    const handleDeleteSolution = async () => {
        setDeleteDialogOpen(false)
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        const deleteResponse = await apis.solution.deleteSolution.fetch(node.key, node.tree.isPublic)
        if (deleteResponse.success) {
            (node.tree as SceneTree).removeNode(node)
            toast.success('Solution deleted successfully')
        } else {
            toast.error('Failed to delete solution')
        }
        store.get<{ on: Function, off: Function }>('isLoading')!.off()
    }

    const handleClearActions = () => {
        setClearActionsDialogOpen(false)
        pageContext.current!.humanActions = []
        triggerRepaint()
    }

    const registerHumanAction = async (action: HumanAction) => {


        // console.log(featureJson)
        // 如果是最后一个action，允许添加新的
        const humanAction = {
            node_key: node.key,
            action_type: action.action_type,
            params: {
                elevation_delta: Number(action.elevation_delta),
                landuse_type: Number(action.landuse_type),
                feature: action.geometry
            }
        }
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        const registerResponse = await apis.solution.addHumanAction.fetch(humanAction, node.tree.isPublic)
        store.get<{ on: Function, off: Function }>('isLoading')!.off()

        if (registerResponse.success) {
            setCanAddAction(true)
            toast.success('Human action registered successfully')
        } else {
            toast.error('Failed to register human action')
        }

        triggerRepaint()
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
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <RotateCcw className="w-4 h-4" />Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
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
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.name}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Type</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={MODEL_TYPE_MAP[pageContext.current?.solutionData?.model_type || ''] || pageContext.current?.solutionData?.model_type || ''}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>


                                </div>
                            </div>
                            {/* Action Types */}
                            <div className='border-t border-slate-200 pt-4'>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrafficCone className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Action Types</span>
                                </div>
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_fence"
                                            className='w-4 h-4'
                                            checked={pageContext.current?.solutionData?.action_types?.includes('add_fence')}
                                            disabled={true}
                                        />
                                        <label htmlFor="add_fence" className="text-sm font-medium leading-none text-slate-600">
                                            add fence
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="transfer_water"
                                            className='w-4 h-4'
                                            checked={pageContext.current?.solutionData?.action_types?.includes('transfer_water')}
                                            disabled={true}
                                        />
                                        <label htmlFor="transfer_water" className="text-sm font-medium leading-none text-slate-600">
                                            transfer water
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_gate"
                                            className='w-4 h-4'
                                            checked={pageContext.current?.solutionData?.action_types?.includes('add_gate')}
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
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.grid_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* DEM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">DEM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.dem_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* LUM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">LUM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.lum_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* Rainfall */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Rainfall</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.rainfall_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* Gate */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Gate</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.gate_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* Tide */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Tide</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.tide_node_key}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                    {/* INP */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">INP</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            <Input
                                                placeholder='Enter name'
                                                className='w-50'
                                                value={pageContext.current?.solutionData?.env.inp_node_key}
                                                readOnly={true}
                                            />
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
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant='destructive'
                                        className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                        onClick={() => setClearActionsDialogOpen(true)}
                                    >
                                        <RotateCcw className="w-4 h-4" />Clear
                                    </Button>
                                </div>
                            </div>

                            {/* Human Actions Container */}
                            <div className="space-y-4">
                                {/* 如果没有human actions，显示添加按钮 */}
                                {(!pageContext.current?.humanActions || pageContext.current.humanActions.length === 0) ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed"
                                        onClick={() => {
                                            if (!pageContext.current?.humanActions) {
                                                pageContext.current!.humanActions = [];
                                            }
                                            pageContext.current?.humanActions.push({
                                                id: Date.now().toString(),
                                                action_type: '',
                                                elevation_delta: '',
                                                landuse_type: '',
                                                node_key: '',
                                                geometry: null,
                                                registered: false // 添加注册状态属性
                                            });
                                            // 添加新action后，禁止添加下一个，直到当前的注册
                                            setCanAddAction(false);
                                            triggerRepaint()
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Human Action
                                    </Button>
                                ) : (
                                    <>
                                        {/* Human Actions列表 */}
                                        <div className="space-y-4">
                                            {pageContext.current.humanActions.map((action, index) => (
                                                <div key={action.id} className="border rounded-lg p-4 bg-slate-50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-medium">Human Action {index + 1}</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-500"
                                                            onClick={() => {
                                                                pageContext.current?.humanActions.splice(index, 1);
                                                                triggerRepaint()
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Action Type 选择器 */}
                                                    <div className="mb-4">
                                                        <Label htmlFor={`action-type-${action.id}`} className="text-xs mb-1 block">
                                                            Action Type
                                                        </Label>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                action.action_type = value;
                                                                triggerRepaint()
                                                            }}
                                                            value={action.action_type}
                                                        >
                                                            <SelectTrigger id={`action-type-${action.id}`}>
                                                                <SelectValue placeholder="选择Action类型" />
                                                            </SelectTrigger>
                                                            <SelectContent className='cursor-pointern'>
                                                                {pageContext.current?.solutionData?.action_types?.map(type => (
                                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Tabs: 绘制和上传 */}
                                                    <Tabs defaultValue="draw" className="mb-4 w-full">
                                                        <TabsList className="grid grid-cols-2 w-full">
                                                            <TabsTrigger value="draw" className='cursor-pointer'>Draw</TabsTrigger>
                                                            <TabsTrigger value="upload" className='cursor-pointer'>Upload</TabsTrigger>
                                                        </TabsList>
                                                        <TabsContent value="draw" className="pt-4">
                                                            <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[120px] flex items-center justify-center">
                                                                <div className="text-center">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className='cursor-pointer bg-sky-500 hover:bg-sky-600 text-white'
                                                                    >
                                                                        <Pencil className="w-3 h-3 mr-1" />
                                                                        Start Drawing
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                        <TabsContent value="upload" className="pt-4">
                                                            <div
                                                                className={cn(
                                                                    "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                                                    isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                                                )}
                                                                onDragOver={handleDragOver}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={(e) => {
                                                                    handleDrop(e, index)
                                                                }}
                                                            >
                                                                {!action.node_key ? (
                                                                    <div className="h-[80px] flex flex-col justify-center items-center text-slate-400">
                                                                        <Upload className="w-6 h-6 mb-1" />
                                                                        <p className="text-sm font-medium">拖拽Vector资源到此处</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="w-4 h-4 text-blue-500" />
                                                                            <p className="text-slate-900 text-sm font-medium truncate">
                                                                                {action.node_key.split('.').pop()}
                                                                            </p>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 p-0 hover:text-red-500"
                                                                            onClick={() => {
                                                                                action.node_key = '';
                                                                                triggerRepaint()
                                                                            }}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TabsContent>
                                                    </Tabs>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor={`elevation-delta-${action.id}`} className="text-xs mb-1 block">
                                                                Elevation Delta
                                                            </Label>
                                                            <Input
                                                                id={`elevation-delta-${action.id}`}
                                                                type="text"
                                                                value={action.elevation_delta}
                                                                onChange={(e) => {
                                                                    action.elevation_delta = e.target.value;
                                                                    triggerRepaint()
                                                                }}
                                                                className="h-8 text-sm"
                                                                placeholder="Enter Number"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`landuse-type-${action.id}`} className="text-xs mb-1 block">
                                                                Landuse Type
                                                            </Label>
                                                            <Input
                                                                id={`landuse-type-${action.id}`}
                                                                type="text"
                                                                value={action.landuse_type}
                                                                onChange={(e) => {
                                                                    action.landuse_type = e.target.value;
                                                                    triggerRepaint()
                                                                }}
                                                                className="h-8 text-sm"
                                                                placeholder="Enter Number"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* 添加注册按钮 */}
                                                    <div className="mt-4 flex justify-end">
                                                        <Button
                                                            variant="default"
                                                            className="bg-green-500 hover:bg-green-600 text-white"
                                                            onClick={() => {
                                                                action.registered = true;
                                                                registerHumanAction(action)
                                                            }}
                                                            disabled={action.registered}
                                                        >
                                                            {action.registered ? 'Registered' : 'Register'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                className={`w-full border-dashed ${canAddAction ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                                onClick={() => {
                                                    if (!canAddAction) return;

                                                    pageContext.current?.humanActions.push({
                                                        id: Date.now().toString(),
                                                        action_type: '',
                                                        elevation_delta: '',
                                                        landuse_type: '',
                                                        node_key: '',
                                                        geometry: null,
                                                        registered: false // 添加注册状态属性
                                                    });
                                                    // 添加新action后，暂时禁止添加下一个，直到当前的注册
                                                    setCanAddAction(false);
                                                    triggerRepaint()
                                                }}
                                                disabled={!canAddAction}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Human Action
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <div>
                        <Button
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            onClick={handlePackageSolution}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Package This Solution
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={node} style='w-full h-full' />
            </div>

            {/* Alert Dialog for delete solution */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete Solution?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This operation will delete the current solution, including all added actions. This operation cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSolution}
                            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog for Clear Actions */}
            <AlertDialog open={clearActionsDialogOpen} onOpenChange={setClearActionsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Clear Actions?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This operation will clear all selected resources. This operation cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearActions}
                            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
