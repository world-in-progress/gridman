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

const tutorialPages = [
    {
        id: 1,
        title: "Welcome to the Tutorial",
        image: "/placeholder.svg?height=300&width=400&text=Welcome+Tutorial",
        description:
            "欢迎来到我们的产品教程！在接下来的几页中，我们将为您详细介绍如何使用我们的产品功能。请跟随教程步骤，您将快速掌握所有核心功能。",
    },
    {
        id: 2,
        title: "Basic Setup",
        image: "/placeholder.svg?height=300&width=400&text=Basic+Setup",
        description:
            "首先，让我们从基础设置开始。在这一步中，您需要配置您的个人资料和偏好设置。这些设置将帮助系统为您提供更个性化的体验。",
    },
    {
        id: 3,
        title: "Main Features",
        image: "/placeholder.svg?height=300&width=400&text=Main+Features",
        description:
            "现在让我们探索主要功能。这个界面包含了您日常使用中最重要的工具和选项。您可以通过导航栏快速访问不同的功能模块。",
    },
    {
        id: 4,
        title: "Advanced Operations",
        image: "/placeholder.svg?height=300&width=400&text=Advanced+Operations",
        description: "掌握了基础功能后，让我们学习一些高级操作。这些功能可以帮助您更高效地完成复杂任务，提升您的工作效率。",
    },
    {
        id: 5,
        title: "Tutorial Complete",
        image: "/placeholder.svg?height=300&width=400&text=Tutorial+Complete",
        description:
            "恭喜您完成了教程！现在您已经掌握了所有基本和高级功能。如果您在使用过程中遇到任何问题，可以随时回到这个教程查看相关说明。",
    },
]



