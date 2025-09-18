import React, { useEffect, useReducer, useRef, useState } from "react"
import {
    Dot,
    Move,
    Save,
    Redo,
    Undo,
    Globe,
    Mouse,
    Minus,
    Square,
    Trash2,
    Delete,
    Palette,
    RotateCcw,
    Paintbrush,
    MousePointer,
} from "lucide-react"
import store from "@/store"
import { toast } from "sonner"
import {
    Dialog,
    DialogTitle,
    DialogHeader,
    DialogFooter,
    DialogContent,
    DialogDescription,
} from "@/components/ui/dialog"
import * as apis from '@/core/apis/apis'
import { VectorPageProps } from './types'
import { VectorPageContext } from "./vector"
import { Badge } from "@/components/ui/badge"
import { FeatureData } from '../vectors/types'
import { Label } from "@/components/ui/label"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import MapContainer from "@/components/mapContainer/mapContainer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


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

const toolsConfig = {
    select: {
        id: "select",
        icon: MousePointer,
        title: "Selection Tool",
        description: "Click to select features",
        bgColor: "bg-orange-100",
        iconColor: "text-orange-600"
    },
    draw: {
        id: "draw",
        icon: Paintbrush,
        title: "Drawing Tool",
        description: "Draw {type} features",
        bgColor: "bg-green-100",
        iconColor: "text-green-600"
    },
    move: {
        id: "move",
        icon: Move,
        title: "Move Tool",
        description: "Move selected features",
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600"
    },
    delete: {
        id: "delete",
        icon: Trash2,
        title: "Delete Tool",
        description: "Delete selected features",
        bgColor: "bg-red-100",
        iconColor: "text-red-600"
    }
};

type ToolType = "select" | "draw" | "move" | "delete";

