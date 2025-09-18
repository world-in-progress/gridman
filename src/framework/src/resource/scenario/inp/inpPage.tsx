import { useState, useEffect, useReducer, useRef } from 'react'
import { InpPageContext } from './inp'
import { InpPageProps } from './types'
import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogTrigger,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Badge } from "@/components/ui/badge"
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from "@/components/ui/card"
import { SceneNode } from '@/components/resourceScene/scene'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Crosshair, Delete, Fullscreen, GitBranch, Info } from 'lucide-react'
import { clearSwmmFromMap, loadInpAndRenderSwmm, enableSwmmIdentify, disableSwmmIdentify, SwmmFeatureInfo, setSwmmOpacity } from './utils'

export default function InpPage({ node }: InpPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<InpPageContext | null>(null)
    const [identifyActive, setIdentifyActive] = useState(false)
    const [selectedFeature, setSelectedFeature] = useState<SwmmFeatureInfo | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as InpPageContext

        const inpData = pageContext.current.inpData.data

        console.log(inpData)

        loadInpAndRenderSwmm(inpData, {
            fromEPSG: '2326',
            toEPSG: '4326',
            idPrefix: 'swmm',
            fit: true,
        })

        triggerRepaint()
    }

    const unloadContext = () => {
        clearSwmmFromMap()
    }

    const handleDeleteLUM = () => {
        console.log('delete inp')
    }

    const fitInpBounds = () => {
        console.log('fit inp bounds')
    }

    useEffect(() => {
        if (identifyActive) {
            enableSwmmIdentify({ idPrefix: 'swmm', onSelect: setSelectedFeature, showPopup: true })
        } else {
            disableSwmmIdentify()
            setSelectedFeature(null)
        }
        return () => {
            disableSwmmIdentify()
        }
    }, [identifyActive])

    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[20vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <GitBranch className='w-6 h-6' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">LUM Editor</h2>
                            <p className="text-sm text-slate-500">Edit Details</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant='destructive'
                                        className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                    >
                                        <Delete className="w-4 h-4 rotate-180" />Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure to delete this LUM?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this LUM.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className='cursor-pointer border border-gray-300'>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className='bg-red-500 hover:bg-red-600 cursor-pointer'
                                            onClick={handleDeleteLUM}
                                        >
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button
                                className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
                                onClick={fitInpBounds}
                            >
                                <Fullscreen className="w-4 h-4" />Scale
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* LUM Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">LUM Information</span>
                                <div className="ml-auto">
                                    <Button
                                        className={`cursor-pointer shadow-sm h-8 w-8 ${identifyActive ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-300 hover:bg-sky-300'}`}
                                        onClick={() => {
                                            setIdentifyActive(!identifyActive)
                                        }}
                                        title="Identify SWMM Feature"
                                    >
                                        <Crosshair className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="ml-6 space-y-2">
                                {/* Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Name</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <span className="font-semibold text-slate-900">
                                            {node.name}
                                        </span>
                                    </div>
                                </div>
                                {/* Opacity */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Opacity</span>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Math.round(pageContext.current?.inpOpacity! * 100)]}
                                            max={100}
                                            step={5}
                                            className='w-36 cursor-pointer'
                                            onValueChange={(value) => {
                                                const opacity = Math.round(value[0]) / 100;
                                                pageContext.current!.inpOpacity = opacity;
                                                setSwmmOpacity(opacity, 'swmm')
                                                triggerRepaint();
                                            }}
                                        />
                                        <Badge variant="secondary" className={`w-10 text-xs font-semibold`}>
                                            {Math.round(pageContext.current?.inpOpacity! * 100)}%
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Feature identification info */}
                            {identifyActive && selectedFeature && (
                                <>
                                    <div className="flex items-center gap-2 mb-2 mt-4 border-t border-slate-100 pt-4">
                                        <Crosshair className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Feature Identification</span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Lng:</span>
                                            <span className="text-sm font-medium">{selectedFeature.lngLat[0].toFixed(6)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Lat:</span>
                                            <span className="text-sm font-medium">{selectedFeature.lngLat[1].toFixed(6)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Type:</span>
                                            <Badge variant="secondary">{selectedFeature.kind}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">ID:</span>
                                            <span className="text-sm font-medium">{selectedFeature.id}</span>
                                        </div>
                                        {selectedFeature.kind === 'conduit' && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">From:</span>
                                                    <span className="text-sm font-medium">{selectedFeature.fromId || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">To:</span>
                                                    <span className="text-sm font-medium">{selectedFeature.toId || '-'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={node} style='w-full h-full' />
            </div>
        </div>
    )
}
