import { useEffect, useReducer, useRef, useState } from 'react'
import { RainfallsPageProps } from './types'
import {
	RotateCcw,
	CheckCircle,
	FolderOpen,
	CloudRainWind,
	FilePlus2,
	Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode } from '@/components/resourceScene/scene'
import { RainfallsPageContext } from './rainfalls'
import { toast } from 'sonner'
import MapContainer from '@/components/mapContainer/mapContainer'
import * as apis from '@/core/apis/apis'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog'

export default function RainfallsPage({ node }: RainfallsPageProps) {
	const [, triggerRepaint] = useReducer(x => x + 1, 0)
	const pageContext = useRef<RainfallsPageContext | null>(null)
	const [showRainfallDialog, setShowRainfallDialog] = useState(false)

	useEffect(() => {
		loadContext(node as SceneNode)

		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {

		pageContext.current = await node.getPageContext() as RainfallsPageContext

		console.log(pageContext.current)

		if (pageContext.current.hasRainfall) {
			setShowRainfallDialog(false)
		} else {
			setShowRainfallDialog(true)
		}

		triggerRepaint()
	}

	const unloadContext = () => {
		console.log(pageContext.current)
		console.log('组件卸载')
	}


	const handleFileSelect = async () => {
		if (window.electronAPI && typeof window.electronAPI.openCsvFileDialog === 'function') {
			try {
				const filePath = await window.electronAPI.openCsvFileDialog()
				if (filePath) {
					if (pageContext.current) {
						pageContext.current.rainfallData.src_path = filePath
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

	const confirmCreateNewRainfall = () => {
		pageContext.current!.rainfallData = {
			name: '',
			type: 'rainfall',
			src_path: ''
		}

		pageContext.current!.hasRainfall = false

		setShowRainfallDialog(true)

		triggerRepaint()
	}

	const handleCreateRainfall = async () => {
		if (!pageContext.current?.rainfallData.name || !pageContext.current?.rainfallData.src_path) return

		const gateData = {
			name: pageContext.current?.rainfallData.name,
			type: 'rainfall',
			src_path: pageContext.current?.rainfallData.src_path
		}

		const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)

		setShowRainfallDialog(false)

		if (response.success) {
			toast.success('Rainfall saved successfully')
		} else {
			toast.error('Failed to save rainfall')
		}

		triggerRepaint()
	}

	return (
		<div className='relative w-full h-full flex flex-row bg-gray-50'>
			{/* <div className='absolute z-30 top-0 left-0 p-4 w-80'>
				<Card className='w-full shadow-md'>
					<CardHeader>
						<CardTitle>Create New Gate</CardTitle>
					</CardHeader>
					<CardContent className='p-4'>
						<div className='flex flex-col gap-4'>
							<div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
								<div className='w-20 font-bold'>Name</div>
								<Input
									className='flex-1 w-full'
									value={pageContext.current?.rainfallData.name}
									onChange={(e) => {
										pageContext.current!.rainfallData.name = e.target.value
										triggerRepaint()
									}}
									placeholder='Enter gate name'
								/>
							</div>
							<div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
								<div className='w-20 font-bold'>File Path</div>
								<div className="flex flex-1 gap-2">
									<Input
										className='flex-1'
										value={pageContext.current?.rainfallData.src_path || ''}
										readOnly={true}
										placeholder='Select file path'
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

							<div className='flex flex-row gap-2 justify-end'>
								<Button variant='outline' className='gap-1 bg-red-500 hover:bg-red-600 text-white' onClick={handleReset}>
									<RotateCcw className='w-4 h-4 text-white' />Reset
								</Button>
								<Button className='gap-1 bg-sky-500 hover:bg-sky-600 text-white' onClick={handleSaveInp}>
									<CheckCircle className='w-4 h-4 text-white' />Save
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div> */}
			<Dialog open={showRainfallDialog} onOpenChange={setShowRainfallDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Rainfall</DialogTitle>
						<DialogDescription>
							Please fill in the basic information for the Rainfall
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								id="name"
								value={pageContext.current?.rainfallData.name}
								onChange={(e) => {
									pageContext.current!.rainfallData.name = e.target.value
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
									value={pageContext.current?.rainfallData.src_path}
									readOnly={true}
									onChange={(e) => {
										pageContext.current!.rainfallData.src_path = e.target.value
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
							onClick={() => {
								setShowRainfallDialog(false)
								console.log(pageContext.current)
							}}
							className='cursor-pointer'
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateRainfall}
							disabled={!pageContext.current?.rainfallData.name.trim() || !pageContext.current?.rainfallData.src_path.trim()}
							className='cursor-pointer'
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="w-[20vw] absolute top-0 left-0 bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r rounded-br-lg border-slate-200">
				{/* Header */}
				<div className={`p-6 bg-white border-b border-slate-200 ${!pageContext.current?.hasRainfall && 'rounded-b-lg'}`}>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<CloudRainWind className='w-6 h-6' />
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-slate-900">Create New LUM</h2>
							<p className="text-sm text-slate-500">New LUM Details</p>
						</div>
						{!pageContext.current?.hasRainfall ? (
							<Button
								variant="outline"
								className="gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600"
								onClick={() => setShowRainfallDialog(true)}
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
											onClick={confirmCreateNewRainfall}
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

			</div>

			<div className='flex-1 relative'>
				<div className='bg-amber-300 w-full h-full'>
					你好
				</div>
			</div>
		</div>
	)
}