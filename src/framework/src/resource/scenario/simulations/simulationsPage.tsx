import React, { useEffect, useReducer, useRef, useState } from 'react'
import { SimulationsPageProps } from './types'
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
    Play,
    Square,
} from "lucide-react"
import * as apis from '@/core/apis/apis'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { cn } from '@/utils/utils'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { SimulationsPageContext } from './simulations'
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

export default function SimulationsPage({ node }: SimulationsPageProps) {

    const pageContext = useRef<SimulationsPageContext | null>(null)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [isSolutionDragOver, setIsSolutionDragOver] = useState(false);
    const [resetFormDialogOpen, setResetFormDialogOpen] = useState(false);

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as SimulationsPageContext

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('Component unmounted')
    }

    const handleDrop = async (e: React.DragEvent) => {

        e.preventDefault()

        setIsSolutionDragOver(false);

        const nodeKey = e.dataTransfer.getData('text/plain')
        if (!nodeKey || !pageContext.current) return

        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        const solutionData = await apis.solution.getSolutionByNodeKey.fetch(nodeKey, node.tree.isPublic)
        store.get<{ on: Function, off: Function }>('isLoading')!.off()

        pageContext.current.solutionData = solutionData.data
        pageContext.current.solutionNodeKey = nodeKey
        toast.success(`Solution added successfully`);
        triggerRepaint();
    };

    const handleResourceRemove = () => {
        if (!pageContext.current) return
        pageContext.current.solutionData = null
        triggerRepaint()
        toast.success(`Solution removed successfully`);
    }

    const handleStartSimulation = async () => {
        if (!pageContext.current) return

        let serviceAddress = ''

        // Step 1: Discover service
        const discoverServiceRes = await apis.simulation.discoverProxy.fetch(pageContext.current.solutionNodeKey, node.tree.isPublic)
        if (!discoverServiceRes.success) {
            toast.error(discoverServiceRes.message)
            return
        } else {
            serviceAddress = discoverServiceRes.address
        }

        const solutionEnv = {
            solution_node_key: pageContext.current.solutionNodeKey,
            solution_address: serviceAddress
        }

        // Step 2: Clone package
        const clonePackageRes = await apis.simulation.clonePackage.fetch(solutionEnv, false)
        // clonePackageRes return task.id
        // TODO: Update progress bar

        // Step 3: Build process group
        const processGroupMeta = {
            solution_node_key: pageContext.current.solutionNodeKey,
            simulation_name: pageContext.current.name,
            group_type: 'flood_pipe',
            solution_address: serviceAddress
        }

        const buildProcessGroupRes = await apis.simulation.buildProcessGroup.fetch(processGroupMeta, false)
        // return result and group_id

        // Step 4: Start simulation

        const startSimulationMeta = {
            solution_node_key: pageContext.current.solutionNodeKey,
            simulation_name: pageContext.current.name,
        }
        const startSimulationRes = await apis.simulation.startSimulation.fetch(startSimulationMeta, false)

        toast.success('Simulation started');
    };

    const handleStopSimulation = async () => {

        if (!pageContext.current) return

        const simulation_node_key = node.key + '.' + pageContext.current.name

        const stopSimulationMeta = {
            solution_node_key: pageContext.current.solutionNodeKey,
            simulation_node_key: simulation_node_key
        }

        const stopSimulationRes = await apis.simulation.stopSimulation.fetch(stopSimulationMeta, false)
        toast.info('Simulation stopped');
    };

    const resetForm = () => {
        if (!pageContext.current) return
        pageContext.current.solutionData = {
            name: '',
            model_type: '',
            action_types: [],
            env: {
                grid_node_key: '',
                solution_node_key: ''
            }
        };
        triggerRepaint();
        setResetFormDialogOpen(false);
    };

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
                            <h2 className="text-md font-semibold text-slate-900">Simulation Management</h2>
                            <p className="text-sm text-slate-500">Create and manage simulations</p>
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
                    {/* Solution Drop Zone */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Upload className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Solution Resources</span>
                            </div>
                            <div
                                className={cn(
                                    "mt-2 p-3 border-2 border-dashed rounded-lg text-center transition-colors",
                                    isSolutionDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-300",
                                    pageContext.current?.solutionData?.env.solution_node_key ? "bg-green-50 border-green-300" : ""
                                )}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsSolutionDragOver(true);
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    setIsSolutionDragOver(true);
                                }}
                                onDragLeave={() => setIsSolutionDragOver(false)}
                                onDrop={(e) => handleDrop(e)}
                            >
                                {pageContext.current?.solutionData ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-medium">Solution added</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleResourceRemove()}
                                            className="h-7 w-7 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                        <p className="mt-1 text-sm text-slate-500">Drag and drop solution here</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Solution Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
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
                                            value={pageContext.current?.name}
                                            onChange={(e) => {
                                                pageContext.current!.name = e.target.value
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
                                                <SelectValue placeholder="Select model type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="flood_pipe">Flood-Pipe Joint Simulation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Types */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
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
                                                    pageContext.current!.solutionData!.action_types.filter(t => t !== 'add_fence')
                                            }
                                            triggerRepaint()
                                        }}
                                    />
                                    <label htmlFor="add_fence" className="text-sm font-medium cursor-pointer">
                                        Add Fence
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Control Buttons */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex justify-between gap-2">
                                <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                    onClick={handleStartSimulation}
                                >
                                    <Play className="w-4 h-4 mr-1" />Start
                                </Button>
                                <Button
                                    className="flex-1 bg-red-500 hover:bg-red-600"
                                    onClick={handleStopSimulation}
                                >
                                    <Square className="w-4 h-4 mr-1" />Stop
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Reset Form Dialog */}
            <AlertDialog open={resetFormDialogOpen} onOpenChange={setResetFormDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reset the form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will clear all the information you have entered, and it cannot be recovered.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetForm}>Confirm Reset</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Main Content Area */}
            <div className="flex-1 p-6">
                <div className="text-2xl font-bold mb-6">Simulation Configuration</div>
                {/* 这里可以放置地图或其他内容 */}
                <div className="bg-white rounded-lg shadow-md p-6 h-[80vh]">
                    <p className="text-gray-500">Please add resources from the left panel and configure simulation parameters</p>
                </div>
            </div>
        </div>
    )
} 