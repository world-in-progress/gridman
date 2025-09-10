import React, { useEffect, useReducer, useRef, useState } from 'react'
import store from '@/store'
import { toast } from 'sonner'
import { cn } from '@/utils/utils'
import { createGrid } from './utils'
import * as apis from '@/core/apis/apis'
import { GridsPageProps } from './types'
import { GridsPageContext } from './grids'
import { GridInfo } from '@/core/apis/types'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import MapContainer from '@/components/mapContainer/mapContainer'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import {
    convertToWGS84,
    clearBoundsById,
    addMapPatchBounds,
    highlightPatchBounds,
    clearDrawPatchBounds,
} from '@/components/mapContainer/utils'
import { SquaresUnite, X, Upload, MapPin, RotateCcw, Fullscreen } from 'lucide-react'


const gridTips = [
    { tip1: 'Drag patches from the resource manager to the upload area.' },
    { tip2: 'Reset button will clear all uploaded patches.' },
    { tip3: 'Click merge button to complete grid creation.' },
]

export default function GridsPage({ node }: GridsPageProps) {
    const { t } = useTranslation('gridsPage')
    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
    const [highlightedResource, setHighlightedResource] = useState<string | null>(null);

    const pageContext = useRef<GridsPageContext>(new GridsPageContext())

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as GridsPageContext

        // Convert each patch bounds to EPSG:4326 and add to map
        Object.entries(pageContext.current.patchesBounds).forEach(([patchId, bounds]) => {
            const patchBoundsOn4326 = convertToWGS84(bounds, pageContext.current.schema.epsg.toString())
            addMapPatchBounds(patchBoundsOn4326, patchId, false, undefined)
        })

        if (Object.keys(pageContext.current.patchesBounds).length !== 0) {
            fitGridBounds()
        }

        triggerRepaint()
    }

    const unloadContext = () => {
        return
    }

    const resetForm = () => {
        pageContext.current.gridName = ''
        pageContext.current.selectedResources = []
        triggerRepaint()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const nodeKey = e.dataTransfer.getData('text/plain')
        const patchPath = nodeKey.split('.').slice(0, -2).join('.')
        const patchName = nodeKey.split('.').pop()
        const schemaPath = node.key.split('.').slice(0, -1).join('.')
        if (schemaPath === patchPath) {
            if (nodeKey.split('.').slice(-2)[0] === 'patches') {
                const isAlreadySelected = pageContext.current.selectedResources.some((resource) => resource === nodeKey)
                if (!isAlreadySelected) {
                    pageContext.current.selectedResources.push(nodeKey)
                    const res = await apis.patch.getPatchMeta.fetch({ schemaName: pageContext.current.schema.name, patchName: patchName! }, node.tree.isPublic)
                    if (res && res.bounds) {
                        const boundsId = patchName!
                        pageContext.current.patchesBounds[boundsId] = res.bounds

                        const patchBoundsOn4326 = convertToWGS84(res.bounds, pageContext.current.schema.epsg.toString())
                        addMapPatchBounds(patchBoundsOn4326, boundsId)
                    }
                    triggerRepaint()
                }
            } else {
                toast.error(`Please select patch not grid`)
            }
        } else {
            toast.error(`Please select the correct patch on schema [${pageContext.current.schema.name}]`)
        }
    }

    const handleResourceRemove = (index: number) => {
        const resourceKey = pageContext.current.selectedResources[index]
        const patchName = resourceKey.split('.').pop()!

        clearBoundsById(patchName)

        delete pageContext.current.patchesBounds[patchName]

        pageContext.current.selectedResources = pageContext.current.selectedResources.filter((_, i) => i !== index)

        triggerRepaint()
    }

    const handleResourceClick = (resourceKey: string) => {
        const patchName = resourceKey.split('.').pop()!;

        setHighlightedResource(resourceKey)

        if (pageContext.current.patchesBounds[patchName]) {
            const patchBoundsOn4326 = convertToWGS84(
                pageContext.current.patchesBounds[patchName],
                pageContext.current.schema.epsg.toString()
            )
            highlightPatchBounds(patchBoundsOn4326, patchName)
        }
    }

    const handleReset = () => {
        Object.keys(pageContext.current.patchesBounds).forEach(id => {
            clearBoundsById(id)
        })

        pageContext.current.selectedResources = []
        pageContext.current.patchesBounds = {}

        triggerRepaint()
    }

    const fitGridBounds = () => {
        if (Object.keys(pageContext.current.patchesBounds).length === 0) {
            toast.error('No patches selected')
            return
        }

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        Object.values(pageContext.current.patchesBounds).forEach(bounds => {
            minX = Math.min(minX, bounds[0])
            minY = Math.min(minY, bounds[1])
            maxX = Math.max(maxX, bounds[2])
            maxY = Math.max(maxY, bounds[3])
        })

        const bounds = [minX, minY, maxX, maxY] as [number, number, number, number]

        const boundsOn4326 = convertToWGS84(bounds, pageContext.current.schema.epsg.toString())

        const map = store.get<mapboxgl.Map>('map')!
        map.fitBounds([
            [boundsOn4326[0], boundsOn4326[1]],
            [boundsOn4326[2], boundsOn4326[3]]
        ], {
            padding: 80,
            duration: 1000
        })
    }

    const handlePreview = () => {
        fitGridBounds()
    }

    const handleMerge = () => {
        if (pageContext.current.gridName === '') {
            toast.error(t('Please enter a grid name'))
            return
        }
        if (pageContext.current.selectedResources.length > 0) {
            setMergeDialogOpen(true)
        }
    }

    const confirmMerge = async () => {

        const treeger_address = 'http://127.0.0.1:8000'
        const gridInfo: GridInfo = {
            patches: pageContext.current.selectedResources.map((resource) => ({
                node_key: resource,
                treeger_address: treeger_address
            }))
        }
        const response = await createGrid((node as SceneNode), pageContext.current.gridName, gridInfo)

        store.get<{ on: Function; off: Function }>('isLoading')!.off()
        setMergeDialogOpen(false)
        clearDrawPatchBounds()
        resetForm()

        toast.success(t('Created successfully'))

        const tree = node.tree as SceneTree
        await tree.alignNodeInfo(node, true)
        tree.notifyDomUpdate()
    }

    return (
        <div className='w-full h-full flex flex-row'>
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
                                    <SquaresUnite className='h-15 w-15 text-white' />
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
                                {t('Create New Grid')}
                                <span className=' bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1'>{node.tree.isPublic ? t('Public') : t('Private')}</span>
                                <span>[{node.parent?.name}]</span>
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {gridTips.map((tip, index) => (
                                        <li key={index}>
                                            {t(Object.values(tip)[0])}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    {/* ---------------- */}
                    {/* Grid Form */}
                    {/* ---------------- */}
                    <ScrollArea className='h-full max-h-[calc(100vh-14.5rem)]'>
                        <div className='w-2/3 mx-auto mt-4 mb-4 space-y-4 pb-4'>
                            {/* ----------- */}
                            {/* Grid Name */}
                            {/* ----------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    {t('Grid Name')}
                                </h2>
                                <div className='space-y-2'>
                                    <Input
                                        id='name'
                                        value={pageContext.current.gridName}
                                        onChange={(e) => {
                                            pageContext.current.gridName = e.target.value
                                            triggerRepaint()
                                        }}
                                        placeholder={t('Enter new grid name')}
                                        className={`w-full text-black border-gray-300`}
                                    />
                                </div>
                            </div>
                            {/* ----------- */}
                            {/* Patch Drop Zone */}
                            {/* ----------- */}
                            <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4'>
                                <h2 className='text-lg font-semibold mb-2'>
                                    Patch Drop Zone
                                </h2>
                                <div>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-4 transition-all duration-200",
                                            isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        {pageContext.current.selectedResources.length === 0 ? (
                                            <div className="h-[32vh] flex flex-col justify-center items-center text-slate-400">
                                                <Upload className="w-8 h-8 mb-2" />
                                                <p className="text-sm font-medium mb-1">{t('Drag patches here')}</p>
                                                <p className="text-xs text-center">{t('Drop files from the resource manager')}</p>
                                            </div>
                                        ) : (
                                            <div className="h-[32vh] overflow-y-auto pr-1">
                                                <div className="space-y-2">
                                                    {pageContext.current.selectedResources.map((resource, index) => {
                                                        const patchName = resource.split('.').pop();
                                                        return (
                                                            <div
                                                                key={resource}
                                                                className={cn(
                                                                    "bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 hover:shadow-sm transition-all duration-200",
                                                                    highlightedResource === resource && "border-4 border-yellow-300"
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                                            {patchName}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleResourceClick(resource)
                                                                        }}
                                                                    >
                                                                        <MapPin className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="ml-2 h-6 w-6 p-0 hover:text-red-500 cursor-pointer"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleResourceRemove(index);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="flex items-center text-xs text-gray-500 truncate">
                                                                    <span>{resource}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            {pageContext.current.selectedResources.length || 0} {t('patches uploaded')}
                                        </span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white hover:text-white cursor-pointer shadow-sm"
                                            onClick={handleReset}
                                            disabled={pageContext.current.selectedResources.length === 0}
                                        >
                                            <RotateCcw className="w-4 h-4 " />{t('Reset')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-2 justify-end'>
                                <Button
                                    variant="default"
                                    className="bg-blue-500 hover:bg-blue-600 text-white hover:text-white cursor-pointer shadow-sm"
                                    onClick={handlePreview}
                                    disabled={pageContext.current.selectedResources.length === 0}
                                >
                                    <Fullscreen className="w-4 h-4 " />{t('Preview')}
                                </Button>
                                <Button
                                    type='button'
                                    onClick={handleMerge}
                                    className='bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                    disabled={pageContext.current.selectedResources.length === 0}
                                >
                                    <SquaresUnite className='w-4 h-4 ' />
                                    Merge
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className='w-3/5 h-full py-4 pr-4'>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>

            {/* Merge Confirmation Dialog */}
            <AlertDialog
                open={mergeDialogOpen}
                onOpenChange={setMergeDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm Merge Patches
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className='mb-4'>
                                You will merge {pageContext.current.selectedResources.length} patches to create gird <span className='font-bold'>[{pageContext.current.gridName}]</span>
                            </div>
                            <div className='max-h-[200px] overflow-y-auto bg-gray-100 p-3 rounded-lg'>
                                <ul className='list-disc list-inside space-y-1'>
                                    {pageContext.current.selectedResources.map((resource, index) => (
                                        <li key={index} className='text-sm'>
                                            {resource.split('.').pop()} <span className='text-gray-500 text-xs'>({resource})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='cursor-pointer'>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmMerge}
                            className='bg-green-600 hover:bg-green-500 cursor-pointer'
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}