export default function VectorPage({ node }: VectorPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [isDrawing, setIsDrawing] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [ruinDialogOpen, setRuinDialogOpen] = useState(false)
    const [selectedTool, setSelectedTool] = useState<ToolType>("select");
    // const [vectorColor, setVectorColor] = useState<string | null>(null)
    const [featureData, setFeatureData] = useState<FeatureData | null>(null)

    const pageContext = useRef<VectorPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    useEffect(() => {
        if (pageContext.current?.vectorColor && pageContext.current?.drawFeature) {
            const map = store.get<mapboxgl.Map>("map")
            const drawInstance = store.get<MapboxDraw>("mapDraw")

            if (!map || !drawInstance) return

            const loadFeatures = () => {
                drawInstance.deleteAll()

                drawInstance.add(pageContext.current!.drawFeature!)
                store.get<{ on: Function, off: Function }>('isLoading')?.off()
            }

            if (map.loaded()) {
                setTimeout(loadFeatures, 100)
            } else {
                map.once('load', () => setTimeout(loadFeatures, 10))
            }
        }
    }, [pageContext.current?.vectorColor])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as VectorPageContext
        const pc = pageContext.current

        if (pc.featureData && pc.drawFeature) {
            const vectorColor = featureColorMap.find(item => item.value === pc.featureData.color)?.color
            // setVectorColor(vectorColor!)
            pageContext.current!.vectorColor = vectorColor!
            setFeatureData(pc.featureData! as FeatureData)
        }

        triggerRepaint()
    }

    const unloadContext = () => {
        if (!pageContext.current?.isRuined) {
            handleSaveFeature()
        }
    }

    useEffect(() => {
        const map = store.get<mapboxgl.Map>("map")
        const drawInstance = store.get<MapboxDraw>("mapDraw")
        if (!map || !drawInstance || !featureData) return

        const handleDrawCreate = (e: any) => {
            if (selectedTool === "draw" && isDrawing) {

                setTimeout(() => {
                    switch (featureData.type) {
                        case "point":
                            drawInstance.changeMode("draw_point")
                            break
                        case "line":
                            drawInstance.changeMode("draw_line_string")
                            break
                        case "polygon":
                            drawInstance.changeMode("draw_polygon")
                            break
                    }
                }, 10)
            }
        }

        const handleModeChange = (e: any) => {
            if (selectedTool === "draw" && isDrawing &&
                e.mode === "simple_select" &&
                (e.oldMode && !e.oldMode.startsWith("direct_select"))) {
                setTimeout(() => {
                    switch (featureData.type) {
                        case "point":
                            drawInstance.changeMode("draw_point")
                            break
                        case "line":
                            drawInstance.changeMode("draw_line_string")
                            break
                        case "polygon":
                            drawInstance.changeMode("draw_polygon")
                            break
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
    }, [selectedTool, featureData, isDrawing])

    useEffect(() => {
        const drawInstance = store.get<MapboxDraw>("mapDraw")
        if (!drawInstance || !featureData) return

        if (selectedTool === "draw") {
            setIsDrawing(true)
            switch (featureData.type) {
                case "point":
                    drawInstance.changeMode("draw_point")
                    break
                case "line":
                    drawInstance.changeMode("draw_line_string")
                    break
                case "polygon":
                    drawInstance.changeMode("draw_polygon")
                    break
                default:
                    break
            }
        } else if (selectedTool === "delete") {
            setIsDrawing(false)
            const selectedFeatures = drawInstance.getSelectedIds()
            if (selectedFeatures.length > 0) {
                drawInstance.delete(selectedFeatures)
                setSelectedTool("select")
            } else {
                drawInstance.changeMode("simple_select")
                setSelectedTool("select")
            }
        } else {
            setIsDrawing(false)
            drawInstance.changeMode("simple_select")
        }
    }, [selectedTool, featureData])

    const handleReset = () => {
        const pc = pageContext.current!
        const drawInstance = store.get<MapboxDraw>("mapDraw")
        if (drawInstance) {
            drawInstance.deleteAll()
        }
        handleSaveFeature()
        setResetDialogOpen(false)
        setSelectedTool("select")
        triggerRepaint()
    }

    const handleRuin = async () => {
        const deleteResponse = await apis.feature.deleteFeature.fetch(node.key, node.tree.isPublic)
        if (deleteResponse.success) {
            pageContext.current!.isRuined = true
            const tree = node.tree as SceneTree
            await tree.removeNode(node)
            toast.success(deleteResponse.message)
        } else {
            toast.error(deleteResponse.message)
        }
    }

    const handleResetClick = () => {
        setResetDialogOpen(true)
    }
    const handleRuinClick = () => {
        setRuinDialogOpen(true)
    }

    const getFeatureTypeIcon = (type: string) => {
        switch (type) {
            case "point":
                return <Dot className="w-6 h-6 text-blue-500" />
            case "line":
                return <Minus className="w-6 h-6 text-green-500" />
            case "polygon":
                return <Square className="w-6 h-6 text-purple-500" />
            default:
                return null
        }
    }

    const handleSaveFeature = async () => {
        const drawInstance = store.get<MapboxDraw>("mapDraw")!
        if (!drawInstance) return
        setIsDrawing(false)
        drawInstance.changeMode("simple_select")
        store.get<{ on: Function, off: Function }>('isLoading')?.on()
        pageContext.current!.drawFeature = drawInstance.getAll()

        const updateFeatureBody = {
            node_key: node.key,
            data: {
                name: pageContext.current!.featureData.name,
                type: pageContext.current!.featureData.type,
                color: pageContext.current!.featureData.color,
                epsg: pageContext.current!.featureData.epsg,
                feature_json: pageContext.current!.drawFeature,
            }
        }
        const saveFeatureRes = await apis.feature.updateFeature.fetch(updateFeatureBody, node.tree.isPublic)
        store.get<{ on: Function, off: Function }>('isLoading')?.off()
        if (resetDialogOpen) {
            toast.info("All features have been cleared")
        } else {
            if (!saveFeatureRes.success) {
                toast.error(saveFeatureRes.message)
            } else {
                toast.success(saveFeatureRes.message)
            }
        }
    }

    const handleChangeVectorColor = (colorItem: any) => {
        // setVectorColor(colorItem.color)
        pageContext.current!.vectorColor = colorItem.color
        if (pageContext.current?.featureData) {
            console.log('修改了颜色')
            pageContext.current.featureData.color = colorItem.value
        }

        triggerRepaint()

        handleSaveFeature()
    }

    return (
        <>
            {/* Ruin Confirmation Dialog */}
            <Dialog open={ruinDialogOpen} onOpenChange={setRuinDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ruin Confirmation</DialogTitle>
                        <DialogDescription>Are you sure you want to ruin this vector node?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" className="cursor-pointer" onClick={() => setResetDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleRuin}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Reset Confirmation Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Confirmation</DialogTitle>
                        <DialogDescription>Are you sure you want to clear all drawed feature and redraw?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" className="cursor-pointer" onClick={() => setResetDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleReset}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="w-full h-full flex flex-col bg-gray-50">
                {/* Function tools bar */}
                <div className="w-full h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-1">
                    {/* File operations */}
                    <div className="flex items-center gap-1 pr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRuinClick();
                            }}
                            title={"Clear all features"}
                        >
                            <Delete className="h-4 w-4 rotate-180 text-red-500 font-bold" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetClick();
                            }}
                            title={"Clear all features"}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTool("select")
                                handleSaveFeature()
                            }}
                            title="Save">
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Edit operations */}
                    <div className="flex items-center gap-1 px-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={(e) => e.stopPropagation()} title="Undo">
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={(e) => e.stopPropagation()} title="Redo">
                            <Redo className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Vector tools */}
                    <div className="flex items-center gap-1 px-2">
                        {Object.values(toolsConfig).map((tool) => (
                            <Button
                                key={tool.id}
                                variant={selectedTool === tool.id ? "default" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTool(tool.id as ToolType);
                                }}
                                title={tool.title}
                            >
                                {React.createElement(tool.icon)}
                            </Button>
                        ))}
                    </div>
                </div>


                <div className="w-full flex-1 relative">
                    <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    {getFeatureTypeIcon(pageContext.current?.featureData.type)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Feature Information</h2>
                                    <p className="text-sm text-slate-500">Editing <span className="font-bold">[{pageContext.current?.featureData.type}]</span> details</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                            {/* Feature Type Card */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="space-y-6">
                                    {/* Visual Properties Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Palette className="w-4 h-4 text-slate-500" />
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Visual Properties</span>
                                        </div>
                                        <div className="ml-6 space-y-3">
                                            {/* Name */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Name</span>
                                                <div className="flex items-center gap-2 mr-1">
                                                    <span className="font-semibold text-slate-900">{pageContext.current?.featureData.name}</span>
                                                </div>
                                            </div>
                                            {/* type */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Type</span>
                                                <div className="flex items-center gap-2">
                                                    {getFeatureTypeIcon(pageContext.current?.featureData.type)}
                                                    <Badge variant="secondary" className={`text-xs font-semibold`}>
                                                        {pageContext.current?.featureData.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {/* Color */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Color</span>
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className="cursor-pointer">
                                                            <div className="w-24 h-6 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-shadow"
                                                                style={{
                                                                    backgroundColor: featureColorMap.find(item =>
                                                                        item.value === pageContext.current?.featureData.color)?.color
                                                                }}>
                                                            </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-white border border-slate-200 shadow-lg rounded-lg p-2 min-w-[160px]">
                                                            <DropdownMenuLabel className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 py-1">
                                                                Select Color
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="my-1 border-slate-100" />
                                                            {featureColorMap.map((colorItem) => (
                                                                <DropdownMenuItem
                                                                    key={colorItem.value}
                                                                    className="cursor-pointer hover:bg-slate-50 rounded-md p-2 flex items-center gap-3"
                                                                    onClick={() => handleChangeVectorColor(colorItem)}
                                                                >
                                                                    <div
                                                                        className="w-20 h-4 rounded-full border border-slate-300 shadow-sm"
                                                                        style={{ backgroundColor: colorItem.color }}
                                                                    />
                                                                    <span className="text-sm text-slate-700 font-medium">
                                                                        {colorItem.name}
                                                                    </span>
                                                                    {pageContext.current?.featureData.color === colorItem.value && (
                                                                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                                                                    )}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <Badge variant="secondary" className={`text-xs text-${pageContext.current?.featureData.color}`}>
                                                        {pageContext.current?.featureData.color.split('-')[0]}
                                                    </Badge>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-slate-100"></div>

                                    {/* Technical Details Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Globe className="w-4 h-4 text-slate-500" />
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Technical Details</span>
                                        </div>
                                        <div className="ml-6 space-y-4">
                                            {/* EPSG */}
                                            <div>
                                                <span className="text-sm text-slate-600">Coordinate System</span>
                                                <div className="bg-slate-100 rounded-lg p-2 mt-1">
                                                    <code className="text-xs font-mono text-slate-700">EPSG: {pageContext.current?.featureData.epsg}</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Tool */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Mouse className="w-4 h-4 text-slate-600" />
                                        <Label className="text-sm font-medium text-slate-700">Active Tool</Label>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 -mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${toolsConfig[selectedTool]?.bgColor || "bg-slate-100"} rounded-lg`}>
                                            {React.createElement(toolsConfig[selectedTool]?.icon || MousePointer, {
                                                className: `w-4 h-4 ${toolsConfig[selectedTool]?.iconColor || "text-slate-600"}`
                                            })}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900">
                                                {toolsConfig[selectedTool]?.title || "Unknown Tool"}
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                {selectedTool === "draw"
                                                    ? toolsConfig[selectedTool]?.description.replace('{type}', pageContext.current?.featureData.type || "")
                                                    : toolsConfig[selectedTool]?.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    {/* Map container placeholder */}
                    <MapContainer node={node} style='w-full h-full' color={pageContext.current?.vectorColor} />
                </div>

            </div>
        </>
    )
}