export default function DemoPage() {

    const [open, setOpen] = useState(false)
    const [canAddAction, setCanAddAction] = useState(true)
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [clearActionsDialogOpen, setClearActionsDialogOpen] = useState(false)

    const humanActions = useRef<HumanAction[]>([])

    const [currentDrawingAction, setCurrentDrawingAction] = useState<HumanAction | null>(null)

    const [currentPage, setCurrentPage] = useState(0)

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const currentTutorial = tutorialPages[currentPage]

    const nextPage = () => {
        if (currentPage < tutorialPages.length - 1) {
            setCurrentPage(currentPage + 1)
        }
    }

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handlePackageSolution = async () => {
        const response = await apis.solution.packageSolution.fetch('root.solution.demo', false)
        if (response.success) {
            toast.success('Solution packaged successfully')
        } else {
            toast.error('Failed to package solution')
        }
    }

    const handleClearActions = () => {
        setClearActionsDialogOpen(false)

        humanActions.current = []

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        // TODO: Clear all actions by api

        store.get<{ on: Function, off: Function }>('isLoading')!.off()

        triggerRepaint()
    }

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF'
        let color = '#'
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)]
        }
        return color
    }

    const registerHumanAction = async (action: HumanAction) => {
        if (!action.action_type || !action.elevation_delta || !action.landuse_type || !action.geometry) {
            toast.error('Please fill in all required fields')
            action.registered = false
            triggerRepaint()
            return
        }

        const humanAction = {
            node_key: 'root.solutions.demo',
            action_type: action.action_type,
            params: {
                elevation_delta: Number(action.elevation_delta),
                landuse_type: Number(action.landuse_type),
                feature: action.geometry
            }
        }
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        const registerResponse = await apis.solution.addHumanAction.fetch(humanAction, false)
        store.get<{ on: Function, off: Function }>('isLoading')!.off()

        if (registerResponse.success) {
            setCanAddAction(true)
            toast.success('Human action registered successfully')
        } else {
            action.registered = false
            toast.error('Failed to register human action')
        }

        triggerRepaint()
    }

    const startDrawingAction = (action: HumanAction) => {
        const drawInstance = store.get<MapboxDraw>("mapDraw")
        if (drawInstance) {
            setCurrentDrawingAction(action)
            setIsDrawingMode(true)

            const randomColor = getRandomColor()

            // TODO: Set color to draw vector

            drawInstance.changeMode("draw_polygon")
        }
    }

    useEffect(() => {
        const map = store.get<mapboxgl.Map>("map")
        const drawInstance = store.get<MapboxDraw>("mapDraw")

        if (!map || !drawInstance || !isDrawingMode || !currentDrawingAction) return

        const handleDrawCreate = (e: any) => {
            if (e.features && e.features.length > 0 && currentDrawingAction) {

                currentDrawingAction.geometry = e.features[0]
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
    }, [isDrawingMode, currentDrawingAction])

    const stopDrawingAction = () => {
        setIsDrawingMode(false)
        setCurrentDrawingAction(null)

        const drawInstance = store.get<MapboxDraw>("mapDraw")
        if (drawInstance) {
            drawInstance.changeMode("simple_select")
        }
    }

    const handleAddHumanAction = () => {
        if (!canAddAction) return

        // TODO: humanActions params of elevation_delta and landuse_type may need to be changed by action type, like transfer water

        humanActions.current.push({
            id: Date.now().toString(),
            action_type: '',
            elevation_delta: '',
            landuse_type: '',
            node_key: 'root.solutions.demo',
            geometry: null,
            registered: false
        })

        setCanAddAction(false)
        triggerRepaint()
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
                        <div className='flex items-center gap-2'>
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant='destructive'
                                        className='cursor-pointer bg-teal-500 hover:bg-teal-600 text-white shadow-sm'
                                    >
                                        <BookOpen className="w-4 h-4" />Instruction
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] p-0">
                                    <DialogHeader className="p-6 pb-0">
                                        <div className="flex items-center justify-between">
                                            <DialogTitle className="text-xl font-semibold">{currentTutorial.title}</DialogTitle>
                                        </div>
                                    </DialogHeader>

                                    <div className="px-6">
                                        {/* Page Indicator */}
                                        <div className="flex justify-center mb-4">
                                            <div className="flex space-x-2">
                                                {tutorialPages.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentPage ? "bg-primary" : "bg-muted"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tutorial Content */}
                                        <div className="space-y-4">
                                            <div className="flex justify-center">
                                                <img
                                                    src={currentTutorial.image || "/placeholder.svg"}
                                                    alt={currentTutorial.title}
                                                    width={400}
                                                    height={300}
                                                    className="rounded-lg border"
                                                />
                                            </div>

                                            <div className="text-center space-y-2">
                                                <p className="text-muted-foreground leading-relaxed">{currentTutorial.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between p-6 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={prevPage}
                                            disabled={currentPage === 0}
                                            className="flex items-center gap-2 bg-transparent"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>

                                        <span className="text-sm text-muted-foreground">
                                            {currentPage + 1} / {tutorialPages.length}
                                        </span>

                                        <Button
                                            variant="outline"
                                            onClick={nextPage}
                                            disabled={currentPage === tutorialPages.length - 1}
                                            className="flex items-center gap-2 bg-transparent"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

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
                                    <span className="text-sm font-medium text-slate-500 tracking-wide">Permitted Action Types</span>
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
                                <div className='flex items-center gap-2'>
                                    {/* Alert Dialog for Clear Actions */}
                                    <AlertDialog >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant='destructive'
                                                className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                                size='sm'
                                            >
                                                <RotateCcw className="w-4 h-4" />Clear
                                            </Button>
                                        </AlertDialogTrigger>
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

                                </div>
                            </div>

                            {/* Human Actions Container */}
                            <div className="space-y-4">
                                {humanActions.current.length === 0 ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed cursor-pointer"
                                        onClick={handleAddHumanAction}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Human Action
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        {humanActions.current.map((action, index) => (
                                            <div key={action.id} className="border rounded-lg p-4 bg-slate-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-medium">Human Action {index + 1}</h4>
                                                    <div className='flex items-center gap-2'>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-slate-700 hover:text-green-600 hover:bg-green-50 cursor-pointer"
                                                            onClick={() => {
                                                                action.registered = true
                                                                registerHumanAction(action)
                                                            }}
                                                            disabled={action.registered}
                                                            title={action.registered ? "Registered  " : "Register Action"}
                                                        >
                                                            {action.registered ? (
                                                                <CircleCheckBig className="text-green-500" />
                                                            ) : (
                                                                <div className="relative group">
                                                                    <CircleDashed className={`group-hover:opacity-0 transition-opacity ${(!action.action_type || !action.elevation_delta || !action.landuse_type || !action.geometry) ? "text-gray-400" : ""}`} />
                                                                    <CircleCheck
                                                                        className="text-green-500 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    />
                                                                </div>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-slate-700 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                            onClick={() => {
                                                                humanActions.current.splice(index, 1)
                                                                triggerRepaint()
                                                            }}
                                                        >
                                                            <X />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Action Type Selector */}
                                                <div className="mb-4 flex items-center justify-between gap-2">
                                                    <Label htmlFor={`action-type-${action.id}`} className="text-sm mb-1 block">
                                                        Action Type
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            action.action_type = value
                                                            triggerRepaint()
                                                        }}
                                                        value={action.action_type}
                                                    >
                                                        <SelectTrigger id={`action-type-${action.id}`} className="min-w-[160px] w-[160px]">
                                                            <SelectValue placeholder="Select Action Type" />
                                                        </SelectTrigger>
                                                        <SelectContent className='cursor-pointer min-w-[160px] w-[160px]'>
                                                            <SelectItem value="add_fence">Add GeiWai</SelectItem>
                                                            <SelectItem value="add_gate">Add Gate</SelectItem>
                                                            <SelectItem value="transfer_water">Transfer water</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[120px] flex items-center justify-center">
                                                    <div className="text-center">
                                                        {!isDrawingMode ? (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className={`cursor-pointer ${action.action_type ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-gray-400 text-white'}`}
                                                                onClick={() => startDrawingAction(action)}
                                                                disabled={!action.action_type}
                                                                title={!action.action_type ? "Please select action type first" : "Start Drawing"}
                                                            >
                                                                <Paintbrush className="w-3 h-3 mr-1" />
                                                                Start Drawing
                                                            </Button>
                                                        ) : currentDrawingAction?.id === action.id ? (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className='cursor-pointer bg-red-500 hover:bg-red-600 text-white'
                                                                onClick={stopDrawingAction}
                                                            >
                                                                <X className="w-3 h-3 mr-1" />
                                                                Stop Drawing
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className='cursor-pointer bg-gray-400 text-white'
                                                                disabled={true}
                                                            >
                                                                <Paintbrush className="w-3 h-3 mr-1" />
                                                                Drawing in progress...
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

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
                                                                action.elevation_delta = e.target.value
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
                                                                action.landuse_type = e.target.value
                                                                triggerRepaint()
                                                            }}
                                                            className="h-8 text-sm"
                                                            placeholder="Enter Number"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className={`w-full border-dashed ${canAddAction ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                            onClick={handleAddHumanAction}
                                            disabled={!canAddAction}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Human Action
                                        </Button>
                                    </div>
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
                <MapContainer node={null} style='w-full h-full' />
            </div>
        </div >
    )
}
