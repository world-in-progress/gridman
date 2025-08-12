import { useEffect, useRef, useState, useReducer, useCallback } from 'react'
import { LumsPageProps } from './types'
import * as apis from '@/core/apis/apis'
import {
	Info,
	Plus,
	TentTree,
	FilePlus2,
	FolderOpen,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from "@/components/ui/card"
import {
	AlertDialog,
	AlertDialogTitle,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { LumsPageContext } from './lums'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import MapContainer from '@/components/mapContainer/mapContainer'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import store from '@/store'
import {
	Dialog,
	DialogTitle,
	DialogFooter,
	DialogHeader,
	DialogContent,
	DialogDescription,
	DialogTrigger,
} from "@/components/ui/dialog"
import { lumTypeMap } from '../lum/lumPage'

export default function LumsPage({ node }: LumsPageProps) {

	const { t } = useTranslation('lumsPage')
	const [, triggerRepaint] = useReducer(x => x + 1, 0)
	const pageContext = useRef<LumsPageContext | null>(null)
	const [showLumDialog, setShowLumDialog] = useState(false)

	useEffect(() => {
		loadContext(node as SceneNode)
		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {

		pageContext.current = await node.getPageContext() as LumsPageContext

		const map = store.get<mapboxgl.Map>('map')!

		if (pageContext.current.hasLUM) {

			setShowLumDialog(false)

			store.get<{ on: Function, off: Function }>('isLoading')!.on()

			const nodeKey = pageContext.current!.newLumInfo.nodeKey

			if (map.isStyleLoaded()) {
				addSourceAndLayer(map, nodeKey)
			} else {
				map.once('style.load', () => {
					addSourceAndLayer(map, nodeKey)
				})
			}
		} else {
			setShowLumDialog(true)
		}
		triggerRepaint()
	}

	const addSourceAndLayer = (map: mapboxgl.Map, nodeKey: string) => {

		if (map.getLayer(nodeKey + 'layer')) {
			map.removeLayer(nodeKey + 'layer')
			map.removeSource(nodeKey + 'source')
		}

		const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, nodeKey, 'uint8', new Date().getTime().toString())

		map.addSource(nodeKey + 'source', {
			type: "raster",
			tiles: [tileUrl],
			tileSize: 256,
			maxzoom: 18,
			minzoom: 0,
			scheme: "xyz",
		})

		map.addLayer({
			id: nodeKey + 'layer',
			type: "raster",
			source: nodeKey + 'source',
			paint: {
				"raster-opacity": 0.8,
				'raster-color': [
					'step',
					['raster-value'],
					'rgba(255,190,0,1)',
					0.040, 'rgba(87,229,0,1)',
					0.079, 'rgba(0,83,154,1)',
					0.118, 'rgba(255,129,0,1)',
					0.157, 'rgba(125,125,125,1)',
					0.196, 'rgba(0,255,124,1)',
					0.235, 'rgba(255,0,74,1)',
					0.274, 'rgba(91,164,255,1)',
					0.313, 'rgba(163,97,68,1)',
					0.352, 'rgba(0,255,203,1)',
					0.391, 'rgba(205,0,215,1)'
				]
			},

		})

		store.get<{ on: Function, off: Function }>('isLoading')!.off()
		toast.success('LUM loaded successfully')
		triggerRepaint()
	}


	const unloadContext = () => {
		console.log('组件卸载')
	}

	const handleLumInfoConfirm = async () => {

		const map = store.get<mapboxgl.Map>('map')!

		const newLUM = {
			name: pageContext.current!.newLumInfo.name,
			type: 'lum',
			original_tif_path: pageContext.current!.newLumInfo.original_tif_path,
		}

		setShowLumDialog(false)

		store.get<{ on: Function, off: Function }>('isLoading')!.on()

		const createCogTifRes = await apis.raster.createRaster.fetch(newLUM, node.tree.isPublic)

		if (!createCogTifRes.success) {
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			toast.error(createCogTifRes.message)
			return
		}

		const tree = node.tree as SceneTree
		await tree.alignNodeInfo(node, true)
		tree.notifyDomUpdate()

		const nodeKey = createCogTifRes.message

		const getCogTifRes = await apis.raster.getCogTif.fetch(nodeKey, node.tree.isPublic)

		if (!getCogTifRes.success) {
			toast.error(getCogTifRes.message)
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			return
		} else {

			const lumInfo = await apis.raster.getRasterMetaData.fetch(nodeKey, node.tree.isPublic)

			pageContext.current!.newLumInfo.epsg = lumInfo.data.epsg.toString()
			pageContext.current!.newLumInfo.nodeKey = nodeKey

			const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, nodeKey, 'uint8', new Date().getTime().toString())

			addSourceAndLayer(map, nodeKey)

			pageContext.current!.hasLUM = true

			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			toast.success(`Create LUM ${pageContext.current!.newLumInfo.name} successfully`)
		}

		triggerRepaint()
	}

	const confirmCreateNewLUM = () => {
		const map = store.get<mapboxgl.Map>('map')

		const nodeKey = pageContext.current!.newLumInfo.nodeKey

		if (map?.getLayer(nodeKey + 'layer')) {
			map.removeLayer(nodeKey + 'layer')
			map.removeSource(nodeKey + 'source')
		}

		pageContext.current!.newLumInfo = {
			name: '',
			type: 'lum',
			nodeKey: '',
			epsg: '',
			original_tif_path: ''
		}

		pageContext.current!.hasLUM = false

		setShowLumDialog(true)

		triggerRepaint()
	}

	const handleFileSelect = useCallback(async () => {
		if (window.electronAPI && typeof window.electronAPI.openTiffFileDialog === 'function') {
			try {
				const filePath = await window.electronAPI.openTiffFileDialog()
				if (filePath) {
					if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
						pageContext.current!.newLumInfo.original_tif_path = filePath
						triggerRepaint()
					} else {
						toast.error('Please select a TIF file')
					}
				}
			} catch (error) {
				console.error('Error opening file dialog:', error)
				toast.error('Failed to open file dialog')
			}
		} else {
			toast.error('File selection is not available')
		}
	}, [])

	return (
		<div className="w-full h-full flex flex-row bg-gray-50 relative">
			<Dialog open={showLumDialog} onOpenChange={setShowLumDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New LUM</DialogTitle>
						<DialogDescription>
							Please fill in the basic information for the LUM
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								id="name"
								value={pageContext.current?.newLumInfo.name}
								onChange={(e) => {
									pageContext.current!.newLumInfo.name = e.target.value
									triggerRepaint()
								}}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="sourceKey" className="text-right">
								Resource Path
							</Label>
							<div className="flex col-span-3 gap-2">
								<Input
									id="sourceKey"
									value={pageContext.current?.newLumInfo.original_tif_path}
									readOnly={true}
									onChange={(e) => {
										pageContext.current!.newLumInfo.original_tif_path = e.target.value
										triggerRepaint()
									}}
									className="flex-1"
								/>
								<Button
									variant="secondary"
									className='cursor-pointer hover:bg-slate-200'
									size="icon"
									onClick={handleFileSelect}
									title="Browse file"
								>
									<FolderOpen className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter className='flex gap-6'>
						<Button
							variant="outline"
							onClick={() => setShowLumDialog(false)}
							className='cursor-pointer'
						>
							Cancel
						</Button>
						<Button
							onClick={handleLumInfoConfirm}
							disabled={!pageContext.current?.newLumInfo.name.trim() || !pageContext.current?.newLumInfo.original_tif_path.trim()}
							className='cursor-pointer'
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="w-[20vw] absolute top-0 left-0 bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r rounded-br-lg border-slate-200">
				{/* Header */}
				<div className={`p-6 bg-white border-b border-slate-200 ${!pageContext.current?.hasLUM && 'rounded-b-lg'}`}>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<TentTree className='w-6 h-6' />
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-slate-900">Create New LUM</h2>
							<p className="text-sm text-slate-500">New LUM Details</p>
						</div>
						{!pageContext.current?.hasLUM ? (
							<Button
								variant="outline"
								className="gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600"
								onClick={() => setShowLumDialog(true)}
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
										<AlertDialogTitle>Confirm Create New LUM</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to continue creating a new LUM?
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter className='flex gap-6'>
										<AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={confirmCreateNewLUM}
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
				{pageContext.current?.hasLUM && (
					<div className="flex-1 p-2 space-y-2 overflow-y-auto">
						<Card className="border-slate-200 shadow-sm">
							<CardContent>
								<div className="flex items-center gap-2 mb-2">
									<Info className="w-4 h-4 text-slate-500" />
									<span className="text-xs font-medium text-slate-500 uppercase tracking-wide">LUM Information</span>
								</div>
								<div className="ml-6 space-y-2">
									{/* Name */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Name</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="font-semibold text-slate-900">
												{pageContext.current.newLumInfo.name}
											</span>
										</div>
									</div>
									{/* EPSG */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">EPSG</span>
										<div className="flex items-center">
											<Badge variant="secondary" className={`text-xs font-semibold`}>
												{pageContext.current?.newLumInfo.epsg}
											</Badge>
										</div>
									</div>
									{/* Legend */}
									<div className="flex items-start">
										<span className="text-sm text-slate-600 items-center">Legend</span>
										<div className="grid grid-cols-2 gap-2 flex-1 mt-1">
											{lumTypeMap.map((item) => (
												<div key={item.value} className="flex items-center gap-1">
													<div
														className="w-4 h-4 rounded-sm ml-6"
														style={{ backgroundColor: item.color }}
													/>
													<span className="text-xs text-slate-700">{item.type}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
			{/* Map container placeholder */}
			<div className="w-full h-full flex-1">
				<MapContainer node={node} style='w-full h-full' />
			</div>
		</div>
	)
}