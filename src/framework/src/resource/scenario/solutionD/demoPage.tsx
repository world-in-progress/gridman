import { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Box,
    Dam,
    Info,
    Plus,
    TrafficCone,
    CheckCircle,
    Shrimp,
    Waves,
    DoorOpen,
    Play,
} from "lucide-react"
import { toast } from 'sonner'
import * as apis from '@/core/apis/apis'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from "@/components/ui/card"
import MapContainer from '@/components/mapContainer/mapContainer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import type { HumanAction } from '@/core/apis/types';
import AddFenceForm from './actionForm/AddFenceForm'
import AddGateForm from './actionForm/AddGateForm'
import SimulationPanel from './simulationPanel'
import TransferWaterForm from './actionForm/TransferWaterForm'
import store from '@/store'
import { ISceneNode } from '@/core/scene/iscene'
import { SolutionPageContext } from './solution'
import { SceneNode } from '@/components/resourceScene/scene'

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

export default function DemoPage({ node }: { node: ISceneNode }) {

    const [actionList, setActionList] = useState<HumanAction[]>([])

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const nodeKey = useRef<string | null>(null)
    const proxyAddress = useRef<string | null>(null)

    const [currentActionType, setCurrentActionType] = useState<'add_fence' | 'transfer_water' | 'add_gate' | ''>('');
    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [simulationReady, setSimulationReady] = useState<boolean>(false)
    const [showSimulationCard, setShowSimulationCard] = useState<boolean>(true)

    const pageContext = useRef<SolutionPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await SolutionPageContext.create(node)

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }


    useEffect(() => {
        async function createSolution() {
            const solutionRes = await apis.solution.createSolution.fetch({
                "name": String(Date.now()),
                "model_type": "flood_pipe",
                "env": {
                    // "grid_node_key": "root.topo.schemas.test.grids.test",
                    // "dem_node_key": "root.dems.test",
                    // "lum_node_key": "root.lums.test",
                    // "rainfall_node_key": "root.rainfalls.test",
                    // "gate_node_key": "root.gates.test",
                    // "tide_node_key": "root.tides.test",
                    // "inp_node_key": "root.inps.test"
                    "grid_node_key": "root.topo.schemas.1.grids.12",
                    "dem_node_key": "root.dems.dem5",
                    "lum_node_key": "root.lums.lum1",
                    "rainfall_node_key": "root.rainfalls.rainfall0812",
                    "gate_node_key": "root.gates.gate0812",
                    "tide_node_key": "root.tides.tide0812",
                    "inp_node_key": "root.inps.inp0812"
                },
                "action_types": [
                    "add_fence",
                    "transfer_water",
                    "add_gate"
                ]
            }, false)
            if (!solutionRes.success) {
                toast.error('Failed to create solution')
                return
            }

            nodeKey.current = solutionRes.message

            const discoveryRes = await apis.simulation.discoverProxy.fetch(nodeKey.current, false)
            if (!discoveryRes.success) {
                toast.error('Failed to discover proxy')
                return
            }

            proxyAddress.current = discoveryRes.address
        }

        createSolution()
    }, [])

    const updateActionList = async () => {
        if (!nodeKey.current) return
        const response = await apis.solution.getHumanActions.fetch(nodeKey.current, false)
        if (!response.success) {
            toast.error('Failed to update human action list')
            return
        }

        setActionList(response.data)
    }

    const handlePackageSolution = async () => {
        if (!nodeKey.current || !proxyAddress.current) {
            toast.error('No solution created yet')
            return
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const packageSolutionRes = await apis.solution.packageSolution.fetch(nodeKey.current, false)
        if (!packageSolutionRes.success) {
            toast.error('Failed to package solution')
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            return
        }

        const clonePackageRes = await apis.simulation.clonePackage.fetch({
            solution_node_key: nodeKey.current,
            solution_address: proxyAddress.current,
        }, false)
        if (!clonePackageRes.success) {
            toast.error('Failed to clone package')
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            return
        }

        const taskId = clonePackageRes.message
        const timer = setInterval(async () => {
            const cloneProgressRes = await apis.simulation.cloneProgress.fetch(taskId, false)
            const progressNum = Number(cloneProgressRes)
            if (progressNum === 100) {
                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                setSimulationReady(true)
                toast.success('Simulation ready')
                clearInterval(timer)
            }
        }, 1000)
    }

    const handleActionSubmit = async () => {
        await updateActionList();
        setCurrentActionType('');
        setEditingActionId(null);
    }

    const handleTypeSelected = (type: string) => {
        if (!nodeKey.current) return
        setCurrentActionType(type as 'add_fence' | 'transfer_water' | 'add_gate')
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
                            <h2 className="text-md font-semibold text-slate-900">Edit Solution [{pageContext.current?.solutionData?.name}]</h2>
                            <p className="text-sm text-slate-500">Solution Details</p>
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
                                            {pageContext.current?.solutionData?.name}
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
                                            {pageContext.current?.solutionData?.env.grid_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* DEM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">DEM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.dem_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* LUM */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">LUM</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.lum_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* Rainfall */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Rainfall</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.rainfall_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* Gate */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Gate</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.gate_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* Tide */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Tide</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.tide_node_key.split('.').pop()}
                                        </div>
                                    </div>
                                    {/* INP */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">INP</span>
                                        <div className="flex items-center gap-2 mr-1">
                                            {pageContext.current?.solutionData?.env.inp_node_key.split('.').pop()}
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
                                        <Button size="sm" className="bg-green-500 hover:bg-green-600 cursor-pointer" disabled={currentActionType !== ''}>
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

                            {/* Configured Actions List */}
                            <div className="space-y-3">
                                {actionList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                            <Plus className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-sm font-medium text-slate-700 mb-2">No Actions Configured</h3>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Click the "Add Action" button above to configure your first human action.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Info className="w-3 h-3" />
                                            <span>Actions will appear here once configured</span>
                                        </div>
                                    </div>
                                ) : (
                                    actionList.map((action) => {
                                        const isEditing = editingActionId === action.action_id;
                                        const commonEditProps = {
                                            editMode: isEditing,
                                            onEdit: () => {
                                                setEditingActionId(action.action_id);
                                                setCurrentActionType('');
                                            },
                                            onSubmit: handleActionSubmit
                                        };

                                        if (action.action_type === 'add_fence') {
                                            return <AddFenceForm key={action.action_id} nodeKey={nodeKey.current || ''} action={action} {...commonEditProps} />;
                                        }
                                        if (action.action_type === 'transfer_water') {
                                            return <TransferWaterForm key={action.action_id} nodeKey={nodeKey.current || ''} action={action} {...commonEditProps} />;
                                        }
                                        if (action.action_type === 'add_gate') {
                                            return <AddGateForm key={action.action_id} nodeKey={nodeKey.current || ''} action={action} {...commonEditProps} />;
                                        }
                                        return null;
                                    })
                                )}
                            </div>

                            {/* Add Action Panel */}
                            {currentActionType && (
                                <>
                                    {currentActionType === 'add_fence' && (
                                        <AddFenceForm
                                            nodeKey={nodeKey.current || ''}
                                            addMode={true}
                                            onSubmit={handleActionSubmit}
                                        />
                                    )}
                                    {currentActionType === 'transfer_water' && (
                                        <TransferWaterForm
                                            nodeKey={nodeKey.current || ''}
                                            addMode={true}
                                            onSubmit={handleActionSubmit}
                                        />
                                    )}
                                    {currentActionType === 'add_gate' && (
                                        <AddGateForm
                                            nodeKey={nodeKey.current || ''}
                                            addMode={true}
                                            onSubmit={handleActionSubmit}
                                        />
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>


                    <div>
                        <Button
                            className="w-full bg-gray-700 hover:bg-gray-500 text-white font-medium py-2 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            onClick={handlePackageSolution}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Actions Configured
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={null} style='w-full h-full' />
            </div>

            {simulationReady && (
                <button
                    className="fixed bottom-6 right-6 z-60 bg-white border border-slate-200 rounded-full shadow-lg p-3 hover:bg-slate-100 transition-colors cursor-pointer"
                    style={{ display: showSimulationCard ? 'none' : 'block' }}
                    onClick={() => setShowSimulationCard(true)}
                    title="Show Visualization Settings"
                >
                    <Play className="w-6 h-6 text-slate-600" />
                </button>
            )}
            {(simulationReady && showSimulationCard) && (
                <SimulationPanel
                    solutionNodeKey={nodeKey.current || ''}
                    proxyAddress={proxyAddress.current || ''}
                    onClose={() => setShowSimulationCard(false)}
                />
            )}
        </div >
    )
}
