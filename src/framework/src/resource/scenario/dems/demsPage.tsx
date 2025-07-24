import { useEffect, useReducer, useRef, useState } from 'react'
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

export default function DemsPage({ node }: DemsPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const pageContext = useRef<DemsPageContext | null>(null)
    const [demData, setDemData] = useState<DemData | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        loadContext(node as SceneNode)
    }, [node])

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

    const handleCreateDEM = async () => {
        setIsCreating(true)
        if (!pageContext.current!.demData.name.trim()
            || !pageContext.current!.demData.path.trim()
        ) {
            return
        }

        const newDEM: DemData = {
            name: pageContext.current!.demData.name,
            path: pageContext.current!.demData.path,
        }

        const createRasterRes = await apis.raster.createRaster.fetch({
            name: newDEM.name,
            path: 'D:/WebGIS/Projects/NHGrid/HK_dem/HK_dem/DigitalTerrainModel.tif',
        }, false)

        if (!createRasterRes.success) {
            console.log(createRasterRes)
            return
        }

        const getCogTifRes = await apis.raster.getCogTif.fetch(newDEM.name, false)

        if (!getCogTifRes.success) {
            console.log(getCogTifRes)
            return
        }

        setIsCreating(false)

        setDemData(newDEM)
        setCreateDialogOpen(false)
        pageContext.current!.hasDEM = true
        pageContext.current!.demData = newDEM

        triggerRepaint()
    }

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
                                value={pageContext.current?.demData.name}
                                onChange={(e) => {
                                    pageContext.current!.demData.name = e.target.value
                                    triggerRepaint()
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
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById("savePath")?.click()}
                                className="w-full justify-start text-muted-foreground cursor-pointer"
                            >
                                {pageContext.current?.demData.path || "Select folder for saving"}
                                <FolderOpen className="w-4 h-4 ml-auto" />
                            </Button>
                            <Input
                                id="savePath"
                                type="file"
                                value={pageContext.current?.demData.path}
                                onChange={(e) => {
                                    pageContext.current!.demData.path = e.target.value
                                    triggerRepaint()
                                }}
                                className="hidden"
                                accept=".tif, .tiff"
                            />
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
            <div className="w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">

            </div>

            {/* Map container placeholder */}
            <MapContainer node={node} style='flex-1 bg-slate-700 relative' />
        </div>
    )
}
