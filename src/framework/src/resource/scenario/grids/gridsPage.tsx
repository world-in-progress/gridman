import React, { useEffect, useReducer, useRef, useState } from 'react'
import { cn } from '@/utils/utils'
import { GridsPageProps } from './types'
import { useTranslation } from 'react-i18next'
import { SquaresUnite, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ISceneNode } from '@/core/scene/iscene'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SceneNode } from '@/components/resourceScene/scene'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import MapContainer from '@/components/mapContainer/mapContainer'
import { GridsPageContext } from './grids'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'

const gridTips = [
    { tip1: 'Drag patches from the resource manager to the upload area.' },
    { tip2: 'Reset button will clear all uploaded patches.' },
    { tip3: 'Click merge button to complete grid creation.' },
]

export default function GridsPage({ node }: GridsPageProps) {
    const { t } = useTranslation("patchesPage")
    const [isDragOver, setIsDragOver] = useState(false)
    // const [selectedResources, setSelectedResources] = useState<string[]>([])
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [schemaName, setSchemaName] = useState('')
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false)

    const pageContext = useRef<GridsPageContext>(new GridsPageContext())

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as GridsPageContext
        setSchemaName(pageContext.current.schemaName)
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false)

        const nodeId = e.dataTransfer.getData("text/plain")
        const patchPath = nodeId.split('.').slice(0, -2).join('.')
        const schemaPath = node.id.split('.').slice(0, -1).join('.')
        if (schemaPath === patchPath) {
            const isAlreadySelected = pageContext.current.selectedResources.some((resource) => resource === nodeId)
            if (!isAlreadySelected) {
                pageContext.current.selectedResources.push(nodeId)
            }
        } else {
            toast.error(`Please select the correct patch on schema ${schemaName} [${schemaPath.split(':')[0]}]`)
        }
    }

    const handleResourceRemove = (index: number) => {
        pageContext.current.selectedResources = pageContext.current.selectedResources.filter((_, i) => i !== index)
        triggerRepaint()
    }

    const handleReset = () => {
        pageContext.current.selectedResources = []
        triggerRepaint()
    }

    const handleMerge = () => {
        if (pageContext.current.selectedResources.length > 0) {
            setMergeDialogOpen(true)
        }
    }

    const confirmMerge = () => {
        console.log(pageContext.current.selectedResources)
        // Actual merge logic  here
        setMergeDialogOpen(false)
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
                    {/* Grid Schema Form */}
                    {/* ---------------- */}
                    <ScrollArea className='h-full max-h-[calc(100vh-14.5rem)]'>
                        <div className='w-2/3 mx-auto mt-4 mb-4 space-y-4 pb-4'>
                            {/* ----------- */}
                            {/* Patch Name */}
                            {/* ----------- */}
                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-white mb-4">Resource Upload Area</h2>
                                <div
                                    className={cn(
                                        "border-2 border-dashed border-gray-600 rounded-lg p-4 min-h-[200px] bg-gray-900 transition-colors",
                                        isDragOver && "border-blue-400 bg-gray-800",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {pageContext.current.selectedResources.length === 0 ? (
                                        <div className="relative min-h-[200px]">
                                            <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-400">
                                                <p className="text-lg mb-2">Drag resources here</p>
                                                <p className="text-sm">Drag files from the left resource manager here</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {pageContext.current.selectedResources.map((resource, index) => (
                                                <div
                                                    key={resource}
                                                    className="bg-gray-800 border border-gray-600 rounded-lg p-3 flex items-center justify-between group hover:bg-gray-700 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{resource.split('.').pop()}</p>
                                                        <p className="text-gray-400 text-xs truncate">{resource}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white cursor-pointer"
                                                        onClick={() => handleResourceRemove(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    type='button'
                                    variant="secondary"
                                    onClick={handleReset}
                                    className="bg-gray-600 hover:bg-gray-500 text-white cursor-pointer"
                                >
                                    Reset
                                </Button>
                                <Button
                                    type='button'
                                    onClick={handleMerge}
                                    className="bg-green-600 hover:bg-green-500 text-white cursor-pointer"
                                    disabled={pageContext.current.selectedResources.length === 0}
                                >
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
                            <div className="mb-4">
                                You will merge {pageContext.current.selectedResources.length} patches:
                            </div>
                            <div className="max-h-[200px] overflow-y-auto bg-gray-100 p-3 rounded-lg">
                                <ul className="list-disc list-inside space-y-1">
                                    {pageContext.current.selectedResources.map((resource, index) => (
                                        <li key={index} className="text-sm">
                                            {resource.split('.').pop()} <span className="text-gray-500 text-xs">({resource})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmMerge}
                            className="bg-green-600 hover:bg-green-500 cursor-pointer"
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
