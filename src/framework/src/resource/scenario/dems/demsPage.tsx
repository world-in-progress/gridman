import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { DemData, DemsPageProps } from './types'
import * as apis from '@/core/apis/apis'
import MapContainer from '@/components/mapContainer/mapContainer'
import {
    Dialog,
    DialogTitle,
    DialogFooter,
    DialogContent,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SceneNode } from "@/components/resourceScene/scene"
import { DemsPageContext } from './dems'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FolderOpen, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import store from '@/store'

export default function DemsPage({ node }: DemsPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const pageContext = useRef<DemsPageContext | null>(null)

    const map = useRef<mapboxgl.Map | null>(null)

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const [demData, setDemData] = useState<{
        name: string,
        path: string
    }>({
        name: '',
        path: ''
    })

    useEffect(() => {
        loadContext(node as SceneNode)
    }, [node])


    useEffect(() => {
        map.current = store.get<mapboxgl.Map>("map")
        if (!map.current) return
        return () => {
            removeDEMLayer()
        }
    }, [])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as DemsPageContext
        const pc = pageContext.current
        if (pc.hasDEM) {
            setDemData(pc.demData)
        } else {
            setCreateDialogOpen(true)
        }
        triggerRepaint()
    }

    const addDEMLayer = () => {
        if (!map.current) return
        const demName = pageContext.current!.demData.name
        const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, demName)
        map.current.addSource(demName + 'source', {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            maxzoom: 18,
            minzoom: 0,
            scheme: "xyz",
        })
        map.current.addLayer({
            id: demName + 'layer',
            type: "raster",
            source: demName + 'source',
            paint: {
                "raster-opacity": 0.8,
            },
        })
    }

    const removeDEMLayer = () => {
        if (!map.current) return
        const demName = pageContext.current!.demData.name
        map.current.removeLayer(demName + 'layer')
        map.current.removeSource(demName + 'source')
    }

    const handleCreateDEM = async () => {
        if (!demData.name.trim()
            || !demData.path.trim()
        ) {
            toast.error('Please fill in all fields')
            return
        }

        setIsCreating(true)

        const newDEM: DemData = {
            name: demData.name,
            path: demData.path,
        }

        const createRasterRes = await apis.raster.createRaster.fetch(newDEM, node.tree.isPublic)

        if (!createRasterRes.success) {
            console.log(createRasterRes)
            toast.error('Failed to create DEM')
            return
        }

        const getCogTifRes = await apis.raster.getCogTif.fetch(newDEM.name, false)

        if (!getCogTifRes.success) {
            console.log(getCogTifRes)
            toast.error('Failed to create DEM')
            return
        }

        setIsCreating(false)

        setCreateDialogOpen(false)
        pageContext.current!.hasDEM = true
        pageContext.current!.demData = newDEM

        triggerRepaint()

        addDEMLayer()
    }

    const handleFileSelect = useCallback(async () => {
        console.log(window.electronAPI)
        if (window.electronAPI && typeof window.electronAPI.openTiffFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openTiffFileDialog();
                if (filePath) {
                    if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
                        console.log('Selected file path:', filePath);
                        setDemData({ ...demData, path: filePath });
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
    }, [demData]);

    return (
        <div className="flex w-full relative bg-gray-50" >
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                                value={demData?.name}
                                onChange={(e) => {
                                    setDemData({ ...demData, name: e.target.value })
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
                                    value={demData?.path}
                                    onChange={(e) => setDemData({ ...demData, path: e.target.value })}
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
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" className="cursor-pointer" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="cursor-pointer"
                            onClick={handleCreateDEM}
                            disabled={false}
                        >
                            {isCreating && <Loader2Icon className="animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {pageContext.current?.hasDEM && (
                <div className="w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">

                </div>
            )}

            {/* Map container placeholder */}
            <MapContainer node={node} style='flex-1 bg-slate-700 relative' />
        </div>
    )
}
