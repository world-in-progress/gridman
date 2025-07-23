import { useEffect, useReducer, useRef, useState } from "react"
import store from "@/store"
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
import { SceneNode } from "@/components/resourceScene/scene"
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
	ChevronUp,
	Paintbrush,
	FolderOpen,
	ChevronDown,
	MousePointer,
} from "lucide-react"
import {
	Select,
	SelectItem,
	SelectValue,
	SelectContent,
	SelectTrigger,
} from "@/components/ui/select"

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

export default function VectorsPage({ node }: VectorsPageProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)

	const [isDrawing, setIsDrawing] = useState(false)
	const [resetDialogOpen, setResetDialogOpen] = useState(false)
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [featureData, setFeatureData] = useState<FeatureData | null>(null)
	const [selectedTool, setSelectedTool] = useState<string>("select")
	const [isCardExpanded, setIsCardExpanded] = useState(true)
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
		console.log(pc.featureData.color)
		if (pc.hasFeature) {
			setFeatureData(pc.featureData)

			const vectorColor = featureColorMap.find(item => item.value === pc.featureData.color)?.color
			setVectorColor(vectorColor!)

			// 延迟添加绘图，确保地图和 MapboxDraw 实例已准备就绪
			setTimeout(() => {
				if (pc.drawFeature && pc.drawFeature.features && pc.drawFeature.features.length > 0) {
					console.log("尝试添加特征", pc.drawFeature)
					const drawInstance = store.get<MapboxDraw>("mapDraw")
					if (drawInstance) {
						// 过滤掉无效的几何图形（比如只有两个点的多边形）
						const validFeatures = {
							type: "FeatureCollection" as const,
							features: pc.drawFeature.features.filter(feature => {
								// 对于多边形，至少需要4个坐标点（首尾相同形成闭环）
								if (feature.geometry.type === "Polygon") {
									return feature.geometry.coordinates[0].length >= 4;
								}
								return true;
							})
						};
						
						try {
							drawInstance.add(validFeatures);
							console.log("特征添加成功");
						} catch (error) {
							console.error("添加特征时出错:", error);
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
		// Get the draw instance from the store
		const drawInstance = store.get<MapboxDraw>("mapDraw")
		if (drawInstance) {
			pageContext.current!.drawFeature = drawInstance.getAll()
			// Delete all features from the drawing
			drawInstance.deleteAll()
		}
		// // Reset the page context reference
		// pageContext.current = null
	}

	useEffect(() => {
		const map = store.get<mapboxgl.Map>("map")
		const drawInstance = store.get<MapboxDraw>("mapDraw")
		if (!map || !drawInstance || !featureData) return

		// Set up draw.create event handler
		const handleDrawCreate = (e: any) => {
			if (selectedTool === "draw" && isDrawing) {

				// Re-enter drawing mode for continuous drawing
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

		// Setup modechange handler for more robust monitoring of mode changes
		const handleModeChange = (e: any) => {
			// If we exited a drawing mode and we're supposed to be drawing
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

	const handleCreateFeature = () => {
		if (!pageContext.current!.featureData.name.trim()
			// || !pageContext.current!.featureData.savePath.trim()
			|| !pageContext.current!.featureData.epsg
		) {
			return
		}

		const newFeature: FeatureData = {
			type: pageContext.current!.featureData.type,
			name: pageContext.current!.featureData.name,
			epsg: pageContext.current!.featureData.epsg,
			savePath: pageContext.current!.featureData.savePath,
			color: pageContext.current!.featureData.color,
		}

		const vectorColor = featureColorMap.find(item => item.value === newFeature.color)?.color

		setFeatureData(newFeature)
		setVectorColor(vectorColor!)
		pageContext.current!.hasFeature = true
		pageContext.current!.featureData = newFeature
		console.log(pageContext.current!.featureData.color)
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
			savePath: "",
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

	const toolbarItems = [
		{ id: "select", icon: MousePointer, title: "Select Features" },
		{ id: 'draw', icon: Paintbrush, title: "Draw Features" },
		{ id: "move", icon: Move, title: "Move Features" },
		{ id: "delete", icon: Trash2, title: "Delete Features" },
	]

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

	const getFeatureTypeLabel = (type: string) => {
		switch (type) {
			case "point":
				return "Point Feature"
			case "line":
				return "Line Feature"
			case "polygon":
				return "Polygon Feature"
			default:
				return type
		}
	}

	const handleSaveFeature = async () => {
		if (!pageContext.current?.hasFeature) return


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

						<div className="space-y-2">
							<Label htmlFor="savePath" className="text-sm font-medium">
								Local Save Path
								<span className="text-red-500">*</span>
							</Label>
							<Button
								variant="outline"
								onClick={() => document.getElementById("savePath")?.click()}
								className="w-full justify-start text-muted-foreground cursor-pointer"
							>
								{pageContext.current?.featureData.savePath || "Select folder for saving"}
								<FolderOpen className="w-4 h-4 ml-auto" />
							</Button>
							<Input
								id="savePath"
								type="file"
								value={pageContext.current?.featureData.savePath}
								onChange={(e) => {
									pageContext.current!.featureData.savePath = e.target.value
									triggerRepaint()
								}}
								className="hidden"
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
							onClick={handleFilePlusClick}
							title={pageContext.current?.hasFeature ? "Reset and create new feature" : "Create new feature"}
						>
							{pageContext.current?.hasFeature ? <RotateCcw className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 cursor-pointer"
							onClick={handleSaveFeature}
							disabled={!pageContext.current?.hasFeature}
							title="Save">
							<Save className="h-4 w-4" />
						</Button>
					</div>

					<Separator orientation="vertical" className="h-6" />

					{/* Edit operations */}
					<div className="flex items-center gap-1 px-2">
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" title="Undo">
							<Undo className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" title="Redo">
							<Redo className="h-4 w-4" />
						</Button>
					</div>

					<Separator orientation="vertical" className="h-6" />

					{/* Vector tools */}
					<div className="flex items-center gap-1 px-2">
						{toolbarItems.map((item) => {
							const IconComponent = item.icon
							return (
								<Button
									key={item.id}
									variant={selectedTool === item.id ? "default" : "ghost"}
									size="sm"
									className="h-8 w-8 p-0 cursor-pointer"
									onClick={() => setSelectedTool(item.id)}
									title={item.title}
								>
									<IconComponent />
								</Button>
							)
						})}
					</div>
				</div>

				<div className="w-full flex-1 relative">
					{/* Feature meta information column */}
					{pageContext.current?.hasFeature && (
						<Card className="absolute bg-white/75 backdrop-blur-2xl bottom-4 left-2 w-80 z-50 shadow-lg transition-all duration-200">
							<button
								className="absolute flex items-center justify-center right-2 top-2 h-8 w-8 p-0 z-10 cursor-pointer hover:border-2 hover:border-gray-300 rounded-md"
								onClick={() => setIsCardExpanded(!isCardExpanded)}
							>
								{isCardExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
							</button>
							<CardHeader className="cursor-pointer" onClick={() => setIsCardExpanded(!isCardExpanded)}>
								<CardTitle className="text-xl flex items-center gap-2 -my-2">
									{getFeatureTypeIcon(pageContext.current!.featureData.type)}
									Feature Information
								</CardTitle>
							</CardHeader>
							{isCardExpanded && (
								<CardContent className="space-y-4 -mt-2">
									<div>
										<Label className="text-muted-foreground">Type</Label>
										<div className="flex items-center gap-2 mt-1">
											{getFeatureTypeIcon(pageContext.current!.featureData.type)}
											<span className="font-medium">{getFeatureTypeLabel(pageContext.current!.featureData.type)}</span>
										</div>
									</div>

									<div>
										<Label className="text-muted-foreground">Color</Label>
										<div className="flex items-center gap-2 mt-1">
											<div className={`w-32 h-4 bg-${pageContext.current!.featureData.color}`}></div>
											<span className={`text-${pageContext.current!.featureData.color} font-bold`}>{pageContext.current!.featureData.color.split('-')[0]}</span>
										</div>
									</div>

									<div>
										<Label className="text-muted-foreground">Name</Label>
										<div className="mt-1 font-medium">{pageContext.current!.featureData.name}</div>
									</div>

									<div>
										<Label className="text-muted-foreground">EPSG</Label>
										<div className="mt-1 font-medium">{pageContext.current!.featureData.epsg}</div>
									</div>

									<div>
										<Label className="text-muted-foreground">Save Path</Label>
										<div className="mt-1 font-mono text-xs p-2 rounded">{pageContext.current!.featureData.savePath}</div>
									</div>

									<div className="pt-2 border-t">
										<Label className="text-muted-foreground">Current Tool</Label>
										<div className="mt-1 font-medium capitalize">
											{toolbarItems.find((item) => item.id === selectedTool)?.title || selectedTool}
										</div>
									</div>
								</CardContent>
							)}
						</Card>
					)}

					{/* Map container placeholder */}
					<MapContainer node={node} style='w-full h-full' color={vectorColor} />
				</div>
			</div>
		</>
	)
}
