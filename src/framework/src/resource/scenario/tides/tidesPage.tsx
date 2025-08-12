import { TidesPageProps } from './types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { TidesPageContext } from './tides'
import { toast } from 'sonner'
import * as apis from '@/core/apis/apis'
import { useEffect, useReducer, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    RefreshCw,
    Activity,
    TrendingUp,
    Database,
    Plus,
    FolderOpen,
    Loader2,
    Waves,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import store from '@/store'
import { cn } from '@/utils/utils'
import { TideData } from '../tide/types'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function TidesPage({ node }: TidesPageProps) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<TidesPageContext | null>(null)
    const [showTideDialog, setShowTideDialog] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<string>('all')
    const [selectedData, setSelectedData] = useState<string[]>([])
    const [data, setData] = useState<TideData[]>([])

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as TidesPageContext

        if (pageContext.current.hasTide) {
            setShowTideDialog(false)
            fetchData()
        } else {
            setShowTideDialog(true)
        }

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const confirmCreateNewTide = () => {
        pageContext.current!.tideMeta = {
            name: '',
            type: 'tide',
            src_path: ''
        }

        pageContext.current!.hasTide = false

        setShowTideDialog(true)

        triggerRepaint()
    }

    const handleFileSelect = async () => {
        if (window.electronAPI && typeof window.electronAPI.openCsvFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openCsvFileDialog()
                if (filePath) {
                    if (pageContext.current) {
                        pageContext.current.tideMeta.src_path = filePath
                        triggerRepaint()
                    }
                }
            } catch (error) {
                console.error('Error opening file dialog:', error)
                toast.error('文件选择对话框打开失败')
            }
        } else {
            toast.error('文件选择功能不可用')
        }
    }

    const handleCreateTide = async () => {
        if (!pageContext.current?.tideMeta.name || !pageContext.current?.tideMeta.src_path) return

        const gateData = {
            name: pageContext.current?.tideMeta.name,
            type: 'tide',
            src_path: pageContext.current?.tideMeta.src_path
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)

        setShowTideDialog(false)

        try {
            if (response.success) {

                const nodeKey = node.key + '.' + pageContext.current.tideMeta.name

                const tideData = await apis.common.getCommonData.fetch(nodeKey, node.tree.isPublic)

                pageContext.current.tideData = {
                    name: pageContext.current.tideMeta.name,
                    type: 'tide',
                    data: tideData.data.data
                }

                pageContext.current!.hasTide = true

                
                const tree = node.tree as SceneTree
                await tree.alignNodeInfo(node, true)
                tree.notifyDomUpdate()
                
                fetchData()

                toast.success('Tide created successfully')
            } else {
                toast.error('Failed to create tide')
            }
        } finally {
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
        }

        triggerRepaint()
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!pageContext.current?.tideData?.data) {
                throw new Error('无法获取潮位数据')
                toast.error('Failed to get tide data')
            }

            const csvLines = pageContext.current.tideData.data as string[];

            if (csvLines.length < 1) {
                throw new Error('Tide data is empty')
                toast.error('Tide data is empty')
            }

            const headers = csvLines[0].split(',');

            const parsedData: TideData[] = csvLines.slice(1)
                .map((line) => {
                    const values = line.split(',');
                    if (values.length < 3) return null;

                    const rawDate = (values[0] ?? '').trim();
                    const rawTime = (values[1] ?? '').trim();
                    const rawValue = values[2];

                    const [monthStr, dayStr, yearStr] = rawDate.split('/');
                    const [hourStr, minuteStr, secondStr] = rawTime.split(':');

                    const year = Number(yearStr || 0);
                    const month = Number(monthStr || 1) - 1;
                    const day = Number(dayStr || 1);
                    const hour = Number(hourStr || 0);
                    const minute = Number(minuteStr || 0);
                    const second = Number(secondStr || 0);

                    const dt = new Date(year, month, day, hour, minute, second);
                    if (isNaN(dt.getTime())) return null;

                    return {
                        date: rawDate,
                        time: dt.toISOString(),
                        chaowei: parseFloat(rawValue) || 0,
                    } as TideData;
                })
                .filter((v): v is TideData => !!v);

            setData(parsedData);

            const uniqueDates = [...new Set(parsedData.map(item => item.date))];
            setSelectedData(uniqueDates);

        } catch (err) {
            setError('加载数据失败，请重试');
            console.error('Error fetching tide data:', err);
        } finally {
            setLoading(false);
            store.get<{ on: Function, off: Function }>('isLoading')!.off();
        }
    }

    const uniqueStations = [...new Set(data.map(item => item.date))]

    const getFilteredData = () => {
        let filteredData = data.filter(item => selectedData.includes(item.date))

        if (timeRange !== 'all') {
            const now = new Date()
            const cutoffDate = new Date()

            switch (timeRange) {
                case '7d':
                    cutoffDate.setDate(now.getDate() - 7)
                    break
                case '30d':
                    cutoffDate.setDate(now.getDate() - 30)
                    break
                case '90d':
                    cutoffDate.setDate(now.getDate() - 90)
                    break
            }

            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.time)
                return itemDate >= cutoffDate
            })
        }

        return filteredData
    }

    const getChartOption = () => {
        const filteredData = getFilteredData();

        const toMinutesOfDay = (isoString: string) => {
            const d = new Date(isoString)
            return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
        }

        const seriesData = selectedData.map(date => {

            const dateData = filteredData
                .filter(item => item.date === date)
                .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                .map(item => [toMinutesOfDay(item.time), item.chaowei])

            return {
                name: date,
                type: 'line',
                data: dateData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                areaStyle: {
                    opacity: 0.15
                },
                lineStyle: {
                    width: 2
                },
                emphasis: {
                    focus: 'series'
                }
            };
        });

        return {
            title: {
                text: 'Tide Data Visualization',
                subtext: 'Time Series Data',
                left: 'center',
                textStyle: {
                    fontSize: 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    fontSize: 12,
                    padding: [8, 0, 0, 0]
                }
            },
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
                formatter: (params: any) => {
                    const minutes = Number(params?.[0]?.axisValue || 0)
                    const h = Math.floor(minutes / 60)
                    const m = Math.floor(minutes % 60)
                    const timeStr = `${h}:${m.toString().padStart(2, '0')}`
                    const lines = params.map((p: any) => `${p.marker} ${p.seriesName}: ${p.data[1]} m`)
                    return `${timeStr}<br/>${lines.join('<br/>')}`
                }
            },
            legend: {
                data: selectedData,
                top: 50,
                type: 'scroll',
                textStyle: {
                    color: '#333'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '25%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    saveAsImage: { title: 'Save as Image' },
                    dataZoom: {
                        title: {
                            zoom: 'Area Zoom',
                            back: 'Zoom Reset'
                        },
                        yAxisIndex: 'none'
                    },
                    restore: { title: 'Restore' },
                    dataView: { title: 'Data View', lang: ['Data View', 'Close', 'Refresh'] }
                },
                right: '2%'
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    filterMode: 'filter'
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    filterMode: 'filter'
                }
            ],
            xAxis: {
                type: 'value',
                min: 0,
                max: 1440, // 24 * 60 分钟
                boundaryGap: false,
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    formatter: function (value: number) {
                        const minutes = Math.floor(value)
                        const h = Math.floor(minutes / 60)
                        const m = Math.floor(minutes % 60)
                        return `${h}:${m.toString().padStart(2, '0')}`
                    },
                    color: '#333'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: ['#ccc'],
                        width: 1,
                        type: 'dashed'
                    }
                }
            },
            yAxis: {
                name: 'Tide (m)',
                type: 'value',
                position: 'left',
                alignTicks: true,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#5470c6'
                    }
                },
                axisLabel: {
                    formatter: '{value} m',
                    color: '#5470c6'
                },
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: '#ddd'
                    }
                }
            },
            series: seriesData
        };
    };

    const getStatistics = () => {
        const filteredData = getFilteredData()
        const totalTide = filteredData.reduce((sum, item) => sum + item.chaowei, 0)
        const maxTide = Math.max(...filteredData.map(item => item.chaowei))
        const avgTide = filteredData.length > 0 ? totalTide / filteredData.length : 0

        return {
            total: totalTide.toFixed(2),
            max: maxTide.toFixed(2),
            average: avgTide.toFixed(2),
            dataPoints: filteredData.length
        }
    }

    const stats = getStatistics()
    const selectValue = selectedData.length === uniqueStations.length ? 'all' : (selectedData[0] ?? 'all')

    return (
        <div className='relative w-full h-full flex flex-row bg-gray-50'>
            <Dialog open={showTideDialog} onOpenChange={setShowTideDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Rainfall</DialogTitle>
                        <DialogDescription>
                            Please fill in the basic information for the Rainfall
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={pageContext.current?.tideMeta.name}
                                onChange={(e) => {
                                    pageContext.current!.tideMeta.name = e.target.value
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
                                    value={pageContext.current?.tideMeta.src_path}
                                    readOnly={true}
                                    onChange={(e) => {
                                        pageContext.current!.tideMeta.src_path = e.target.value
                                        triggerRepaint()
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    variant="secondary"
                                    className='cursor-pointer hover:bg-slate-200'
                                    size="icon"
                                    onClick={handleFileSelect}
                                    title="Browse file"
                                >
                                    <FolderOpen className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className='flex gap-6'>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowTideDialog(false)
                            }}
                            className='cursor-pointer'
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTide}
                            disabled={!pageContext.current?.tideMeta.name.trim() || !pageContext.current?.tideMeta.src_path.trim()}
                            className='cursor-pointer'
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
                <div className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Tide Monitoring Dashboard {pageContext.current?.hasTide && `[${pageContext.current?.tideMeta.name}]`}</h1>
                        <p className="text-sm text-gray-600">Real-time monitoring of tide data from multiple stations</p>
                    </div>
                    {pageContext.current?.hasTide && (
                        <div className='flex items-center gap-2'>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className='cursor-pointer bg-sky-500 hover:bg-sky-600 shadow-sm'
                                    >
                                        <Plus className="w-4 h-4" /> New
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Create New LUM</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to continue creating a new LUM?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className='flex gap-4'>
                                        <AlertDialogCancel className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={confirmCreateNewTide}
                                            className="bg-sky-500 hover:bg-sky-600 cursor-pointer"
                                        >
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button
                                onClick={fetchData}
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Data
                            </Button>
                        </div>
                    )}
                </div>

                <div className="h-[calc(100vh-4rem)] flex">
                    <div
                        className="w-80 bg-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto h-[95.5%]"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-sm text-gray-900 -mb-6">Data Filters</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-2 text-gray-700">Date</label>
                                    <Select
                                        value={selectValue}
                                        onValueChange={(value) => {
                                            if (value === 'all') {
                                                setSelectedData(uniqueStations)
                                            } else {
                                                setSelectedData([value])
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 w-30">
                                            <SelectValue placeholder="选择日期" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200">
                                            <SelectItem value="all">All</SelectItem>
                                            {uniqueStations.map(station => (
                                                <SelectItem key={station} value={station}>{station}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Now: {selectedData.length === uniqueStations.length ? 'All' : selectedData.join(', ')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-2 text-gray-700">Time Range</label>
                                    <Select value={timeRange} onValueChange={setTimeRange}>
                                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 w-30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200">
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="7d">Last 7 Days</SelectItem>
                                            <SelectItem value="30d">Last 30 Days</SelectItem>
                                            <SelectItem value="90d">Last 90 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-rows-3 gap-2">
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="py-2 px-3">
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <div>
                                            <div className="text-lg font-bold text-green-700">{stats.max}</div>
                                            <p className="text-xs text-green-600">Maximum(m)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="py-2 px-3">
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-4 w-4 text-orange-600" />
                                        <div>
                                            <div className="text-lg font-bold text-orange-700">{stats.average}</div>
                                            <p className="text-xs text-orange-600">Average(m)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-purple-50 border-purple-200">
                                <CardContent className="py-2 px-3">
                                    <div className="flex items-center space-x-2">
                                        <Database className="h-4 w-4 text-purple-600" />
                                        <div>
                                            <div className="text-lg font-bold text-purple-700">{stats.dataPoints}</div>
                                            <p className="text-xs text-purple-600">Data Points</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-gray-50 border-gray-200 flex-1">
                            <CardHeader>
                                <CardTitle className="text-sm text-gray-900 -mb-6">Latest Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pageContext.current?.hasTide ? (
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {getFilteredData().slice(-8).reverse().map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-1 px-2 bg-white rounded text-xs">
                                                <div>
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                                        {item.date}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-gray-900">{item.chaowei} m</div>
                                                    <div className="text-gray-500 text-xs">
                                                        {new Date(item.time).toLocaleString('zh-CN', {
                                                            month: 'numeric',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                        <Waves className="h-16 w-16 text-blue-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Tide Data</h3>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex-1 p-4">
                        <Card className="h-[95.5%] bg-white border-gray-200">
                            <CardContent className="p-4 h-full">
                                <div className="h-full">
                                    {pageContext.current?.hasTide ? (
                                        <ReactECharts
                                            option={getChartOption()}
                                            style={{ height: '100%', width: '100%' }}
                                            opts={{ renderer: 'canvas' }}
                                            notMerge={true}
                                            lazyUpdate={false}
                                            key={`${selectedData.join('|')}-${timeRange}`}
                                        />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                            <Waves className="h-16 w-16 text-blue-400 mb-4" />
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Tide Data</h3>
                                            <p className="text-gray-600 mb-4">Please click the "Create" button to create new tide data to view the chart</p>
                                            <Button
                                                onClick={() => setShowTideDialog(true)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create New Tide
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 