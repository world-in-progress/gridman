import React, { useEffect, useReducer, useRef, useState } from "react"
import store from "@/store"
import * as apis from '@/core/apis/apis'
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import {
	Dialog,
	DialogTitle,
	DialogHeader,
	DialogFooter,
	DialogContent,
	DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { VectorsPageContext } from "./vectors"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FeatureData, VectorsPageProps } from "./types"
import { SceneNode, SceneTree } from "@/components/resourceScene/scene"
import MapContainer from "@/components/mapContainer/mapContainer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dot,
	Move,
	Save,
	Redo,
	Undo,
	Minus,
	Square,
	Trash2,
	FilePlus2,
	RotateCcw,
	Paintbrush,
	FolderOpen,
	MousePointer,
	Globe,
	Palette,
	Mouse,
} from "lucide-react"
import {
	Select,
	SelectItem,
	SelectValue,
	SelectContent,
	SelectTrigger,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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

export default function VectorsPage({ node }: VectorsPageProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)

	const [isDrawing, setIsDrawing] = useState(false)
	const [resetDialogOpen, setResetDialogOpen] = useState(false)
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [featureData, setFeatureData] = useState<FeatureData | null>(null)
	const [selectedTool, setSelectedTool] = useState<ToolType>("select");
	const [vectorColor, setVectorColor] = useState<string | null>(null)

	const pageContext = useRef<VectorsPageContext | null>(null)

	useEffect(() => {
		loadContext(node as SceneNode)
		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {
		pageContext.current = await node.getPageContext() as VectorsPageContext
		const pc = pageContext.current
		if (pc.hasFeature) {
			setFeatureData(pc.featureData)

			const vectorColor = featureColorMap.find(item => item.value === pc.featureData.color)?.color
			setVectorColor(vectorColor!)

			setTimeout(() => {
				if (pc.drawFeature && pc.drawFeature.features && pc.drawFeature.features.length > 0) {
					const drawInstance = store.get<MapboxDraw>("mapDraw")
					if (drawInstance) {
						const validFeatures = {
							type: "FeatureCollection" as const,
							features: pc.drawFeature.features.filter(feature => {
								if (feature.geometry.type === "Polygon") {
									return feature.geometry.coordinates[0].length >= 4;
								}
								return true;
							})
						};

						try {
							drawInstance.add(validFeatures)
						} catch (error) {
							console.error("Failed to add feature:", error);
						}
					}
				}
			}, 500);

			setSelectedTool("select")
		} else {
			setCreateDialogOpen(true)
			setSelectedTool("select")
		}
		triggerRepaint()
	}

	const unloadContext = () => {
		const drawInstance = store.get<MapboxDraw>("mapDraw")

		if (pageContext.current!.hasFeature) {
			if (drawInstance) {
				handleSaveFeature()
			}
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

				// Re-enter drawing mode
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

		// Add event listeners
		map.on("draw.create", handleDrawCreate)
		map.on("draw.modechange", handleModeChange)

		return () => {
			// Clean up event listeners
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
			// Get selected features and delete them
			const selectedFeatures = drawInstance.getSelectedIds()
			if (selectedFeatures.length > 0) {
				drawInstance.delete(selectedFeatures)
				// Reset to select mode after deletion
				setSelectedTool("select")
			} else {
				// If no features are selected, switch back to select mode
				drawInstance.changeMode("simple_select")
				setSelectedTool("select")
			}
		} else {
			setIsDrawing(false)
			drawInstance.changeMode("simple_select")
		}
	}, [selectedTool, featureData])

	const handleCreateFeature = async () => {
		if (!pageContext.current!.featureData.name.trim()
			// || !pageContext.current!.featureData.savePath.trim()
			|| !pageContext.current!.featureData.epsg
		) {
			return
		}

		const newFeature: FeatureData = {
			name: pageContext.current!.featureData.name,
			type: pageContext.current!.featureData.type,
			color: pageContext.current!.featureData.color,
			epsg: pageContext.current!.featureData.epsg,
		}

		const vectorColor = featureColorMap.find(item => item.value === newFeature.color)?.color

		setFeatureData(newFeature)
		setVectorColor(vectorColor!)
		pageContext.current!.hasFeature = true
		pageContext.current!.featureData = newFeature
		const createFeatureRes = await apis.feature.createFeature.fetch(newFeature, node.tree.isPublic)
		if (!createFeatureRes.success) {
			toast.error(`Failed to create vector ${newFeature.name}`)
			return
		} else {
			const tree = node.tree as SceneTree
			await tree.alignNodeInfo(node, true)
			tree.notifyDomUpdate()
			toast.success(`Vector ${newFeature.name} created successfully`)
		}
		setCreateDialogOpen(false)
		triggerRepaint()
	}

	const handleReset = () => {
		const pc = pageContext.current!
		const drawInstance = store.get<MapboxDraw>("mapDraw")
		if (drawInstance) {
			drawInstance.deleteAll()
		}
		pc.hasFeature = false
		pc.featureData = {
			type: "point",
			name: "",
			epsg: "",
			color: "sky-500"
		}
		setResetDialogOpen(false)
		setCreateDialogOpen(true)
		setSelectedTool("select")
		triggerRepaint()
	}

	const handleFilePlusClick = () => {
		if (pageContext.current?.hasFeature) {
			setResetDialogOpen(true)
		} else {
			setCreateDialogOpen(true)
		}
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
		if (!pageContext.current?.hasFeature) return
		const drawInstance = store.get<MapboxDraw>("mapDraw")!
		if (!drawInstance) return
		setIsDrawing(false)
		drawInstance.changeMode("simple_select")
		store.get<{ on: Function, off: Function }>('isLoading')?.on()
		pageContext.current!.drawFeature = drawInstance.getAll()

		const nodeKey = node.key + '.' + pageContext.current!.featureData.name

		const saveFeatureBody = {
			node_key: nodeKey,
			feature_json: pageContext.current!.drawFeature,
		}
		const saveFeatureRes = await apis.feature.saveFeature.fetch(saveFeatureBody, node.tree.isPublic)

		if (!saveFeatureRes.success) {
			store.get<{ on: Function, off: Function }>('isLoading')?.off()
			toast.error(saveFeatureRes.message)
		} else {
			store.get<{ on: Function, off: Function }>('isLoading')?.off()
			toast.success(saveFeatureRes.message)
		}
	}

	return (
		<>
			{/* Create New Feature Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogTitle>Create New Feature</DialogTitle>
					<DialogDescription>Fill in feature information to create a new vector feature</DialogDescription>

					<div className="space-y-6 py-4 -mt-4">
						<div className="space-y-3">
							<Label className="text-sm font-medium">
								Feature Type
								<span className="text-red-500">*</span>
							</Label>
							<RadioGroup value={pageContext.current?.featureData.type} onValueChange={(value: any) => {
								pageContext.current!.featureData.type = value
								triggerRepaint()
							}}>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="point" id="point" className="cursor-pointer" />
									<Label htmlFor="point" className="flex items-center gap-2 cursor-pointer">
										<Dot className="w-6 h-6 text-blue-500" />
										Point Feature
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="line" id="line" className="cursor-pointer" />
									<Label htmlFor="line" className="flex items-center gap-2 cursor-pointer">
										<Minus className="w-6 h-6 text-green-500" />
										Line Feature
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="polygon" id="polygon" className="cursor-pointer" />
									<Label htmlFor="polygon" className="flex items-center gap-2 cursor-pointer">
										<Square className="w-6 h-6 text-purple-500" />
										Polygon Feature
									</Label>
								</div>
							</RadioGroup>
						</div>

						<div className="space-y-2">
							<Label htmlFor="featureColor" className="text-sm font-medium">
								Feature Color
							</Label>
							<Select
								value={pageContext.current?.featureData.color}
								onValueChange={(value: any) => {
									pageContext.current!.featureData.color = value
									triggerRepaint()
								}}
							>
								<SelectTrigger className="w-full cursor-pointer">
									<SelectValue placeholder="Select color" />
								</SelectTrigger>
								<SelectContent>
									{featureColorMap.map((item) => (
										<SelectItem key={item.value} value={item.value} className="cursor-pointer">
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
												<span>{item.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="featureName" className="text-sm font-medium">
								Feature Name
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="featureName"
								value={pageContext.current?.featureData.name}
								onChange={(e) => {
									pageContext.current!.featureData.name = e.target.value
									triggerRepaint()
								}}
								placeholder="Enter feature name"
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="featureName" className="text-sm font-medium">
								EPSG Code
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="featureEpsg"
								value={pageContext.current?.featureData.epsg}
								onChange={(e) => {
									pageContext.current!.featureData.epsg = e.target.value
									triggerRepaint()
								}}
								placeholder="Enter EPSG code"
								className="w-full"
							/>
						</div>
					</div>

					<DialogFooter className="flex gap-2">
						<Button variant="outline" className="cursor-pointer" onClick={() => setCreateDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							className="cursor-pointer"
							onClick={handleCreateFeature}
							disabled={!pageContext.current?.featureData.name.trim() || !pageContext.current?.featureData.epsg}
						>
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
						<DialogDescription>Are you sure you want to reset the current feature and create a new one? This will clear all current data.</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-2">
						<Button variant="outline" className="cursor-pointer" onClick={() => setResetDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" className="cursor-pointer" onClick={handleReset}>
							Confirm Reset
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
								handleFilePlusClick();
							}}
							title={pageContext.current?.hasFeature ? "Reset and create new feature" : "Create new feature"}
						>
							{pageContext.current?.hasFeature ? <RotateCcw className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 cursor-pointer"
							onClick={(e) => {
								e.stopPropagation()
								setSelectedTool("select")
								handleSaveFeature();
							}}
							disabled={!pageContext.current?.hasFeature}
							title="Save">
							<Save className="h-4 w-4" />
						</Button>
					</div>

					<Separator orientation="vertical" className="h-6" />

					{/* Edit operations */}
					<div className="flex items-center gap-1 px-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 cursor-pointer"
							onClick={(e) => e.stopPropagation()}
							title="Undo"
							disabled={!pageContext.current?.hasFeature}
						>
							<Undo className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 cursor-pointer"
							onClick={(e) => e.stopPropagation()}
							title="Redo"
							disabled={!pageContext.current?.hasFeature}
						>
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
								disabled={!pageContext.current?.hasFeature}
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
					{pageContext.current?.hasFeature && (
						<div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">
							{/* Header */}
							<div className="p-6 bg-white border-b border-slate-200">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-100 rounded-lg">
										{getFeatureTypeIcon(pageContext.current.featureData.type)}
									</div>
									<div>
										<h2 className="text-lg font-semibold text-slate-900">Feature Information</h2>
										<p className="text-sm text-slate-500">Editing <span className="font-bold">[{pageContext.current.featureData.type}]</span> details</p>
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
														<span className="font-semibold text-slate-900">{pageContext.current.featureData.name}</span>
													</div>
												</div>
												{/* type */}
												<div className="flex items-center justify-between">
													<span className="text-sm text-slate-600">Type</span>
													<div className="flex items-center gap-2">
														{getFeatureTypeIcon(pageContext.current.featureData.type)}
														<Badge variant="secondary" className={`text-xs font-semibold`}>
															{pageContext.current.featureData.type}
														</Badge>
													</div>
												</div>
												{/* Color */}
												<div className="flex items-center justify-between">
													<span className="text-sm text-slate-600">Color</span>
													<div className="flex items-center gap-2">
														<div className="w-24 h-6 rounded-full border-2 border-white shadow-sm"
															style={{
																backgroundColor: featureColorMap.find(item =>
																	item.value === pageContext.current!.featureData.color)?.color
															}}>
														</div>
														<Badge variant="secondary" className={`text-xs text-${pageContext.current!.featureData.color}`}>
															{pageContext.current!.featureData.color.split('-')[0]}
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
														<code className="text-xs font-mono text-slate-700">EPSG: {pageContext.current.featureData.epsg}</code>
													</div>
												</div>

												{/* Save Path */}
												{/* <div>
													<span className="text-sm text-slate-600">Save Location</span>
													<div className="bg-slate-100 rounded-lg p-2 mt-1">
														<div className="flex items-center gap-2">
															<FolderOpen className="w-3 h-3 text-slate-500" />
															<code className="text-xs font-mono text-slate-700 truncate">
																{pageContext.current.featureData.savePath}
															</code>
														</div>
													</div>
												</div> */}
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
					)}
					{/* Map container placeholder */}
					<MapContainer node={node} style='w-full h-full' color={vectorColor} />
				</div>

			</div>
		</>
	)
}
