import React, { useEffect, useRef, useState, useReducer, useMemo, useCallback } from 'react'
import { LUMData, LumsPageProps } from './types'

import * as apis from '@/core/apis/apis'
import {
    FilePlus2,
    RotateCcw,
    FolderOpen,
    Globe,
    Palette,
    X,
} from "lucide-react"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LumsPageContext } from './lums'
import { SceneNode } from '@/components/resourceScene/scene'
import MapContainer from '@/components/mapContainer/mapContainer'
import { cn } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import store from '@/store'

export default function LumsPage({ node }: LumsPageProps) {

    const pageContext = useRef<LumsPageContext | null>(null)
    const { t } = useTranslation('lumsPage')
    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [showLumDialog, setShowLumDialog] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    // const [lumInfo, setLumInfo] = useState<{
    //     name: string,
    //     path: string
    // }>({
    //     name: '',
    //     path: ''
    // })

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as LumsPageContext
        if (pageContext.current.hasLUM) {
            setShowLumDialog(false)
        } else {
            setShowLumDialog(true)
        }
        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const handleLumInfoConfirm = async () => {
        if (pageContext.current && pageContext.current.rawLumInfo.name.trim() && pageContext.current.rawLumInfo.path.trim()) {
            pageContext.current.hasLUM = true
            setShowLumDialog(false)
            triggerRepaint()
        }

        const newLUM: LUMData = {
            name: pageContext.current!.rawLumInfo.name,
            path: pageContext.current!.rawLumInfo.path,
        }

        store.get<{on: Function, off: Function}>('isLoading')!.on()
        const createCogTifRes = await apis.raster.createRaster.fetch(newLUM, node.tree.isPublic)

        if (!createCogTifRes.success) {
            toast.error(createCogTifRes.message)
            return
        }

        const getCogTifRes = await apis.raster.getCogTif.fetch(newLUM.name, node.tree.isPublic)

        if (!getCogTifRes.success) {
            toast.error(getCogTifRes.message)
        } else {
            store.get<{on: Function, off: Function}>('isLoading')!.off()
            toast.success('getCogTifRes.message')
        }
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
        console.log(nodeKey.split('.')[1])
        if (nodeKey.split('.')[1] === 'vectors') {
            const isAlreadySelected = pageContext.current?.uploadVectors.some((resource) => resource === nodeKey)
            if (!isAlreadySelected) {
                pageContext.current?.uploadVectors.push(nodeKey)
                // TODO:add vector to map
                triggerRepaint()
            }
        } else {
            toast.error('Please select the correct feature in vectors')
        }
    }

    const handleVectorRemove = (index: number) => {
        // const resourceKey = pageContext.current.selectedResources[index]
        // const patchName = resourceKey.split('.').pop()!

        // clearBoundsById(patchName)

        // delete pageContext.current.patchesBounds[patchName]

        // pageContext.current.selectedResources = pageContext.current.selectedResources.filter((_, i) => i !== index)

        triggerRepaint()
    }

    const handleVectorClick = (resourceKey: string) => {
        const patchName = resourceKey.split('.').pop()!

        // if (pageContext.current.patchesBounds[patchName]) {
        //     const patchBoundsOn4326 = convertToWGS84(
        //         pageContext.current.patchesBounds[patchName],
        //         pageContext.current.schema.epsg.toString()
        //     )
        //     highlightPatchBounds(patchBoundsOn4326, patchName)
        // }
    }

    const handleReset = () => {
        setShowResetConfirm(true)
    }

    const confirmReset = () => {
        if (pageContext.current) {
            // 重置LUM信息
            pageContext.current.rawLumInfo = {
                name: '',
                path: ''
            }
            pageContext.current.uploadVectors = []
            pageContext.current.hasLUM = false // 重置标志
            pageContext.current.rawLumInfo = {
                name: '',
                path: ''
            }
            setShowLumDialog(true)
            setShowResetConfirm(false)
            triggerRepaint()
        }
    }

    const handleFileSelect = useCallback(async () => {
        console.log(window.electronAPI)
        if (window.electronAPI && typeof window.electronAPI.openTiffFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openTiffFileDialog();
                if (filePath) {
                    if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
                        console.log('Selected file path:', filePath);
                        pageContext.current!.rawLumInfo.path = filePath
                        triggerRepaint()
                    } else {
                        toast.error('Please select a TIF file');
                    }
                }
            } catch (error) {
                console.error('Error opening file dialog:', error);
                toast.error('Failed to open file dialog');
            }
        } else {
            toast.error('File selection is not available');
        }
    }, []);

    const handleDialogOpenChange = (open: boolean) => {
        setShowLumDialog(open)
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
            <AlertDialog open={showLumDialog} onOpenChange={handleDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create New LUM</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please fill in the basic information for the LUM
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={pageContext.current?.rawLumInfo.name}
                                onChange={(e) => {
                                    pageContext.current!.rawLumInfo.name = e.target.value
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
                                    value={pageContext.current?.rawLumInfo.path}
                                    readOnly={true}
                                    onChange={(e) => {
                                        pageContext.current!.rawLumInfo.path = e.target.value
                                        triggerRepaint()
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    variant="secondary"
                                    className='cursor-pointer'
                                    size="icon"
                                    onClick={handleFileSelect}
                                    title="Browse file"
                                >
                                    <FolderOpen className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLumInfoConfirm}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Reset</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reset the LUM editor? All unsaved content will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReset} className="bg-red-500 hover:bg-red-600">
                            Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="w-full flex-1 relative">
                <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">
                    {/* Header */}
                    <div className="p-6 bg-white border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FilePlus2 className='w-4 h-4' />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-slate-900">LUM Editor</h2>
                                <p className="text-sm text-slate-500">Edit Details</p>
                            </div>
                            {pageContext.current?.hasLUM && (
                                <Button
                                    variant="destructive"
                                    className='cursor-pointer bg-red-500 hover:bg-red-600'
                                    size="sm"
                                    onClick={handleReset}
                                >
                                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                        {!pageContext.current?.hasLUM ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="gap-2 cursor-pointer"
                                    onClick={() => setShowLumDialog(true)}
                                >
                                    <FilePlus2 className="w-4 h-4" />
                                    Create New LUM
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Feature Type Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="space-y-6">
                                        {/* Visual Properties Section */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Palette className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Visual Properties</span>
                                            </div>
                                            <div className="ml-6 space-y-3">
                                                {/* Name */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-600">Name</span>
                                                    <div className="flex items-center gap-2 mr-1">
                                                        <span className="font-semibold text-slate-900">
                                                            {pageContext.current?.rawLumInfo.name || "LUM"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* type */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-600">Type</span>
                                                    <div className="flex items-center gap-2">
                                                        <FilePlus2 className='w-4 h-4' />
                                                        <Badge variant="secondary" className={`text-xs font-semibold`}>
                                                            LUM
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-slate-100"></div>

                                        {/* Technical Details Section */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Globe className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Technical Details</span>
                                            </div>
                                            <div className="ml-6 space-y-4">

                                                {/* Resource Key */}
                                                <div>
                                                    <span className="text-sm text-slate-600">Resource Path</span>
                                                    <div className="bg-slate-100 rounded-lg p-2 mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="w-3 h-3 text-slate-500" />
                                                            <code className="text-xs font-mono text-slate-700 truncate">
                                                                {pageContext.current?.rawLumInfo.path || ''}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vectors Upload Area */}
                                <Card className="border-slate-200 shadow-sm mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-medium">Vectors Upload Area</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className={cn(
                                                'border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-200 transition-colors',
                                                isDragOver && 'border-blue-400 bg-gray-100',
                                            )}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {pageContext.current?.uploadVectors.length === 0 ? (
                                                <div className='relative min-h-[200px]'>
                                                    <div className='absolute inset-0 flex flex-col justify-center items-center text-gray-400'>
                                                        <p className='text-lg mb-2'>Drag resources here</p>
                                                        <p className='text-sm'>Drag files from the left resource manager here</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-col space-y-3">
                                                    {pageContext.current.uploadVectors.map((resource, index) => (
                                                        <div
                                                            key={resource}
                                                            className="bg-gray-100 border border-gray-300 rounded-lg p-3 flex items-center justify-between group hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-700 text-sm font-medium truncate">{resource.split('.').pop()}</p>
                                                                <p className="text-gray-500 text-xs truncate">{resource}</p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white cursor-pointer"
                                                                onClick={() => handleVectorRemove(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
                {/* Map container placeholder */}
                <MapContainer node={node} style='w-full h-full' />
            </div>
        </div>
    )
}