import { useEffect, useState } from "react"
import store from "@/store"
import mapboxgl from "mapbox-gl"
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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FeatureData, VectorsPageProps } from "./types"
import MapContainer from "@/components/mapContainer/mapContainer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	FilePlus2,
	RotateCcw,
	MousePointer,
	Minus,
	Square,
	Edit3,
	Move,
	Trash2,
	Save,
	Undo,
	Redo,
	Dot,
	Paintbrush,
	FolderOpen
} from "lucide-react"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

// 点图层样式
const pointLayer = {
	id: 'points',
	type: 'circle',
	source: 'points',
	paint: {
		'circle-radius': 6,
		'circle-color': '#007cbf',
		'circle-stroke-width': 1,
		'circle-stroke-color': '#fff',
	},
}

const featureColorMap = [
	{ value: "sky-500", color: "#0ea5e9", name: "Sky" },
	{ value: "green-500", color: "#22c55e", name: "Green" },
	{ value: "red-500", color: "#ef4444", name: "Red" },
	{ value: "purple-500", color: "#a855f7", name: "Purple" },
	{ value: "yellow-500", color: "#eab308", name: "Yellow" },
	{ value: "pink-500", color: "#ec4899", name: "Pink" },
	{ value: "indigo-500", color: "#6366f1", name: "Indigo" }
]

export default function VectorsPage({ node }: VectorsPageProps) {
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [resetDialogOpen, setResetDialogOpen] = useState(false)
	const [hasFeature, setHasFeature] = useState(false)
	const [featureData, setFeatureData] = useState<FeatureData | null>(null)
	const [selectedTool, setSelectedTool] = useState<string>("select")
	const [isDrawing, setIsDrawing] = useState(false)

	// Form state
	const [featureType, setFeatureType] = useState<"point" | "line" | "polygon">("point")
	const [featureName, setFeatureName] = useState("")
	const [savePath, setSavePath] = useState("")
	const [featureColor, setFeatureColor] = useState("sky-500")

	useEffect(() => {
		loadContext()
		return () => {
			unloadContext()
		}
	}, [])

	const loadContext = () => {
		setCreateDialogOpen(true)
	}

	const unloadContext = () => {
		resetForm()
	}

	const resetForm = () => {
		setFeatureName("")
		setSavePath("")
		setFeatureType("point")
	}

	useEffect(() => {
		const map = store.get<mapboxgl.Map>("map")
		const drawInstance = store.get("mapDraw") as MapboxDraw | null
		if (!map || !drawInstance || !featureData) return

		// Set up draw.create event handler
		const handleDrawCreate = (e: any) => {
			if (selectedTool === "draw" && isDrawing) {
				console.log("Feature created:", e.features[0])

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
				}, 50)
			}
		}

		// Setup modechange handler for more robust monitoring of mode changes
		const handleModeChange = (e: any) => {
			// If we exited a drawing mode and we're supposed to be drawing
			if (selectedTool === "draw" && isDrawing &&
				e.mode === "simple_select" &&
				!e.oldMode.startsWith("direct_select")) {

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
		const drawInstance = store.get("mapDraw") as MapboxDraw | null
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
		} else {
			setIsDrawing(false)
			drawInstance.changeMode("simple_select")
		}
	}, [selectedTool, featureData])

	const handleCreateFeature = () => {
		if (!featureName.trim() || !savePath.trim()) {
			return
		}

		const newFeature: FeatureData = {
			type: featureType,
			name: featureName.trim(),
			savePath: savePath.trim(),
			created: new Date(),
			color: featureColor,
		}

		setFeatureData(newFeature)
		setHasFeature(true)
		setCreateDialogOpen(false)

		resetForm()
	}

	const handleReset = () => {
		setFeatureData(null)
		setHasFeature(false)
		setResetDialogOpen(false)
		setCreateDialogOpen(true)
		setSelectedTool("select")
	}

	const handleFilePlusClick = () => {
		if (hasFeature) {
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
				return <div className="w-3 h-3 bg-blue-500 rounded-full" />
			case "line":
				return <Minus className="w-4 h-4 text-green-500" />
			case "polygon":
				return <Square className="w-4 h-4 text-purple-500" />
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

	return (
		<>
			{/* Create New Feature Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogTitle>Create New Feature</DialogTitle>
					<DialogDescription>Fill in feature information to create a new vector feature</DialogDescription>

					<div className="space-y-6 py-4 -mt-4">
						<div className="space-y-3">
							<Label className="text-sm font-medium">Feature Type *</Label>
							<RadioGroup value={featureType} onValueChange={(value: any) => setFeatureType(value)}>
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
							<Select value={featureColor} onValueChange={setFeatureColor}>
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
								Feature Name *
							</Label>
							<Input
								id="featureName"
								value={featureName}
								onChange={(e) => setFeatureName(e.target.value)}
								placeholder="Enter feature name"
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="savePath" className="text-sm font-medium">
								Local Save Path *
							</Label>
							<Button
								variant="outline"
								onClick={() => document.getElementById("savePath")?.click()}
								className="w-full justify-start text-muted-foreground cursor-pointer"
							>
								{savePath || "Select folder for saving"}
								<FolderOpen className="w-4 h-4 ml-auto" />
							</Button>
							<Input
								id="savePath"
								type="file"
								value={savePath}
								onChange={(e) => setSavePath(e.target.value)}
								className="hidden"
							/>
						</div>
					</div>

					<DialogFooter className="flex gap-2">
						<Button variant="outline" className="cursor-pointer" onClick={() => setCreateDialogOpen(false)}>
							Cancel
						</Button>
						<Button className="cursor-pointer" onClick={handleCreateFeature} disabled={!featureName.trim() || !savePath.trim()}>
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
							title={hasFeature ? "Reset and create new feature" : "Create new feature"}
						>
							{hasFeature ? <RotateCcw className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
						</Button>
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" title="Save">
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
					{featureData && (
						<Card className="absolute bg-white/75 backdrop-blur-2xl bottom-4 left-2 w-80 z-50 shadow-lg">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									{getFeatureTypeIcon(featureData.type)}
									Feature Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 -mt-2">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<Label className="text-muted-foreground">Type</Label>
										<div className="flex items-center gap-2 mt-1">
											{getFeatureTypeIcon(featureData.type)}
											<span className="font-medium">{getFeatureTypeLabel(featureData.type)}</span>
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">Creation Time</Label>
										<div className="mt-1 font-medium">{featureData.created.toLocaleTimeString()}</div>
									</div>
								</div>

								<div>
									<Label className="text-muted-foreground">Name</Label>
									<div className="mt-1 font-medium">{featureData.name}</div>
								</div>

								<div>
									<Label className="text-muted-foreground">Save Path</Label>
									<div className="mt-1 font-mono text-xs p-2 rounded">{featureData.savePath}</div>
								</div>

								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Current Tool</Label>
									<div className="mt-1 font-medium capitalize">
										{toolbarItems.find((item) => item.id === selectedTool)?.title || selectedTool}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Map container placeholder */}
					<MapContainer node={node} style='w-full h-full' />
				</div>
			</div>
		</>
	)
}
