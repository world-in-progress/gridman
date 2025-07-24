import React, { useEffect, useRef, useState, useReducer, useMemo, useCallback } from 'react'
import { LumsPageProps } from './types'
import {
    Dot,
    Move,
    Save,
    Redo,
    Undo,
    Minus,
    Square,
    Trash2,
    FilePlus2,
    RotateCcw,
    Paintbrush,
    FolderOpen,
    MousePointer,
    Globe,
    Palette,
    Mouse,
    X,
} from "lucide-react"
import {
    Table,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
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
import {
    ColumnDef,
    flexRender,
    SortingState,
    useReactTable,
    getCoreRowModel,
    VisibilityState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from '@tanstack/react-table'
import { toast } from 'sonner'

export default function LumsPage({ node }: LumsPageProps) {

    const pageContext = useRef<LumsPageContext | null>(null)
    const { t } = useTranslation('lumsPage')
    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [showLumDialog, setShowLumDialog] = useState(true)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [lumInfo, setLumInfo] = useState<{
        name: string,
        epsg: string,
        sourceKey: string
    }>({
        name: '',
        epsg: '',
        sourceKey: ''
    })

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as LumsPageContext
        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const handleLumInfoConfirm = () => {
        if (pageContext.current && lumInfo.name.trim() && lumInfo.epsg.trim()) {
            pageContext.current.lumInfo = lumInfo
            pageContext.current.hasLUM = true // 添加这个标志
            setShowLumDialog(false)
            triggerRepaint()
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
            pageContext.current.lumInfo = {
                name: '',
                epsg: '',
                sourceKey: ''
            }
            pageContext.current.uploadVectors = []
            pageContext.current.hasLUM = false // 重置标志
            setLumInfo({
                name: '',
                epsg: '',
                sourceKey: ''
            })
            setShowLumDialog(true)
            setShowResetConfirm(false)
            triggerRepaint()
        }
    }

    // 处理文件选择
    const handleFileSelect = useCallback(async () => {
        console.log(window.electronAPI)
        if (window.electronAPI && typeof window.electronAPI.openTiffFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openTiffFileDialog();
                if (filePath) {
                    // 检查是否为tif格式
                    if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
                        console.log('Selected file path:', filePath);
                        setLumInfo({ ...lumInfo, sourceKey: filePath });
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
    }, [lumInfo]);

    // 在对话框关闭时的处理
    const handleDialogOpenChange = (open: boolean) => {
        setShowLumDialog(open)
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
            {/* LUM创建对话框 */}
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
                                value={lumInfo.name}
                                onChange={(e) => setLumInfo({ ...lumInfo, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="epsg" className="text-right">
                                EPSG
                            </Label>
                            <Input
                                id="epsg"
                                value={lumInfo.epsg}
                                onChange={(e) => setLumInfo({ ...lumInfo, epsg: e.target.value })}
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
                                    value={lumInfo.sourceKey}
                                    onChange={(e) => setLumInfo({ ...lumInfo, sourceKey: e.target.value })}
                                    className="flex-1"
                                />
                                <Button 
                                    variant="secondary" 
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

            {/* 重置确认对话框 */}
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
                                    className="gap-2"
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
                                                            {pageContext.current?.lumInfo.name || "LUM"}
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
                                                {/* EPSG */}
                                                <div>
                                                    <span className="text-sm text-slate-600">Coordinate System</span>
                                                    <div className="bg-slate-100 rounded-lg p-2 mt-1">
                                                        <code className="text-xs font-mono text-slate-700">
                                                            EPSG: {pageContext.current?.lumInfo.epsg || '4326'}
                                                        </code>
                                                    </div>
                                                </div>

                                                {/* Resource Key */}
                                                <div>
                                                    <span className="text-sm text-slate-600">Resource Path</span>
                                                    <div className="bg-slate-100 rounded-lg p-2 mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="w-3 h-3 text-slate-500" />
                                                            <code className="text-xs font-mono text-slate-700 truncate">
                                                                {pageContext.current?.lumInfo.sourceKey || ''}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* Current Tool Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Mouse className="w-4 h-4 text-slate-600" />
                                            <Label className="text-sm font-medium text-slate-700">Active Tool</Label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 -mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 bg-slate-100 rounded-lg`}>
                                                {React.createElement(MousePointer, {
                                                    className: `w-4 h-4 text-slate-600`
                                                })}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-900">
                                                    Unknown Tool
                                                </span>
                                                <p className="text-xs text-slate-500">
                                                    Unknown Tool
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* Vectors Upload Area */}
                                <div className='mb-6'>
                                    <h2 className='text-lg font-medium mb-4'>Vectors Upload Area</h2>
                                    <div
                                        className={cn(
                                            'border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-900 transition-colors',
                                            isDragOver && 'border-blue-400 bg-gray-800',
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
                                            <ResourceTable
                                                resources={pageContext.current?.uploadVectors || []}
                                                onResourceClick={handleVectorClick}
                                                onResourceRemove={handleVectorRemove}
                                            />
                                        )}
                                    </div>
                                </div>
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



function ResourceTable({
    resources,
    onResourceClick,
    onResourceRemove,
}: {
    resources: string[],
    onResourceClick: (resource: string) => void,
    onResourceRemove: (index: number) => void
}) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [refreshKey, forceRefresh] = useReducer(x => x + 1, 0)

    const data = React.useMemo(() =>
        resources.map((resource, index) => ({
            id: index.toString(),
            resource: resource,
            name: resource.split('.').pop() || '',
            path: resource
        })),
        [resources, refreshKey])

    useEffect(() => {
        forceRefresh()
    }, [resources.length])

    const columns = React.useMemo<ColumnDef<{ id: string, resource: string, name: string, path: string }>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Resource Name',
            cell: ({ row }) => (
                <div className='font-medium text-white'>
                    {row.getValue('name')}
                </div>
            ),
        },
        {
            accessorKey: 'path',
            header: 'Resource Path',
            cell: ({ row }) => (
                <div className='text-gray-400 text-xs truncate max-w-[300px]'>
                    {row.getValue('path')}
                </div>
            ),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const index = parseInt(row.original.id)

                return (
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-red-500 hover:text-white text-white cursor-pointer'
                        onClick={(e) => {
                            e.stopPropagation()
                            onResourceRemove(index)
                        }}
                    >
                        <X className='h-4 w-4' />
                        <span className='sr-only'>Remove resource</span>
                    </Button>
                )
            },
        },
    ], [onResourceClick, onResourceRemove])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    return (
        <div className='w-full min-h-[200px] text-white'>
            <div className='rounded-md'>
                <Table>
                    <TableHeader className='bg-[#101828]'>
                        <TableRow className='border-gray-700 hover:bg-[#101828] text-lg'>
                            <TableHead className='text-gray-300 font-bold w-1/3'>Patch Name</TableHead>
                            <TableHead className='text-gray-300 font-bold w-2/3'>Patch Path</TableHead>
                            <TableHead className='text-gray-300 font-bold w-[50px]'></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className='border-gray-700 hover:bg-gray-700 cursor-pointer'
                                    onClick={() => onResourceClick(row.original.resource)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'
                                >
                                    No resources available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}