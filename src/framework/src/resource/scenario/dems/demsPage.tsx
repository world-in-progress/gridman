import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import store from '@/store'
import { toast } from 'sonner'
import {
	Dialog,
	DialogTitle,
	DialogFooter,
	DialogContent,
	DialogDescription,
} from "@/components/ui/dialog"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DemsPageProps } from './types'
import * as apis from '@/core/apis/apis'
import { DemsPageContext } from './dems'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from "@/components/ui/badge"
import { RasterMeta } from "@/core/apis/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from '@/components/ui/card'
import { SceneTree } from "@/components/resourceScene/scene"
import MapContainer from '@/components/mapContainer/mapContainer'
import TerrainByProxyTile from '../dem/terrainLayer/terrainLayer'
import { convertCoordinate } from '@/components/mapContainer/utils'
import { FilePlus2, FolderOpen, Info, Plus, Mountain } from 'lucide-react'

export default function DemsPage({ node }: DemsPageProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)

	const pageContext = useRef<DemsPageContext | null>(null)

	const map = store.get<mapboxgl.Map>("map")

	const nodeKey = useRef<string | null>(null)
	const terrainLayer = useRef<TerrainByProxyTile | null>(null)
	const initialVisualizationSettings = useRef<{
		exaggeration: number
		opacity: number
		palette: number
		reversePalette: boolean
		lightPos: [number, number, number]
	}>({
		exaggeration: 4,
		opacity: 80,
		palette: 0,
		reversePalette: false,
		lightPos: [-0.1, 0.3, 0.25] as [number, number, number]
	});

	const [hasDem, setHasDem] = useState<boolean>(false)
	const [showDemDialog, setShowDemDialog] = useState(false)
	const [newDemData, setNewDemData] = useState<{
		name: string,
		path: string
	}>({
		name: '',
		path: ''
	})
	const [demInfo, setDemInfo] = useState<RasterMeta['data'] | null>(null)

	useEffect(() => {
		setShowDemDialog(true)
		return () => {
			if (map) {
				terrainLayer.current && map.removeLayer(terrainLayer.current?.id)
			}
		}
	}, [map, node])

	useEffect(() => {

		const addDEMLayer = () => {
			const map = store.get<mapboxgl.Map>('map')
			if (!map) return

			const computeBBOX = () => {
				const bbox = demInfo!.bbox
				const LB = convertCoordinate(bbox[0], bbox[1], '2326', '4326')
				const TR = convertCoordinate(bbox[2], bbox[3], '2326', '4326')
				if (LB && TR) {
					const bbox84 = [LB.x, LB.y, TR.x, TR.y]
					return bbox84
				} else {
					return null
				}
			}

			const loadDemLayer = () => {
				terrainLayer.current = new TerrainByProxyTile(nodeKey.current!, tileUrl, bbox84!, eleRange, initialVisualizationSettings.current)
				map.addLayer(terrainLayer.current);
				map.fitBounds([[bbox84![0], bbox84![1]], [bbox84![2], bbox84![3]]], {
					padding: 80,
					duration: 1000,
				})
			}

			const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, nodeKey.current!, 'terrainrgb', new Date().getTime().toString())
			const minValue = demInfo?.min_value
			const maxValue = demInfo?.max_value
			const eleRange = (minValue && maxValue) ? [minValue, maxValue] as [number, number] : undefined
			const bbox84 = computeBBOX()

			if (!bbox84) {
				toast.error('Failed to get bounding box')
				return
			}
			if (map.isStyleLoaded()) {
				loadDemLayer()
			} else {
				map.once('style.load', () => {
					loadDemLayer()
				})
			}

			toast.success('DEM loaded successfully')
			triggerRepaint()
		}

		if (hasDem && demInfo) {
			addDEMLayer()
		}
	}, [demInfo, hasDem])

	const handleCreateDEM = async () => {
		if (!newDemData.name.trim() || !newDemData.path.trim()) {
			toast.error('Please fill in all fields')
			return
		}

		const newDEM = {
			name: newDemData.name,
			type: 'dem',
			original_tif_path: newDemData.path,
		}

		setShowDemDialog(false)
		store.get<{ on: Function, off: Function }>('isLoading')!.on()

		const createRasterRes = await apis.raster.createRaster.fetch(newDEM, node.tree.isPublic)
		if (!createRasterRes.success) {
			toast.error(createRasterRes.message)
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			return
		}

		const tree = node.tree as SceneTree
		await tree.alignNodeInfo(node, true)
		tree.notifyDomUpdate()

		nodeKey.current = createRasterRes.message
		const getCogTifRes = await apis.raster.getCogTif.fetch(nodeKey.current, node.tree.isPublic)

		if (!getCogTifRes.success) {
			toast.error(getCogTifRes.message)
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			return
		} else {
			const demMeta = await apis.raster.getRasterMetaData.fetch(nodeKey.current, node.tree.isPublic)
			setDemInfo(demMeta.data)
			setHasDem(true)
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			toast.success(`Create DEM ${newDEM.name} successfully`)
		}

		triggerRepaint()
	}

	const handleFileSelect = useCallback(async () => {
		if (window.electronAPI && typeof window.electronAPI.openTiffFileDialog === 'function') {
			try {
				const filePath = await window.electronAPI.openTiffFileDialog();
				if (filePath) {
					if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
						console.log('Selected file path:', filePath);
						setNewDemData({ ...newDemData, path: filePath });
					} else {
						toast.error('请选择TIF格式文件');
					}
				}
			} catch (error) {
				console.error('Error opening file dialog:', error);
				toast.error('Failed to open file dialog');
			}
		} else {
			toast.error('File selection is not available');
		}
	}, [newDemData]);

	const confirmCreateNewDEM = () => {
		const map = store.get<mapboxgl.Map>('map')
		if (map) {
			terrainLayer.current && map.removeLayer(terrainLayer.current?.id)
			terrainLayer.current = null
		}

		setNewDemData({
			name: '',
			path: ''
		})
		setHasDem(false)
		setShowDemDialog(true)

		triggerRepaint()
	}

	return (
		<div className="flex w-full relative bg-gray-50" >
			<Dialog open={showDemDialog} onOpenChange={setShowDemDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogTitle>Create New DEM</DialogTitle>
					<DialogDescription>Fill in DEM information to create a new DEM</DialogDescription>
					<div className="space-y-6 py-4 -mt-4">
						<div className="space-y-2">
							<Label htmlFor="demName" className="text-sm font-medium">
								DEM Name
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="demName"
								value={newDemData?.name}
								onChange={(e) => {
									setNewDemData({ ...newDemData, name: e.target.value })
								}}
								placeholder="Enter DEM name"
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="savePath" className="text-sm font-medium">
								DEM Path
								<span className="text-red-500">*</span>
							</Label>
							<div className="flex col-span-3 gap-2">

								<Input
									id="sourceKey"
									value={newDemData?.path}
									onChange={(e) => setNewDemData({ ...newDemData, path: e.target.value })}
									className="flex-1"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={handleFileSelect}
									title="Browse file"
									className='cursor-pointer'
								>
									<FolderOpen className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter className="flex gap-2">
						<Button variant="outline" className="cursor-pointer" onClick={() => setShowDemDialog(false)}>
							Cancel
						</Button>
						<Button
							className="cursor-pointer"
							onClick={handleCreateDEM}
							disabled={false}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="w-[20vw] absolute top-0 left-0 bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r rounded-br-lg border-slate-200">
				{/* Header */}
				<div className={`p-6 bg-white border-b border-slate-200 ${!hasDem && 'rounded-b-lg'}`}>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Mountain className='w-6 h-6' />
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-slate-900">Create New DEM</h2>
							<p className="text-sm text-slate-500">New DEM Details</p>
						</div>
						{!hasDem ? (
							<Button
								variant="outline"
								className="gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600"
								onClick={() => setShowDemDialog(true)}
							>
								<FilePlus2 className="w-4 h-4 text-white" />
								<span className='text-white'>Create</span>
							</Button>
						) : (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
									>
										<Plus className="w-4 h-4" /> New
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Confirm Create New DEM</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to continue creating a new DEM?
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter className='flex gap-6'>
										<AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={confirmCreateNewDEM}
											className="bg-sky-500 hover:bg-sky-600 cursor-pointer"
										>
											Confirm
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>

				{/* Content */}
				{hasDem && (
					<div className="flex-1 p-2 space-y-2 overflow-y-auto">
						<Card className="border-slate-200 shadow-sm">
							<CardContent>
								<div className="flex items-center gap-2 mb-2">
									<Info className="w-4 h-4 text-slate-500" />
									<span className="text-xs font-medium text-slate-500 uppercase tracking-wide">DEM Information</span>
								</div>
								<div className="ml-6 space-y-2">
									{/* Name */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Name</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="font-semibold text-slate-900">
												{node.name}
											</span>
										</div>
									</div>
									{/* EPSG */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">EPSG</span>
										<div className="flex items-center">
											<Badge variant="secondary" className={`text-xs font-semibold`}>
												{demInfo?.epsg}
											</Badge>
										</div>
									</div>
									{/* min value */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Minimum Value</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="text-sm text-slate-900">
												{demInfo?.min_value}
											</span>
										</div>
									</div>
									{/* max value */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Maximum Value</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="text-sm text-slate-900">
												{demInfo?.max_value}
											</span>
										</div>
									</div>
									{/* width */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Width</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="text-sm text-slate-900">
												{demInfo?.width}
											</span>
										</div>
									</div>
									{/* height */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Height</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="text-sm text-slate-900">
												{demInfo?.height}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Map container placeholder */}
			<MapContainer node={node} style='flex-1 bg-slate-700 relative' />
		</div>
	)
}
