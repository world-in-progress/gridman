import { RainfallPageProps } from './types'
import { useEffect, useReducer, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw, Activity, Droplets, TrendingUp, Database } from 'lucide-react'
import dynamic from 'next/dynamic'
import { RainfallData } from './types'
import { SceneNode } from '@/components/resourceScene/scene'
import { RainfallPageContext } from './rainfall'
import store from '@/store'
import { toast } from 'sonner'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function RainfallPage({ node }: RainfallPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<RainfallData[]>([])
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<string>('all')
    const [selectedStations, setSelectedStations] = useState<string[]>([])
    const pageContext = useRef<RainfallPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as RainfallPageContext

        fetchData()

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('Component unmounted')
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            if (!pageContext.current?.rainfallData?.data) {
                toast.error('Failed to get rainfall data')
                throw new Error('无法获取降雨数据')
            }

            const csvLines = pageContext.current.rainfallData.data as string[]

            if (csvLines.length < 1) {
                toast.error('Rainfall data is empty')
                throw new Error('Rainfall data is empty')
            }

            const headers = csvLines[0].split(',')

            const parsedData: RainfallData[] = csvLines.slice(1).map(line => {
                const values = line.split(',')
                return {
                    DateTime: values[0],
                    Station: values[1],
                    rainfall: parseFloat(values[2]) || 0,
                    DateAndTime: values[3]
                }
            })

            setData(parsedData)

            const uniqueStations = [...new Set(parsedData.map(item => item.Station))]
            setSelectedStations(uniqueStations.slice(0, 3))

        } catch (err) {
            setError('Failed to load data, please try again')
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
            store.get<{ on: Function, off: Function }>('isLoading')!.off()
        }
    }

    const uniqueStations = [...new Set(data.map(item => item.Station))]

    const getFilteredData = () => {
        let filteredData = data.filter(item => selectedStations.includes(item.Station))

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
                const itemDate = new Date(item.DateTime)
                return itemDate >= cutoffDate
            })
        }

        return filteredData
    }

    const getChartOption = () => {
        const filteredData = getFilteredData()

        const seriesData = selectedStations.map(station => {
            const stationData = filteredData
                .filter(item => item.Station === station)
                .sort((a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime())
                .map(item => [item.DateTime, item.rainfall])

            return {
                name: station,
                type: 'line',
                data: stationData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: {
                    width: 2
                },
                areaStyle: {
                    opacity: 0.2,
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: 'rgba(58, 77, 233, 0.8)'
                        }, {
                            offset: 1,
                            color: 'rgba(58, 77, 233, 0.1)'
                        }]
                    }
                }
            }
        })

        const barSeriesData = selectedStations.map(station => {
            const stationData = filteredData
                .filter(item => item.Station === station)
                .sort((a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime())
                .map(item => [item.DateTime, item.rainfall])

            return {
                name: station + ' Bar',
                type: 'bar',
                data: stationData,
                yAxisIndex: 1,
                barWidth: '60%',
                itemStyle: {
                    color: '#91cc75',
                    opacity: 0.6
                },
                emphasis: {
                    focus: 'series'
                },
                tooltip: {
                    valueFormatter: function (value: number) {
                        return value + ' mm';
                    }
                }
            }
        })

        return {
            title: {
                text: 'Rainfall and Flow Relationship',
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
                        backgroundColor: '#505765'
                    }
                },
                formatter: function (params: any) {
                    let result = `<div style="margin-bottom: 5px; font-weight: bold;">${params[0].axisValue}</div>`
                    params.forEach((param: any) => {
                        if (param.value[1] !== undefined) {
                            result += `<div style="margin: 2px 0;">
                                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>
                                ${param.seriesName}: <strong>${param.value[1]} mm</strong>
                            </div>`
                        }
                    })
                    return result
                }
            },
            legend: {
                data: selectedStations.map(station => [station, station + ' Bar']).flat(),
                top: 50,
                type: 'scroll',
                textStyle: {
                    color: '#333'
                },
                selected: selectedStations.reduce((acc, station) => {
                    acc[station] = true;
                    acc[station + ' Bar'] = true
                    return acc;
                }, {} as Record<string, boolean>)
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
            axisPointer: {
                link: { xAxisIndex: 'all' },
                label: {
                    backgroundColor: '#777'
                }
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
                type: 'time',
                boundaryGap: false,
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    formatter: function (value: any) {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}\n${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
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
                },
                minorTick: {
                    show: true
                },
                minorSplitLine: {
                    show: true,
                    lineStyle: {
                        color: '#eee'
                    }
                }
            },
            yAxis: [
                {
                    name: 'Rainfall (mm)',
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
                        formatter: '{value} mm',
                        color: '#5470c6'
                    },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: '#ddd'
                        }
                    }
                },
                {
                    name: 'Flow',
                    nameLocation: 'start',
                    type: 'value',
                    position: 'right',
                    alignTicks: true,
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#91cc75'
                        }
                    },
                    axisLabel: {
                        formatter: '{value} mm',
                        color: '#91cc75'
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            series: [...seriesData, ...barSeriesData]
        }
    }

    const getStatistics = () => {
        const filteredData = getFilteredData()
        const totalRainfall = filteredData.reduce((sum, item) => sum + item.rainfall, 0)
        const maxRainfall = Math.max(...filteredData.map(item => item.rainfall))
        const avgRainfall = filteredData.length > 0 ? totalRainfall / filteredData.length : 0

        return {
            total: totalRainfall.toFixed(2),
            max: maxRainfall.toFixed(2),
            average: avgRainfall.toFixed(2),
            dataPoints: filteredData.length
        }
    }

    const stats = getStatistics()

    if (loading) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading rainfall data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-96 bg-white border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Loading Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchData} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reload
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Rainfall Monitoring Dashboard [{pageContext.current?.rainfallData.name}]</h1>
                    <p className="text-sm text-gray-600">Real-time monitoring of rainfall data from multiple stations</p>
                </div>
                <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            <div className="h-[calc(100vh-4rem)] flex">
                <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-4">
                    <Card className="bg-gray-50 border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-sm text-gray-900 -mb-6">Data Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-2 text-gray-700">Monitoring Stations</label>
                                <Select
                                    value={selectedStations.join(',')}
                                    onValueChange={(value) => {
                                        if (value === 'all') {
                                            setSelectedStations(uniqueStations)
                                        } else {
                                            setSelectedStations([value])
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                        <SelectValue placeholder="Select stations" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-200">
                                        <SelectItem value="all">All stations</SelectItem>
                                        {uniqueStations.map(station => (
                                            <SelectItem key={station} value={station}>{station}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Current: {selectedStations.join(', ')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-2 text-gray-700">Time Range</label>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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

                    <div className="grid grid-cols-2 gap-3">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                    <Droplets className="h-4 w-4 text-blue-600" />
                                    <div>
                                        <div className="text-lg font-bold text-blue-700">{stats.total}</div>
                                        <p className="text-xs text-blue-600">Total Rainfall(mm)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <div>
                                        <div className="text-lg font-bold text-green-700">{stats.max}</div>
                                        <p className="text-xs text-green-600">Maximum(mm)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-orange-50 border-orange-200">
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-4 w-4 text-orange-600" />
                                    <div>
                                        <div className="text-lg font-bold text-orange-700">{stats.average}</div>
                                        <p className="text-xs text-orange-600">Average(mm)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-purple-50 border-purple-200">
                            <CardContent className="p-3">
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
                            <div
                                className="space-y-2 max-h-80 overflow-y-auto"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {getFilteredData().slice(-8).reverse().map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1 px-2 bg-white rounded text-xs">
                                        <div>
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                                {item.Station}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-gray-900">{item.rainfall} mm</div>
                                            <div className="text-gray-500 text-xs">
                                                {new Date(item.DateTime).toLocaleString('zh-CN', {
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
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1 p-4">
                    <Card className="h-full bg-white border-gray-200">
                        <CardContent className="p-4 h-full">
                            <div className="h-full">
                                <ReactECharts
                                    option={getChartOption()}
                                    style={{ height: '100%', width: '100%' }}
                                    opts={{ renderer: 'canvas' }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
