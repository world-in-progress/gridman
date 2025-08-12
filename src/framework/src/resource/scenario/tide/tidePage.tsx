import React from 'react'
import { TidePageProps } from './types'
import { useEffect, useReducer, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw, Activity, Droplets, TrendingUp, Database } from 'lucide-react'
import dynamic from 'next/dynamic'
import { TideData } from './types'
import { SceneNode } from '@/components/resourceScene/scene'
import { TidePageContext } from './tide'
import store from '@/store'
import { toast } from 'sonner'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function TidePage({ node }: TidePageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<TideData[]>([])
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<string>('all')
    const [selectedData, setSelectedData] = useState<string[]>([])
    const pageContext = useRef<TidePageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as TidePageContext

        fetchData()

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('Component unmounted')
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!pageContext.current?.tideData?.data) {
                setError('无法获取潮位数据');
                toast.error('Failed to get tide data');
                return;
            }

            const csvLines = pageContext.current.tideData.data as string[];

            if (csvLines.length < 1) {
                setError('潮位数据为空');
                toast.error('Tide data is empty');
                return;
            }

            const headers = csvLines[0].split(',');

            const parsedData: TideData[] = csvLines.slice(1)
                .map((line) => {
                    const values = line.split(',');
                    if (values.length < 3) return null;

                    const rawDate = (values[0] ?? '').trim();
                    const rawTime = (values[1] ?? '').trim();
                    const rawValue = values[2];

                    // 将 M/D/YYYY + HH:mm:ss 合并为本地时间，再序列化为 ISO，便于 ECharts time 轴与 Date 解析
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

            setSelectedData(uniqueDates)

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
                    <h1 className="text-xl font-bold text-gray-900">Tide Monitoring Dashboard [{pageContext.current?.tideData.name}]</h1>
                    <p className="text-sm text-gray-600">Real-time monitoring of tide data from multiple stations</p>
                </div>
                <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
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
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1 p-4">
                    <Card className="h-[95.5%] bg-white border-gray-200">
                        <CardContent className="p-4 h-full">
                            <div className="h-full">
                                <ReactECharts
                                    option={getChartOption()}
                                    style={{ height: '100%', width: '100%' }}
                                    opts={{ renderer: 'canvas' }}
                                    notMerge={true}
                                    lazyUpdate={false}
                                    key={`${selectedData.join('|')}-${timeRange}`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
