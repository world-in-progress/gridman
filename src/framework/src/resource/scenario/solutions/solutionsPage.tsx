import React, { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Dam,
    Eye,
    EyeOff,
    Info,
    MapPin,
    Upload,
    RotateCcw,
    TrafficCone,
    Box,
    BrushCleaning,
    CheckCircle,
    SquaresUnite,
    Mountain,
    MountainSnow,
    TentTree,
    CloudRainWind,
    Construction,
    Waves,
    Clipboard,
    Table,
    Fullscreen,
} from "lucide-react"
import * as apis from '@/core/apis/apis'
import { SolutionsPageProps } from './types'
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { cn } from '@/utils/utils'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { SolutionsPageContext } from './solutions'
import { toast } from 'sonner'
import store from '@/store'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RasterMeta, SolutionMeta } from '@/core/apis/types'
import dynamic from 'next/dynamic'
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
import { convertCoordinate, convertToWGS84 } from '@/components/mapContainer/utils'
import TerrainByProxyTile from '../dem/terrainLayer/terrainLayer'
import { clearSwmmFromMap, loadInpAndRenderSwmm, setSwmmOpacity } from '../inp/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'


const REORDER_TYPE = 'application/x-lum-reorder'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function SolutionsPage({ node }: SolutionsPageProps) {

    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<SolutionsPageContext | null>(null)
    const [resetFormDialogOpen, setResetFormDialogOpen] = useState(false)
    const [resetDropZoneDialogOpen, setResetDropZoneDialogOpen] = useState(false)

    const [dataDialogOpen, setDataDialogOpen] = useState(false)
    const [dataDialogTitle, setDataDialogTitle] = useState('')
    const [dataDialogOption, setDataDialogOption] = useState<any>(null)

    const terrainLayer = useRef<TerrainByProxyTile | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {

        const map = store.get<mapboxgl.Map>('map')

        pageContext.current = await node.getPageContext() as SolutionsPageContext


        map!.once('style.load', () => {
            if (pageContext.current?.solutionData.env.dem_node_key) {
                addDEMLayer(map!, pageContext.current!.solutionData.env.dem_node_key)
            }

            if (pageContext.current?.solutionData.env.lum_node_key) {
                addLUMLayer(map!, pageContext.current!.solutionData.env.lum_node_key)
            }
        })

        if (pageContext.current?.solutionData.env.inp_node_key) {
            loadInpAndRenderSwmm(pageContext.current!.inpData!, {
                fromEPSG: '2326',
                toEPSG: '4326',
                idPrefix: 'swmm',
                fit: false,
            })
        }

        triggerRepaint()
    }

    const openDataDialog = async (type: 'rainfall' | 'tide') => {
        const isPublic = (node as SceneNode).tree.isPublic
        const nodeKey =
            type === 'rainfall'
                ? pageContext.current?.solutionData?.env.rainfall_node_key
                : pageContext.current?.solutionData?.env.tide_node_key

        if (!nodeKey) {
            toast.error(type === 'rainfall' ? 'Please select Rainfall first' : 'Please select Tide first')
            return
        }

        try {
            store.get<{ on: Function, off: Function }>('isLoading')!.on()
            const res = await apis.common.getCommonData.fetch(nodeKey, isPublic)
            if (!res?.success || !res?.data?.data) {
                toast.error(res?.message || 'Failed to get data')
                return
            }

            const lines = res.data.data as string[]
            if (!Array.isArray(lines) || lines.length < 2) {
                toast.error('Data is empty')
                return
            }

            if (type === 'rainfall') {
                const parsed = lines.slice(1)
                    .map(line => line.split(','))
                    .filter(v => v.length >= 3)
                    .map(v => ({ DateTime: v[0], Station: v[1], rainfall: parseFloat(v[2]) || 0 }))

                const stations = Array.from(new Set(parsed.map(d => d.Station)))

                const lineSeries = stations.map(station => {
                    const stationData = parsed
                        .filter(d => d.Station === station)
                        .sort((a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime())
                        .map(d => [d.DateTime, d.rainfall])
                    return {
                        name: station,
                        type: 'line',
                        data: stationData,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 4,
                        lineStyle: { width: 2 },
                        areaStyle: { opacity: 0.15 },
                    }
                })

                const barSeries = stations.map(station => {
                    const stationData = parsed
                        .filter(d => d.Station === station)
                        .sort((a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime())
                        .map(d => [d.DateTime, d.rainfall])
                    return {
                        name: station + ' Bar',
                        type: 'bar',
                        data: stationData,
                        yAxisIndex: 1,
                        barWidth: '60%',
                        itemStyle: { color: '#91cc75', opacity: 0.6 },
                        emphasis: { focus: 'series' },
                        tooltip: { valueFormatter: (value: number) => `${value} mm` },
                    }
                })

                const legendSelected = stations.reduce((acc: Record<string, boolean>, s) => {
                    acc[s] = true
                    acc[s + ' Bar'] = false
                    return acc
                }, {})

                const option = {
                    title: { text: 'Rainfall and Flow Relationship', subtext: 'All Data', left: 'center' },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } },
                    },
                    legend: {
                        data: stations.map(s => [s, s + ' Bar']).flat(),
                        top: 50,
                        type: 'scroll',
                        selected: legendSelected,
                    },
                    grid: { left: '3%', right: '4%', bottom: '15%', top: '25%', containLabel: true },
                    toolbox: {
                        feature: {
                            saveAsImage: {},
                            dataZoom: { yAxisIndex: 'none' },
                            restore: {},
                            dataView: {},
                        },
                        right: '2%'
                    },
                    axisPointer: { link: { xAxisIndex: 'all' } },
                    dataZoom: [
                        { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, filterMode: 'filter' },
                        { type: 'inside', xAxisIndex: [0], start: 0, end: 100, filterMode: 'filter' },
                    ],
                    xAxis: {
                        type: 'time',
                        boundaryGap: false,
                        axisLine: { onZero: false },
                    },
                    yAxis: [
                        { name: 'Rainfall (mm)', type: 'value', position: 'left', alignTicks: true },
                        { name: 'Flow', type: 'value', position: 'right', alignTicks: true },
                    ],
                    series: [...lineSeries, ...barSeries],
                }

                setDataDialogTitle('Rainfall Data')
                setDataDialogOption(option)
            } else {
                const parsed = lines.slice(1)
                    .map((line) => line.split(','))
                    .filter((v) => v.length >= 3)
                    .map((v) => ({ date: (v[0] || '').trim(), time: (v[1] || '').trim(), value: parseFloat(v[2] || '0') || 0 }))

                const toMinutesOfDay = (dateStr: string, timeStr: string) => {
                    const [h, m, s] = timeStr.split(':').map(n => parseInt(n || '0', 10))
                    return h * 60 + m + (s || 0) / 60
                }
                const dates = Array.from(new Set(parsed.map(d => d.date)))
                const series = dates.map(d => {
                    const dateData = parsed
                        .filter(x => x.date === d)
                        .sort((a, b) => toMinutesOfDay(a.date, a.time) - toMinutesOfDay(b.date, b.time))
                        .map(x => [toMinutesOfDay(x.date, x.time), x.value])
                    return {
                        name: d,
                        type: 'line',
                        data: dateData,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 4,
                        lineStyle: { width: 2 },
                        areaStyle: { opacity: 0.15 },
                        emphasis: { focus: 'series' }
                    }
                })

                const option = {
                    title: { text: 'Tide Data Visualization', subtext: 'All Data', left: 'center' },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            animation: false,
                            label: {
                                backgroundColor: '#505765',
                                formatter: (params: any) => {
                                    const minutes = Number(params.value)
                                    const h = Math.floor(minutes / 60)
                                    const m = Math.floor(minutes % 60)
                                    return `${h}:${m.toString().padStart(2, '0')}`
                                }
                            }
                        },
                    },
                    legend: { data: dates, top: 50, type: 'scroll' },
                    grid: { left: '3%', right: '4%', bottom: '15%', top: '25%', containLabel: true },
                    toolbox: {
                        feature: { saveAsImage: {}, dataZoom: { yAxisIndex: 'none' }, restore: {}, dataView: {} },
                        right: '2%'
                    },
                    dataZoom: [
                        { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, filterMode: 'filter' },
                        { type: 'inside', xAxisIndex: [0], start: 0, end: 100, filterMode: 'filter' },
                    ],
                    xAxis: {
                        type: 'value',
                        min: 0,
                        max: 1440,
                        boundaryGap: false,
                        axisLabel: {
                            formatter: (value: number) => {
                                const minutes = Math.floor(value)
                                const h = Math.floor(minutes / 60)
                                const m = Math.floor(minutes % 60)
                                return `${h}:${m.toString().padStart(2, '0')}`
                            }
                        }
                    },
                    yAxis: { name: 'Tide (m)', type: 'value', position: 'left', alignTicks: true },
                    series
                }

                setDataDialogTitle('Tide Data')
                setDataDialogOption(option)
            }

            setDataDialogOpen(true)
        } catch (e) {
            console.error(e)
            toast.error('Failed to parse data')
        } finally {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
        }
    }

    const unloadContext = () => {
        clearSwmmFromMap()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.types.includes(REORDER_TYPE)) return
        const nodeKey = e.dataTransfer.getData('text/plain') || ''
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleAreaDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        if (e.dataTransfer.types.includes(REORDER_TYPE)) return
        const nodeKey = e.dataTransfer.getData('text/plain') || ''

    }

    const handleDrop = async (e: React.DragEvent, type: string) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            return
        }

        const nodeKey = e.dataTransfer.getData('text/plain')

        const map = store.get<mapboxgl.Map>('map')

        // Upload Grid
        if (type === 'grid') {
            if (nodeKey.split('.')[4] === 'grids') {
                if (pageContext.current?.solutionData?.env.grid_node_key) {
                    toast.warning('Grid already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.grid_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Grid uploaded successfully')
            } else {
                toast.error('Please select the correct grid in grids')
            }
        } else if (type === 'dem') {
            if (nodeKey.split('.')[1] === 'dems') {
                if (pageContext.current?.solutionData?.env.dem_node_key) {
                    toast.warning('DEM already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.dem_node_key = nodeKey

                const demCogData = await apis.raster.getCogTif.fetch(nodeKey, node.tree.isPublic)

                if (!demCogData.success) {
                    toast.error(demCogData.message)
                    store.get<{ on: Function, off: Function }>('isLoading')!.off()
                    return
                } else {
                    const demMeta = await apis.raster.getRasterMetaData.fetch(nodeKey, node.tree.isPublic)

                    pageContext.current!.demInfo = demMeta.data

                    addDEMLayer(map!, nodeKey)
                    toast.success('DEM uploaded successfully')
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
            } else {
                toast.error('Please select the correct DEM in dems')
            }
        } else if (type === 'lum') {
            if (nodeKey.split('.')[1] === 'lums') {
                if (pageContext.current?.solutionData?.env.lum_node_key) {
                    toast.warning('LUM already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.lum_node_key = nodeKey

                const lumCogData = await apis.raster.getCogTif.fetch(nodeKey, node.tree.isPublic)

                if (!lumCogData.success) {
                    toast.error(lumCogData.message)
                    store.get<{ on: Function, off: Function }>('isLoading')!.off()
                    return
                } else {
                    const lumMeta = await apis.raster.getRasterMetaData.fetch(nodeKey, node.tree.isPublic)

                    pageContext.current!.lumInfo = lumMeta.data

                    addLUMLayer(map!, nodeKey)
                    toast.success('LUM uploaded successfully')
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
            } else {
                toast.error('Please select the correct LUM in lums')
            }
        } else if (type === 'rainfall') {
            if (nodeKey.split('.')[1] === 'rainfalls') {
                if (pageContext.current?.solutionData?.env.rainfall_node_key) {
                    toast.warning('Rainfall already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.rainfall_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Rainfall uploaded successfully')
            } else {
                toast.error('Please select the correct Rainfall in rainfalls')
            }
        } else if (type === 'gate') {
            if (nodeKey.split('.')[1] === 'gates') {
                if (pageContext.current?.solutionData?.env.gate_node_key) {
                    toast.warning('Gate already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.gate_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Gate uploaded successfully')
            } else {
                toast.error('Please select the correct Gate in gates')
            }
        } else if (type === 'tide') {
            if (nodeKey.split('.')[1] === 'tides') {
                if (pageContext.current?.solutionData?.env.tide_node_key) {
                    toast.warning('Tide already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.tide_node_key = nodeKey

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
                toast.success('Tide uploaded successfully')
            } else {
                toast.error('Please select the correct Tide in tides')
            }
        } else if (type === 'inp') {
            if (nodeKey.split('.')[1] === 'inps') {
                if (pageContext.current?.solutionData?.env.inp_node_key) {
                    toast.warning('Inp already selected')
                    return
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.on()

                pageContext.current!.solutionData!.env.inp_node_key = nodeKey

                const inpData = await apis.common.getCommonData.fetch(nodeKey, node.tree.isPublic)

                pageContext.current!.inpData = inpData.data.data

                if (!inpData.success) {
                    toast.error(inpData.message)
                    store.get<{ on: Function, off: Function }>('isLoading')!.off()
                    return
                } else {
                    loadInpAndRenderSwmm(inpData.data.data, {
                        fromEPSG: '2326',
                        toEPSG: '4326',
                        idPrefix: 'swmm',
                        fit: false,
                    })
                    toast.success('Inp uploaded successfully')
                }

                store.get<{ on: Function, off: Function }>('isLoading')!.off()
                triggerRepaint()
            } else {
                toast.error('Please select the correct Inp in inps')
            }
        }
    }

    const computeDEMBBox = () => {
        const bbox = pageContext.current!.demInfo!.bbox
        const LB = convertCoordinate(bbox[0], bbox[1], '2326', '4326')
        const TR = convertCoordinate(bbox[2], bbox[3], '2326', '4326')
        if (LB && TR) {
            const bbox84 = [LB.x, LB.y, TR.x, TR.y]
            return bbox84
        } else {
            return null
        }
    }

    const addDEMLayer = (map: mapboxgl.Map, nodeKey: string) => {
        if (terrainLayer.current && map.getLayer(terrainLayer.current.id)) {
            map.removeLayer(terrainLayer.current.id)
            terrainLayer.current = null
        }

        const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, nodeKey, 'terrainrgb', new Date().getTime().toString())

        const bbox84 = computeDEMBBox()
        const minValue = pageContext.current!.demInfo!.min_value
        const maxValue = pageContext.current!.demInfo!.max_value
        const eleRange = (minValue && maxValue) ? [minValue, maxValue] as [number, number] : undefined

        terrainLayer.current = new TerrainByProxyTile(nodeKey, tileUrl, bbox84!, eleRange)

        map.addLayer(terrainLayer.current)

        if (pageContext.current) {
            updateDEMOpacity(pageContext.current.demOpacity)
            pageContext.current.demVisible = true
        }

        map.fitBounds([[bbox84![0], bbox84![1]], [bbox84![2], bbox84![3]]], {
            padding: 80,
            duration: 1000,
        })

        triggerRepaint()
    }

    const addLUMLayer = (map: mapboxgl.Map, nodeKey: string) => {

        if (map.getLayer(nodeKey + 'layer')) {
            map.removeLayer(nodeKey + 'layer')
            map.removeSource(nodeKey + 'source')
        }

        const tileUrl = apis.raster.getTileUrl(node.tree.isPublic, nodeKey, 'uint8', new Date().getTime().toString())

        map.addSource(nodeKey + 'source', {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            maxzoom: 18,
            minzoom: 0,
            scheme: "xyz",
        })

        map.addLayer({
            id: nodeKey + 'layer',
            type: "raster",
            source: nodeKey + 'source',
            paint: {
                "raster-opacity": pageContext.current?.lumOpacity ?? 0.8,
                'raster-color': [
                    'step',
                    ['raster-value'],
                    'rgba(255,190,0,1)',
                    0.040, 'rgba(87,229,0,1)',
                    0.079, 'rgba(0,83,154,1)',
                    0.118, 'rgba(255,129,0,1)',
                    0.157, 'rgba(125,125,125,1)',
                    0.196, 'rgba(0,255,124,1)',
                    0.235, 'rgba(255,0,74,1)',
                    0.274, 'rgba(91,164,255,1)',
                    0.313, 'rgba(163,97,68,1)',
                    0.352, 'rgba(0,255,203,1)',
                    0.391, 'rgba(205,0,215,1)'
                ]
            },

        })

        if (pageContext.current) pageContext.current.lumVisible = true
        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        triggerRepaint()
    }

    const handleResourceRemove = (type: string) => {

        const map = store.get<mapboxgl.Map>('map')

        if (type === 'grid') {
            pageContext.current!.solutionData!.env.grid_node_key = ''
        } else if (type === 'dem') {

            if (map && terrainLayer.current) {
                map.removeLayer(terrainLayer.current.id)
                terrainLayer.current = null
            }

            pageContext.current!.solutionData!.env.dem_node_key = ''
            if (pageContext.current) pageContext.current.demVisible = false

        } else if (type === 'lum') {
            if (map?.getLayer(pageContext.current!.solutionData!.env.lum_node_key + 'layer')) {
                map.removeLayer(pageContext.current!.solutionData!.env.lum_node_key + 'layer')
                map.removeSource(pageContext.current!.solutionData!.env.lum_node_key + 'source')
            }
            pageContext.current!.solutionData!.env.lum_node_key = ''
            if (pageContext.current) pageContext.current.lumVisible = false

        } else if (type === 'rainfall') {
            pageContext.current!.solutionData!.env.rainfall_node_key = ''
        } else if (type === 'gate') {
            pageContext.current!.solutionData!.env.gate_node_key = ''
        } else if (type === 'tide') {
            pageContext.current!.solutionData!.env.tide_node_key = ''
        } else if (type === 'inp') {
            clearSwmmFromMap()
            pageContext.current!.solutionData!.env.inp_node_key = ''
            if (pageContext.current) pageContext.current.inpVisible = false
        }
        triggerRepaint()
    }

    const handleResetDropZone = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return

        if (terrainLayer.current) {
            map.removeLayer(terrainLayer.current.id)
            terrainLayer.current = null
        }

        if (map.getLayer(pageContext.current!.solutionData!.env.lum_node_key + 'layer')) {
            console.log('remove lum layer')
            map.removeLayer(pageContext.current!.solutionData!.env.lum_node_key + 'layer')
            map.removeSource(pageContext.current!.solutionData!.env.lum_node_key + 'source')
        }

        clearSwmmFromMap()

        pageContext.current!.solutionData!.env = {
            grid_node_key: '',
            dem_node_key: '',
            lum_node_key: '',
            rainfall_node_key: '',
            gate_node_key: '',
            tide_node_key: '',
            inp_node_key: '',
        }
        pageContext.current!.demVisible = false
        pageContext.current!.lumVisible = false
        pageContext.current!.inpVisible = false

        triggerRepaint()
    }

    const handleResetForm = () => {
        if (pageContext.current) {

            handleResetDropZone()
            clearSwmmFromMap()

            pageContext.current.solutionData = {
                name: '',
                model_type: '',
                env: {
                    grid_node_key: '',
                    dem_node_key: '',
                    lum_node_key: '',
                    rainfall_node_key: '',
                    gate_node_key: '',
                    tide_node_key: '',
                    inp_node_key: '',
                },
                action_types: [],
            }
            pageContext.current!.demVisible = false
            pageContext.current!.lumVisible = false
            pageContext.current!.inpVisible = false
        }
        triggerRepaint()
    }

    const handleCreateSolution = async () => {

        if (
            !pageContext.current?.solutionData.name
            || !pageContext.current?.solutionData.model_type
            || !pageContext.current?.solutionData.env.grid_node_key
            || !pageContext.current?.solutionData.env.dem_node_key
            || !pageContext.current?.solutionData.env.lum_node_key
            || !pageContext.current?.solutionData.env.rainfall_node_key
            || !pageContext.current?.solutionData.env.gate_node_key
            || !pageContext.current?.solutionData.env.tide_node_key
            || !pageContext.current?.solutionData.env.inp_node_key
        ) {
            toast.error('Please fill in the solution name, model type and resources')
            return
        }

        const solution = {
            name: pageContext.current?.solutionData.name,
            model_type: pageContext.current?.solutionData.model_type,
            env: pageContext.current?.solutionData.env,
            action_types: pageContext.current?.solutionData.action_types,
        } as SolutionMeta

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const createSolutionRes = await apis.solution.createSolution.fetch(solution, node.tree.isPublic)

        if (createSolutionRes.success) {
            const tree = node.tree as SceneTree
            await tree.alignNodeInfo(node, true)
            tree.notifyDomUpdate()

            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            toast.success('Create Solution Success')
        } else {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
            toast.error('Create Solution Failed')
        }

        handleResetDropZone()
        handleResetForm()
    }

    const updateLUMOpacity = (opacity: number) => {
        const map = store.get<mapboxgl.Map>('map')
        const nodeKey = pageContext.current!.solutionData!.env.lum_node_key
        if (!map || !map.getLayer(nodeKey + 'layer')) return

        map.setPaintProperty(nodeKey + 'layer', 'raster-opacity', opacity)
        triggerRepaint();
    }
    const updateDEMOpacity = (opacity: number) => {
        if (!terrainLayer.current) return
        const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
        terrainLayer.current.updateParams({ opacity: percent })
        triggerRepaint();
    }

    const toggleDEMVisibility = () => {
        const map = store.get<mapboxgl.Map>('map')
        if (!map) return
        const nodeKey = pageContext.current?.solutionData?.env.dem_node_key
        if (!nodeKey) return
        const currentlyVisible = pageContext.current?.demVisible ?? true
        if (currentlyVisible) {
            if (terrainLayer.current && map.getLayer(terrainLayer.current.id)) {
                map.removeLayer(terrainLayer.current.id)
                terrainLayer.current = null
            }
            pageContext.current!.demVisible = false
        } else {
            addDEMLayer(map, nodeKey)
            pageContext.current!.demVisible = true
        }
        triggerRepaint()
    }

    const toggleLUMVisibility = () => {
        const map = store.get<mapboxgl.Map>('map')
        const nodeKey = pageContext.current?.solutionData?.env.lum_node_key
        if (!map || !nodeKey) return
        const currentlyVisible = pageContext.current?.lumVisible ?? true
        if (currentlyVisible) {
            if (map.getLayer(nodeKey + 'layer')) {
                map.removeLayer(nodeKey + 'layer')
            }
            if (map.getSource(nodeKey + 'source')) {
                map.removeSource(nodeKey + 'source')
            }
            pageContext.current!.lumVisible = false
        } else {
            addLUMLayer(map, nodeKey)
            pageContext.current!.lumVisible = true
        }
        triggerRepaint()
    }

    const toggleGateVisibility = () => {
        const currentVisible = pageContext.current?.gateVisible ?? true
        if (currentVisible) {
            pageContext.current!.gateVisible = false
        } else {
            pageContext.current!.gateVisible = true
        }
        triggerRepaint()
    }

    const toggleINPVisibility = () => {
        if (!pageContext.current?.solutionData?.env.inp_node_key) return
        const visible = !(pageContext.current.inpVisible ?? true)
        pageContext.current.inpVisible = visible
        setSwmmOpacity(visible ? (pageContext.current.inpOpacity ?? 1) : 0, 'swmm')
        triggerRepaint()
    }

    const fitLUMBounds = () => {
        if (!pageContext.current?.lumInfo) return

        if (pageContext.current.lumVisible === false) {
            console.log('触发')
            toggleLUMVisibility()
        }

        const map = store.get<mapboxgl.Map>('map')!

        const lumBoundsOn4326 = convertToWGS84(pageContext.current?.lumInfo?.bbox!, pageContext.current?.lumInfo?.epsg.toString()!)

        map.fitBounds([
            [lumBoundsOn4326[0], lumBoundsOn4326[1]],
            [lumBoundsOn4326[2], lumBoundsOn4326[3]]
        ], {
            padding: 80,
            duration: 1000,
        })
    }

    const fitDEMBounds = () => {
        if (!pageContext.current?.demInfo) return

        if (pageContext.current.demVisible === false) {
            console.log('触发')
            toggleDEMVisibility()
        }

        const map = store.get<mapboxgl.Map>('map')!

        const demBoundsOn4326 = convertToWGS84(pageContext.current?.demInfo?.bbox!, pageContext.current?.demInfo?.epsg.toString()!)

        map.fitBounds([
            [demBoundsOn4326[0], demBoundsOn4326[1]],
            [demBoundsOn4326[2], demBoundsOn4326[3]]
        ], {
            padding: 80,
            duration: 1000,
        })
    }



    return (
        <div className="w-full h-full flex flex-row bg-gray-50">
            <div className="w-[20vw] h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl flex flex-col border-r border-slate-200">
                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Dam className='w-6 h-6' />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-md font-semibold text-slate-900">Create New Solution</h2>
                            <p className="text-sm text-slate-500">New Solution Details</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='destructive'
                                className='cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                onClick={() => setResetFormDialogOpen(true)}
                            >
                                <RotateCcw className="w-4 h-4" />Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex-1 p-2 space-y-2 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {/* Solution Information Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Basic Information</span>
                            </div>
                            <div className="ml-6 space-y-2">
                                {/* Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Name</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <Input
                                            placeholder='Enter name'
                                            className='w-50'
                                            value={pageContext.current?.solutionData?.name}
                                            onChange={(e) => {
                                                pageContext.current!.solutionData!.name = e.target.value
                                                triggerRepaint()
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Type */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Type</span>
                                    <div className="flex items-center gap-2 mr-1">
                                        <Select
                                            value={pageContext.current?.solutionData?.model_type || ''}
                                            onValueChange={(value) => {
                                                if (pageContext.current) {
                                                    pageContext.current.solutionData!.model_type = value;
                                                    triggerRepaint();
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-50">
                                                <SelectValue placeholder="Select Mode Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="flood_pipe">洪水-管道联合模拟</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>


                            </div>
                            {/* Action Types */}
                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrafficCone className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Action Types</span>
                                </div>
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_fence"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('add_fence')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('add_fence')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'add_fence')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="add_fence" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            add fence
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="transfer_water"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('transfer_water')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('transfer_water')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'transfer_water')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="transfer_water" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            transfer water
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="add_gate"
                                            className='w-4 h-4 cursor-pointer'
                                            checked={pageContext.current?.solutionData?.action_types.includes('add_gate')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    pageContext.current!.solutionData!.action_types.push('add_gate')
                                                } else {
                                                    pageContext.current!.solutionData!.action_types =
                                                        pageContext.current!.solutionData!.action_types.filter(type => type !== 'add_gate')
                                                }
                                                triggerRepaint()
                                            }}
                                        />
                                        <label htmlFor="add_gate" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                                            add gate
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resource Upload Area */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent
                            className="space-y-4"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleAreaDrop}
                        >
                            {/* Upload Status */}
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Box className='w-4 h-4' />
                                    <span className='text-sm font-medium text-slate-500 uppercase tracking-wide'>Resources Upload</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 text-white hover:text-white cursor-pointer shadow-sm"
                                    onClick={() => setResetDropZoneDialogOpen(true)}
                                >
                                    <BrushCleaning className="w-4 h-4" />Clear
                                </Button>
                            </div>
                            {/* Grid */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <SquaresUnite className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Grid Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'grid')}
                                >
                                    {!pageContext.current?.solutionData?.env.grid_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Grid node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData?.env.grid_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // toggleGridVisibility();
                                                            triggerRepaint();
                                                        }}
                                                    >
                                                        {pageContext.current?.gridVisible ?
                                                            <Eye className="h-3 w-3" /> :
                                                            <EyeOff className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                    // onClick={(e) => {
                                                    //     handleVectorPin(resource.node_key)
                                                    // }}
                                                    >
                                                        <Fullscreen className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('grid')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Dem */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MountainSnow className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">DEM Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'dem')}
                                >
                                    {!pageContext.current?.solutionData?.env.dem_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag DEM node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.dem_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDEMVisibility();
                                                            triggerRepaint();
                                                        }}
                                                    >
                                                        {pageContext.current?.demVisible ?
                                                            <Eye className="h-3 w-3" /> :
                                                            <EyeOff className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                        onClick={fitDEMBounds}
                                                    >
                                                        <Fullscreen className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('dem')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <Badge className='bg-slate-200 text-black text-xs'>Opacity</Badge>
                                                    <div className="flex items-center gap-2">
                                                        <Slider
                                                            value={[Math.round(pageContext.current?.demOpacity! * 100)]}
                                                            max={100}
                                                            step={5}
                                                            disabled={!pageContext.current?.demVisible}
                                                            className='w-36 cursor-pointer'
                                                            onValueChange={(value) => {
                                                                const opacity = Math.round(value[0]) / 100;
                                                                pageContext.current!.demOpacity = opacity;
                                                                updateDEMOpacity(opacity)
                                                            }}
                                                        />
                                                        <Badge variant="secondary" className={`w-10 text-xs font-semibold`}>
                                                            {Math.round(pageContext.current?.demOpacity! * 100)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* LUM */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <TentTree className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">LUM Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'lum')}
                                >
                                    {!pageContext.current?.solutionData?.env.lum_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag LUM node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.lum_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleLUMVisibility()
                                                        }}
                                                    >
                                                        {pageContext.current?.lumVisible ?
                                                            <Eye className="h-3 w-3" /> :
                                                            <EyeOff className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                        onClick={fitLUMBounds}
                                                    >
                                                        <Fullscreen className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('lum')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <Badge className='bg-slate-200 text-black text-xs'>Opacity</Badge>
                                                    <div className="flex items-center gap-2">
                                                        <Slider
                                                            value={[Math.round(pageContext.current?.lumOpacity! * 100)]}
                                                            max={100}
                                                            step={5}
                                                            disabled={!pageContext.current?.lumVisible}
                                                            className='w-36 cursor-pointer'
                                                            onValueChange={(value) => {
                                                                const opacity = Math.round(value[0]) / 100;
                                                                pageContext.current!.lumOpacity = opacity;
                                                                updateLUMOpacity(opacity)
                                                            }}
                                                        />
                                                        <Badge variant="secondary" className={`w-10 text-xs font-semibold`}>
                                                            {Math.round(pageContext.current?.lumOpacity! * 100)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Rainfall */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CloudRainWind className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rainfall Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'rainfall')}
                                >
                                    {!pageContext.current?.solutionData?.env.rainfall_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Rainfall node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.rainfall_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-emerald-500 cursor-pointer"
                                                        onClick={() => openDataDialog('rainfall')}
                                                    >
                                                        <Table className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('rainfall')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* gate */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Construction className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gate Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'gate')}
                                >
                                    {!pageContext.current?.solutionData?.env.gate_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Gate node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.gate_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleGateVisibility()
                                                        }}
                                                    >
                                                        {pageContext.current?.gateVisible ?
                                                            <Eye className="h-3 w-3" /> :
                                                            <EyeOff className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('gate')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Tide */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Waves className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tide Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'tide')}
                                >
                                    {!pageContext.current?.solutionData?.env.tide_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag Tide node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.tide_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-emerald-500 cursor-pointer"
                                                        onClick={() => openDataDialog('tide')}
                                                    >
                                                        <Table className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('tide')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* INP */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clipboard className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">INP Drop Zone</span>
                                </div>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-2 transition-all duration-200",
                                        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'inp')}
                                >
                                    {!pageContext.current?.solutionData?.env.inp_node_key ? (
                                        <div className="h-[6vh] flex flex-col justify-center items-center text-slate-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium mb-1">Drag INP node here</p>
                                        </div>
                                    ) : (
                                        <div className="h-full pr-1">
                                            <div
                                                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 group hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <p className="text-slate-900 text-sm font-medium truncate">
                                                            {pageContext.current.solutionData.env.inp_node_key.split(".").pop()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-amber-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleINPVisibility()
                                                        }}
                                                    >
                                                        {pageContext.current?.inpVisible ?
                                                            <Eye className="h-3 w-3" /> :
                                                            <EyeOff className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0 hover:text-sky-500 cursor-pointer"
                                                    // onClick={(e) => {
                                                    //     handleVectorPin(resource.node_key)
                                                    // }}
                                                    >
                                                        <Fullscreen className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="ml-2 h-6 w-6 p-0  hover:text-red-500 cursor-pointer"
                                                        onClick={() => handleResourceRemove('inp')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                    <div>
                        <Button
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            onClick={handleCreateSolution}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Create New Solution
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container placeholder */}
            <div className="w-full h-full flex-1">
                <MapContainer node={node} style='w-full h-full' />
            </div>

            {/* Alert Dialog for Form Reset */}
            <AlertDialog open={resetFormDialogOpen} onOpenChange={setResetFormDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Form Reset?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will clear all form data entered, including all selections in the resource area. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetForm}
                            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                        >
                            Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog for Drop Zone Reset */}
            <AlertDialog open={resetDropZoneDialogOpen} onOpenChange={setResetDropZoneDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Clearing Resource Area?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will clear all selected resource items. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetDropZone}
                            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
                <DialogContent className="w-[60vw] !max-w-[60vw]">
                    <DialogHeader>
                        <DialogTitle>{dataDialogTitle}</DialogTitle>
                        <DialogDescription>
                            Display all data, you can use the map tools to zoom/reset/export the image.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] h-[70vh]">
                        {dataDialogOption && (
                            <ReactECharts option={dataDialogOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>Close</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
