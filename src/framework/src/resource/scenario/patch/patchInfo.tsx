import { useEffect, useReducer } from 'react'
import { PatchInfoProps } from './types'
import { SquaresIntersect } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import MapContainer from '@/components/mapContainer/mapContainer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SceneNode } from '@/components/resourceScene/scene'
import { PatchPageContext } from './patch'

const patchTips = [
	{ tip1: 'Fill in the name of the Schema and the EPSG code.' },
	{ tip2: 'Description is optional.' },
	{ tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
	{ tip4: 'Set the grid size for each level.' },
]

export default function PatchInfo({
	node
}: PatchInfoProps) {

	const [, triggerRepaint] = useReducer(x => x + 1, 0)

	useEffect(() => {
		(node as SceneNode).getPageContext()
		.then(context => {
			const patchContext = context as PatchPageContext
		})
	})

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
										value={pageContext.current.name}
										readOnly={true}
										placeholder={'Enter new patch name'}
										className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
									/>
								</div>
							</div>
							{/* ------------------ */}
							{/* Patch Description */}
							{/* ------------------ */}
							<div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
								<h2 className='text-lg font-semibold mb-2'>
									Patch Description (Optional)
								</h2>
								<div className='space-y-2'>
									<Textarea
										id='description'
										value={pageContext.current.description}
										onChange={handleSetDescription}
										placeholder={'Enter patch description'}
										className={`w-full text-black border-gray-300 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
									/>
								</div>
							</div>
							{/* --------- */}
							{/* Belong To Schema */}
							{/* --------- */}
							<div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
								<h2 className='text-lg font-semibold mb-2'>
									Belong To Schema
								</h2>
								<div className='space-y-2'>
									<Input
										id='schema'
										value={pageContext.current.schema?.name}
										readOnly={true}
										placeholder='Schema Name'
										className={`text-black w-full border-gray-300`}
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
										value={pageContext.current.schema?.epsg.toString()}
										readOnly={true}
										placeholder='EPSG Code'
										className={`text-black w-full border-gray-300`}
									/>
								</div>
							</div>
							{/* --------------- */}
							{/* Original Coordinates */}
							{/* --------------- */}
							{convertCoordinate &&
								<div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
									<h3 className="font-semibold text-lg mb-2">Original Bounds (EPSG:{schemaEPSG.current})</h3>
									<div className="grid grid-cols-3 gap-1 text-xs">
										{/* Top Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
										</div>
										{/* North/Top - northEast[1] */}
										<div className="text-center">
											<span className="font-bold text-blue-600 text-xl">N</span>
											<div>[{formatSingleValue(convertCoordinate[3])}]</div>
										</div>
										{/* Top Right Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
										</div>
										{/* West/Left - southWest[0] */}
										<div className="text-center">
											<span className="font-bold text-green-600 text-xl">W</span>
											<div>[{formatSingleValue(convertCoordinate[0])}]</div>
										</div>
										{/* Center */}
										<div className="text-center">
											<span className="font-bold text-xl">Center</span>
											<div>{formatCoordinate([(convertCoordinate[0] + convertCoordinate[2]) / 2, (convertCoordinate[1] + convertCoordinate[3]) / 2])}</div>
										</div>
										{/* East/Right - southEast[0] */}
										<div className="text-center">
											<span className="font-bold text-red-600 text-xl">E</span>
											<div>[{formatSingleValue(convertCoordinate[2])}]</div>
										</div>
										{/* Bottom Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
										</div>
										{/* South/Bottom - southWest[1] */}
										<div className="text-center">
											<span className="font-bold text-purple-600 text-xl">S</span>
											<div>[{formatSingleValue(convertCoordinate[1])}]</div>
										</div>
										{/* Bottom Right Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b-2 border-r-2 border-gray-300 rounded-br"></div>
										</div>
									</div>
								</div>
							}
							{/* --------------- */}
							{/* Adjusted Coordinates */}
							{/* --------------- */}
							{adjustedCoordinate &&
								<div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
									<h3 className="font-semibold text-lg mb-2">Adjusted Coordinates (EPSG:{schemaEPSG.current})</h3>
									<div className="grid grid-cols-3 gap-1 text-xs">
										{/* Top Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t-2 border-l-2 border-gray-300 rounded-tl"></div>
										</div>
										{/* North/Top - northEast[1] */}
										<div className="text-center">
											<span className="font-bold text-blue-600 text-xl">N</span>
											<div>[{formatSingleValue(adjustedCoordinate[3])}]</div>
										</div>
										{/* Top Right Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t-2 border-r-2 border-gray-300 rounded-tr"></div>
										</div>
										{/* West/Left - southWest[0] */}
										<div className="text-center">
											<span className="font-bold text-green-600 text-xl">W</span>
											<div>[{formatSingleValue(adjustedCoordinate[0])}]</div>
										</div>
										{/* Center */}
										<div className="text-center">
											<span className="font-bold text-xl">Center</span>
											<div>{formatCoordinate([(adjustedCoordinate[0] + adjustedCoordinate[2]) / 2, (adjustedCoordinate[1] + adjustedCoordinate[3]) / 2])}</div>
										</div>
										{/* East/Right - southEast[0] */}
										<div className="text-center">
											<span className="font-bold text-red-600 text-xl">E</span>
											<div>[{formatSingleValue(adjustedCoordinate[2])}]</div>
										</div>
										{/* Bottom Left Corner */}
										<div className="relative h-12 flex items-center justify-center">
											<div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b-2 border-l-2 border-gray-300 rounded-bl"></div>
										</div>
										{/* South/Bottom - southWest[1] */}
										<div className="text-center">
											<span className="font-bold text-purple-600 text-xl">S</span>
											<div>[{formatSingleValue(adjustedCoordinate[1])}]</div>
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
