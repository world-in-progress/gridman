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
import { Button } from "@/components/ui/button"
import { DemsPageContext } from './dems'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SceneNode } from "@/components/resourceScene/scene"
import { convertCoordinate } from '@/components/mapContainer/utils'
import { FilePlus2, FolderOpen, Loader2Icon, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import store from '@/store'
import TerrainByProxyTile from './terrainLayer/terrainLayer'

export default function DemsPage({ node }: DemsPageProps) {

  const [, triggerRepaint] = useReducer(x => x + 1, 0)

  const pageContext = useRef<DemsPageContext | null>(null)

  const map = store.get<mapboxgl.Map>("map")

  const terrainLayer = useRef<TerrainByProxyTile | null>(null)

  const [showDemDialog, setShowDemDialog] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [demData, setDemData] = useState<{
    name: string,
    path: string
  }>({
    name: '',
    path: ''
  })

  const nodeKey = node.key + '.' + demData.name
  const isPublic = node.tree.isPublic

  useEffect(() => {
    loadContext(node as SceneNode)
  }, [node])

  useEffect(() => {
    const removeDEMLayer = () => {
      if (!map) return
      const demName = pageContext.current!.demData.name
      // map.current.removeLayer(demName + 'layer')
      // map.current.removeSource(demName + 'source')
      map.removeLayer(demName);
      terrainLayer.current = null;
    }

    return () => {
      removeDEMLayer()
    }
  }, [map])

  const loadContext = async (node: SceneNode) => {
    pageContext.current = await node.getPageContext() as DemsPageContext
    const pc = pageContext.current
    if (pc.hasDEM) {
      setDemData(pc.demData)
    } else {
      setShowDemDialog(true)
    }
    triggerRepaint()
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    if (pageContext.current) {
      pageContext.current.demData = {
        name: '',
        path: ''
      }
      pageContext.current.hasDEM = false
      pageContext.current.bbox = []
      setShowDemDialog(true)
      setShowResetConfirm(false)
      triggerRepaint()
    }
  }

  const addDEMLayer = () => {
    if (!map) return

    const demName = pageContext.current!.demData.name
    const tileUrl = apis.raster.getTileUrl(isPublic, nodeKey, 'terrainrgb', new Date().getTime().toString())
    terrainLayer.current = new TerrainByProxyTile(demName, tileUrl, demName, pageContext.current!.bbox)
    map.addLayer(terrainLayer.current);
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

    console.log(newDEM)

    const createRasterRes = await apis.raster.createRaster.fetch({
      name: newDEM.name,
      original_tif_path: newDEM.path,
      type: "dem"
    }, isPublic)
    if (!createRasterRes.success) {
      console.log(createRasterRes)
      toast.error('Failed to create DEM')
      return
    }

    const getCogTifRes = await apis.raster.getCogTif.fetch(nodeKey, isPublic)
    if (!getCogTifRes.success) {
      console.log(getCogTifRes)
      toast.error('Failed to create DEM')
      return
    }

    const getDemMetaRes = await apis.raster.getRasterMetaData.fetch(nodeKey, isPublic)
    if (!getDemMetaRes.success) {
      console.log(getDemMetaRes)
      toast.error('Failed to get DEM meta data')
      return
    }
    const bbox = getDemMetaRes.data.bbox
    const LB = convertCoordinate(bbox[0], bbox[1], '2326', '4326')
    const TR = convertCoordinate(bbox[2], bbox[3], '2326', '4326')
    if (LB && TR) {
      const bbox84 = [LB.x, LB.y, TR.x, TR.y]
      pageContext.current!.bbox = bbox84
    } else {
      toast.error('Failed to get bounding box')
    }

    setIsCreating(false)

    setShowDemDialog(false)
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
      <Dialog open={showDemDialog} onOpenChange={setShowDemDialog}>
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
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowDemDialog(false)}>
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

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the DEM editor? All unsaved content will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex gap-6'>
            <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-red-500 hover:bg-red-600 cursor-pointer"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-80 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl z-40 flex flex-col border-r border-slate-200">

        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FilePlus2 className='w-4 h-4' />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">DEM Editor</h2>
              <p className="text-sm text-slate-500">Edit Details</p>
            </div>
            {pageContext.current?.hasDEM && (
              <Button
                variant="destructive"
                className='cursor-pointer bg-red-500 hover:bg-red-600 shadow-sm'
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
        {/* <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {pageContext.current?.hasDEM && (
            <>

            </>
          )}
        </div> */}
      </div>

      {/* Map container placeholder */}
      <MapContainer node={node} style='flex-1 bg-slate-700 relative' />
    </div>
  )
}
