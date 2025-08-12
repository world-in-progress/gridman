import { useEffect, useRef, useState, useReducer } from 'react'
import {
	FolderOpen,
	Info,
	Plus,
	TentTree,
	FilePlus2,
} from "lucide-react"
import { InpsPageProps } from './types'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { InpsPageContext } from './inps'
import { toast } from 'sonner'
import MapContainer from '@/components/mapContainer/mapContainer'
import * as apis from '@/core/apis/apis'
import { Label } from "@/components/ui/label"
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
import { clearSwmmFromMap, loadInpAndRenderSwmm } from "../inp/utils"

export default function InpsPage({ node }: InpsPageProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)
	const pageContext = useRef<InpsPageContext | null>(null)
	const [showInpDialog, setShowInpDialog] = useState(false)

	useEffect(() => {
		loadContext(node as SceneNode)

		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {
		pageContext.current = await node.getPageContext() as InpsPageContext

		if (pageContext.current.hasInp) {
			setShowInpDialog(false)

			loadInpAndRenderSwmm(pageContext.current!.inpData!, {
				fromEPSG: '2326',
				toEPSG: '4326',
				idPrefix: 'swmm',
				fit: true,
			})
		} else {
			setShowInpDialog(true)
		}

		triggerRepaint()
	}

	const unloadContext = () => {
		clearSwmmFromMap()
	}

	const confirmCreateNewLUM = () => {
		const map = store.get<mapboxgl.Map>('map')!

		clearSwmmFromMap()

		pageContext.current!.inpMeta = {
			name: '',
			type: 'inp',
			src_path: '',
		}

		pageContext.current!.inpData = null

		pageContext.current!.hasInp = false

		setShowInpDialog(true)

		triggerRepaint()
	}

	const handleFileSelect = async () => {
		if (window.electronAPI && typeof window.electronAPI.openInpFileDialog === 'function') {
			try {
				const filePath = await window.electronAPI.openInpFileDialog()
				if (filePath) {
					if (pageContext.current) {
						pageContext.current.inpMeta.src_path = filePath
						triggerRepaint()
					}
				}
			} catch (error) {
				console.error('Error opening file dialog:', error)
				toast.error('文件选择对话框打开失败')
			}
		} else {
			toast.error('文件选择功能不可用')
		}
	}

	const handleCreateInp = async () => {

		const map = store.get<mapboxgl.Map>('map')!

		const gateData = {
			name: pageContext.current?.inpMeta.name!,
			type: 'inp',
			src_path: pageContext.current?.inpMeta.src_path!
		}

		setShowInpDialog(false)

		store.get<{ on: Function, off: Function }>('isLoading')!.on()

		const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)

		if (!response.success) {
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
			toast.error('Failed to save gate')
			return
		}

		const tree = node.tree as SceneTree
		await tree.alignNodeInfo(node, true)
		tree.notifyDomUpdate()

		const nodeKey = node.key + '.' + gateData.name

		const inpData = await apis.common.getCommonData.fetch(nodeKey, node.tree.isPublic)

		pageContext.current!.inpData = inpData.data.data

		loadInpAndRenderSwmm(pageContext.current!.inpData!, {
			fromEPSG: '2326',
			toEPSG: '4326',
			idPrefix: 'swmm',
			fit: true,
		})

		pageContext.current!.hasInp = true

		store.get<{ on: Function, off: Function }>('isLoading')!.off()

		toast.success('Gate saved successfully')

		triggerRepaint()
	}

	return (
		<div className='relative w-full h-full flex flex-row bg-gray-50'>
			<Dialog open={showInpDialog} onOpenChange={setShowInpDialog}>
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
								value={pageContext.current?.inpMeta.name}
								onChange={(e) => {
									pageContext.current!.inpMeta.name = e.target.value
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
									value={pageContext.current?.inpMeta.src_path}
									readOnly={true}
									onChange={(e) => {
										pageContext.current!.inpMeta.src_path = e.target.value
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
							onClick={() => setShowInpDialog(false)}
							className='cursor-pointer'
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateInp}
							disabled={!pageContext.current?.inpMeta.name.trim() || !pageContext.current?.inpMeta.src_path.trim()}
							className='cursor-pointer'
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="w-[20vw] absolute top-0 left-0 bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r rounded-br-lg border-slate-200">
				{/* Header */}
				<div className={`p-6 bg-white border-b border-slate-200 ${!pageContext.current?.hasInp && 'rounded-b-lg'}`}>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<TentTree className='w-6 h-6' />
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-slate-900">Create New INP</h2>
							<p className="text-sm text-slate-500">New INP Details</p>
						</div>
						{!pageContext.current?.hasInp ? (
							<Button
								variant="outline"
								className="gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600"
								onClick={() => setShowInpDialog(true)}
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
										<AlertDialogTitle>Confirm Create New INP</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to continue creating a new INP?
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
				{pageContext.current?.hasInp && (
					<div className="flex-1 p-2 space-y-2 overflow-y-auto">
						<Card className="border-slate-200 shadow-sm">
							<CardContent>
								<div className="flex items-center gap-2 mb-2">
									<Info className="w-4 h-4 text-slate-500" />
									<span className="text-xs font-medium text-slate-500 uppercase tracking-wide">INP Information</span>
								</div>
								<div className="ml-6 space-y-2">
									{/* Name */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-slate-600">Name</span>
										<div className="flex items-center gap-2 mr-1">
											<span className="font-semibold text-slate-900">
												{pageContext.current.inpMeta.name}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
			<div className='w-full h-full flex-1'>
				<MapContainer node={node} style='w-full h-full' />
			</div>
		</div>
	)
}
