import { useEffect, useReducer, useRef } from 'react'
import { PatchInfoProps } from './types'
import { CheckCircle, Delete, MapPin, Pencil, SquaresIntersect } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import MapContainer from '@/components/mapContainer/mapContainer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { PatchPageContext } from './patch'
import { GridMeta } from '@/core/apis/types'
import { addMapPatchBounds, clearDrawPatchBounds, convertToWGS84 } from '@/components/mapContainer/utils'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deletepatch, updatePatchInfo } from './utils'
import { toast } from 'sonner'
import { PatchMeta } from '../patches/types'
import store from '@/store'

const patchTips = [
	{ tip1: 'Fill in the name of the Schema and the EPSG code.' },
	{ tip2: 'Description is optional.' },
	{ tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
	{ tip4: 'Set the grid size for each level.' },
]

export default function PatchInfo({ node }: PatchInfoProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)
	const pageContext = useRef<PatchPageContext>(new PatchPageContext())

	useEffect(() => {
		loadContext(node as SceneNode)

		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {
		pageContext.current = await node.getPageContext() as PatchPageContext

		const patchBoundsOn4326 = convertToWGS84(pageContext.current.patch!.bounds, pageContext.current.patch!.epsg.toString())

		addMapPatchBounds(patchBoundsOn4326, undefined, true, {
			fillColor: '#00D5FF',
			lineColor: '#FFFF00',
			opacity: 0.3,
			lineWidth: 6
		})

		triggerRepaint()
	}

	const unloadContext = () => {
		clearDrawPatchBounds()
		triggerRepaint()
	}


	const formatSingleValue = (value: number): string => value.toFixed(6);

	const formatCoordinate = (coord: [number, number] | undefined) => {
		if (!coord) return '---';
		return `[${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`;
	};

	const handlePatchDelete = async () => {
		const patchName = pageContext.current.patch!.name
		const response = await deletepatch(node as SceneNode, node.tree.isPublic)
		if (response) {
			toast.success(`Patch ${patchName} deleted successfully`)
			const tree = node.tree as SceneTree
			await tree.removeNode(node)
		} else {
			toast.error(`Failed to delete patch ${patchName}`)
		}
	}

	const handleEditButtonClick = () => {
		pageContext.current.isEditing = true
		triggerRepaint()
	}

	const handleDoneButtonClick = async () => {
		const patch = {
			name: pageContext.current.patch!.name,
			starred: false,
			description: pageContext.current.patch!.description,
			bounds: pageContext.current.patch!.bounds
		} as PatchMeta
		const patchName = patch.name
		const response = await updatePatchInfo(node as SceneNode, patch, node.tree.isPublic)
		if (response) {
			toast.success(`Patch ${patchName} updated successfully`)
		} else {
			toast.error(`Failed to update patch ${patchName}`)
		}
		pageContext.current.isEditing = false
		triggerRepaint()
	}

	const handleFitToPatchBounds = () => {
		const map = store.get<mapboxgl.Map>('map')
		if (!map) return

		const patchBounds = pageContext.current.patch!.bounds
		const epsg = pageContext.current.patch!.epsg
		const patchBoundsOn4326 = convertToWGS84(patchBounds, epsg.toString())

		map.fitBounds(patchBoundsOn4326, {
			padding: 100,
			duration: 1000
		})
	}

	return (
		<div className='w-full h-[96vh] flex flex-row'>
			<div className='w-2/5 h-full flex flex-col'>
				<div className='flex-1 overflow-hidden'>
					{/* ----------------- */}
					{/* Page Introduction */}
					{/* ----------------- */}
					<div className='w-full border-b border-gray-700 flex flex-row'>
						{/* ------------*/}
						{/* Page Avatar */}
						{/* ------------*/}
						<div className='w-1/3 h-full flex justify-center items-center my-auto'>
							<Avatar className=' h-28 w-28 border-2 border-white'>
								<AvatarFallback className='bg-[#007ACC]'>
									<SquaresIntersect className='h-15 w-15 text-white' />
								</AvatarFallback>
							</Avatar>
						</div>
						{/* -----------------*/}
						{/* Page Description */}
						{/* -----------------*/}
						<div className='w-2/3 h-full p-4 space-y-2 text-white'>
							{/* -----------*/}
							{/* Page Title */}
							{/* -----------*/}
							<h1 className='font-bold text-[25px] relative flex items-center'>
								Create New Schema
								<span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">{node.tree.isPublic ? 'Public' : 'Private'}</span>
								<span>[{node.parent?.name}]</span>
							</h1>
							{/* ----------*/}
							{/* Page Tips */}
							{/* ----------*/}
							<div className='text-sm p-2 px-4 w-full'>
								<ul className='list-disc space-y-1'>
									{patchTips.map((tip, index) => (
										<li key={index}>
											{Object.values(tip)[0]}
										</li>
									))}
								</ul>
							</div>
							<div className='text-sm w-full flex flex-row space-x-4 px-4'>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant='destructive'
											className='bg-red-500 hover:bg-red-600 h-8 text-white cursor-pointer rounded-sm flex'
										>
											<span>Delete</span>
											<Separator orientation='vertical' className='h-4' />
											<Delete className='w-4 h-4' />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Are you sure to delete this patch?</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete this patch and all its data.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel className='cursor-pointer border border-gray-300'>Cancel</AlertDialogCancel>
											<AlertDialogAction
												className='bg-red-500 hover:bg-red-600 cursor-pointer'
												onClick={handlePatchDelete}
											>
												Confirm
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
								<Button
									variant='destructive'
									className='bg-sky-500 hover:bg-sky-600 h-8 text-white cursor-pointer rounded-sm flex'
									onClick={handleFitToPatchBounds}
								>
									<span>Scale</span>
									<Separator orientation='vertical' className='h-4' />
									<MapPin className='w-4 h-4' />
								</Button>
							</div>
						</div>
					</div>
					{/* ---------------- */}
					{/* Grid Schema Form */}
					{/* ---------------- */}
					<ScrollArea className='h-full max-h-[calc(100vh-14.5rem)]'>
						<div className='w-2/3 mx-auto mt-4 mb-4 space-y-4 pb-4'>
							{/* ----------- */}
							{/* Patch Name */}
							{/* ----------- */}
							<div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
								<h2 className='text-lg font-semibold mb-2'>
									New Patch Name
								</h2>
								<div className='space-y-2'>
									<Input
										id='name'
										value={pageContext.current.patch?.name}
										readOnly={true}
										placeholder={'Enter new patch name'}
										className={`w-full text-black border-gray-300`}
									/>
								</div>
							</div>
							{/* ------------------ */}
							{/* Patch Description */}
							{/* ------------------ */}
							<div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
								<div className='flex justify-between items-center mb-2'>
									<h2 className='text-lg font-semibold mb-2'>
										Patch Description (Optional)
									</h2>
									{pageContext.current.isEditing
										? (<Button
											className='bg-green-500 hover:bg-green-600 text-white cursor-pointer h-8'
											onClick={handleDoneButtonClick}
										>
											<span>Done</span>
											<Separator orientation='vertical' className='h-4' />
											<CheckCircle className='w-4 h-4' />
										</Button>)
										: (<Button
											className='bg-blue-500 hover:bg-blue-600 text-white cursor-pointer h-8'
											onClick={handleEditButtonClick}
										>
											<span>Edit</span>
											<Separator orientation='vertical' className='h-4' />
											<Pencil className='w-4 h-4' />
										</Button>)}

								</div>
								<div className='space-y-2'>
									<Textarea
										id='description'
										value={pageContext.current.patch?.description}
										readOnly={!pageContext.current.isEditing}
										placeholder={'Enter patch description'}
										className={`w-full text-black border-gray-300`}
										onChange={(e) => {
											if (pageContext.current.patch) {
												pageContext.current.patch.description = e.target.value;
												triggerRepaint();
											}
										}}
									/>
								</div>
							</div>
							{/* --------- */}
							{/* EPSG Code */}
							{/* --------- */}
							<div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
								<h2 className='text-lg font-semibold mb-2'>
									EPSG Code
								</h2>
								<div className='space-y-2'>
									<Input
										id='epsg'
										value={pageContext.current.patch?.epsg.toString()}
										readOnly={true}
										placeholder='EPSG Code'
										className={`text-black w-full border-gray-300`}
									/>
								</div>
							</div>
							{/* --------------- */}
							{/* Adjusted Coordinates */}
							{/* --------------- */}
							{pageContext.current.patch?.bounds &&
								<div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
									<h3 className="font-semibold text-lg mb-2">Adjusted Coordinates (EPSG:{pageContext.current.patch?.epsg})</h3>
									<div className="grid grid-cols-3 gap-1 text-xs">
										{/* Top Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
										</div>
										{/* North/Top - northEast[1] */}
										<div className="text-center">
											<span className="font-bold text-blue-600 text-xl">N</span>
											<div>[{formatSingleValue(pageContext.current.patch?.bounds[3])}]</div>
										</div>
										{/* Top Right Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
										</div>
										{/* West/Left - southWest[0] */}
										<div className="text-center">
											<span className="font-bold text-green-600 text-xl">W</span>
											<div>[{formatSingleValue(pageContext.current.patch?.bounds[0])}]</div>
										</div>
										{/* Center */}
										<div className="text-center">
											<span className="font-bold text-xl">Center</span>
											<div>{formatCoordinate([(pageContext.current.patch?.bounds[0] + pageContext.current.patch?.bounds[2]) / 2, (pageContext.current.patch?.bounds[1] + pageContext.current.patch?.bounds[3]) / 2])}</div>
										</div>
										{/* East/Right - southEast[0] */}
										<div className="text-center">
											<span className="font-bold text-red-600 text-xl">E</span>
											<div>[{formatSingleValue(pageContext.current.patch?.bounds[2])}]</div>
										</div>
										{/* Bottom Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
										</div>
										{/* South/Bottom - southWest[1] */}
										<div className="text-center">
											<span className="font-bold text-purple-600 text-xl">S</span>
											<div>[{formatSingleValue(pageContext.current.patch?.bounds[1])}]</div>
										</div>
										{/* Bottom Right Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
										</div>
									</div>
								</div>
							}
						</div>
					</ScrollArea>
				</div>
			</div>
			<div className='w-3/5 h-full py-4 pr-4'>
				<MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
			</div>
		</div>
	)
}
