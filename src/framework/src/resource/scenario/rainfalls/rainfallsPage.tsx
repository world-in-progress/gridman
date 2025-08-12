import { useEffect, useReducer, useRef, useState } from 'react'
import { RainfallsPageProps } from './types'
import {

} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { RainfallsPageContext } from './rainfalls'
import { toast } from 'sonner'
import * as apis from '@/core/apis/apis'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	RefreshCw,
	Activity,
	Droplets,
	TrendingUp,
	Database,
	FolderOpen,
	CloudRainWind,
	Plus,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { RainfallData } from '../rainfall/types'
import store from '@/store'
import { cn } from '@/utils/utils'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function RainfallsPage({ node }: RainfallsPageProps) {
	const [, triggerRepaint] = useReducer(x => x + 1, 0)
	const pageContext = useRef<RainfallsPageContext | null>(null)
	const [showRainfallDialog, setShowRainfallDialog] = useState(false)
	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<RainfallData[]>([])
	const [error, setError] = useState<string | null>(null)
	const [timeRange, setTimeRange] = useState<string>('all')
	const [selectedStations, setSelectedStations] = useState<string[]>([])

	useEffect(() => {
		loadContext(node as SceneNode)

		return () => {
			unloadContext()
		}
	}, [node])

	const loadContext = async (node: SceneNode) => {

		pageContext.current = await node.getPageContext() as RainfallsPageContext

		if (pageContext.current.hasRainfall) {
			setShowRainfallDialog(false)
			fetchData()
		} else {
			setShowRainfallDialog(true)
		}

		triggerRepaint()
	}

	const unloadContext = () => {
		console.log('组件卸载')
	}


	const handleFileSelect = async () => {
		if (window.electronAPI && typeof window.electronAPI.openCsvFileDialog === 'function') {
			try {
				const filePath = await window.electronAPI.openCsvFileDialog()
				if (filePath) {
					if (pageContext.current) {
						pageContext.current.rainfallMeta.src_path = filePath
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

	const confirmCreateNewRainfall = () => {
		pageContext.current!.rainfallMeta = {
			name: '',
			type: 'rainfall',
			src_path: ''
		}

		pageContext.current!.hasRainfall = false

		setShowRainfallDialog(true)

		triggerRepaint()
	}

	const handleCreateRainfall = async () => {
		if (!pageContext.current?.rainfallMeta.name || !pageContext.current?.rainfallMeta.src_path) return

		const gateData = {
			name: pageContext.current?.rainfallMeta.name,
			type: 'rainfall',
			src_path: pageContext.current?.rainfallMeta.src_path
		}

		store.get<{ on: Function, off: Function }>('isLoading')!.on()

		const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)

		setShowRainfallDialog(false)

		try {
			if (response.success) {

				const nodeKey = node.key + '.' + pageContext.current.rainfallMeta.name

				const rainfallData = await apis.common.getCommonData.fetch(nodeKey, node.tree.isPublic)

				pageContext.current.rainfallData = {
					name: pageContext.current.rainfallMeta.name,
					type: 'rainfall',
					data: rainfallData.data.data
				}

				pageContext.current!.hasRainfall = true
				
                const tree = node.tree as SceneTree
                await tree.alignNodeInfo(node, true)
                tree.notifyDomUpdate()
				
				fetchData()

				toast.success('Rainfall created successfully')
			} else {
				toast.error('Failed to create rainfall')
			}
		} finally {
			store.get<{ on: Function, off: Function }>('isLoading')!.off()
		}


		triggerRepaint()
	}

	const fetchData = async () => {
		try {
			setLoading(true)
			setError(null)

			if (!pageContext.current?.rainfallData?.data) {
				throw new Error('无法获取降雨数据')
				toast.error('Failed to get rainfall data')
			}

			const csvLines = pageContext.current.rainfallData.data as string[]

			if (csvLines.length < 1) {
				throw new Error('Rainfall data is empty')
				toast.error('Rainfall data is empty')
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
					acc[station + ' Bar'] = false;
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

	return (
		<div className='relative w-full h-full flex flex-row bg-gray-50'>
			<Dialog open={showRainfallDialog} onOpenChange={setShowRainfallDialog}>
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
								value={pageContext.current?.rainfallMeta.name}
								onChange={(e) => {
									pageContext.current!.rainfallMeta.name = e.target.value
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
									value={pageContext.current?.rainfallMeta.src_path}
									readOnly={true}
									onChange={(e) => {
										pageContext.current!.rainfallMeta.src_path = e.target.value
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
								setShowRainfallDialog(false)
							}}
							className='cursor-pointer'
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateRainfall}
							disabled={!pageContext.current?.rainfallMeta.name.trim() || !pageContext.current?.rainfallMeta.src_path.trim()}
							className='cursor-pointer'
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<div className="h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
				<div className="h-16 bg-white border-b border-gray-200 flex items-center gap-8 px-6">
					<div>
						<h1 className="text-xl font-bold text-gray-900">Rainfall Monitoring Dashboard {pageContext.current?.hasRainfall && `[${pageContext.current?.rainfallMeta.name}]`}</h1>
						<p className="text-sm text-gray-600">Real-time monitoring of rainfall data from multiple stations</p>
					</div>
					{pageContext.current?.hasRainfall && (
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
											onClick={confirmCreateNewRainfall}
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
								<RefreshCw className="h-4 w-4" />
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
										<SelectTrigger
											className="bg-white border-gray-300 text-gray-900"
											disabled={!pageContext.current?.hasRainfall}
										>
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
										<SelectTrigger
											className="bg-white border-gray-300 text-gray-900"
											disabled={!pageContext.current?.hasRainfall}
										>
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
											<div className="text-lg font-bold text-blue-700">{pageContext.current?.hasRainfall ? stats.total : 'No Data'}</div>
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
											<div className="text-lg font-bold text-green-700">{pageContext.current?.hasRainfall ? stats.max : 'No Data'}</div>
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
											<div className="text-lg font-bold text-orange-700">{pageContext.current?.hasRainfall ? stats.average : 'No Data'}</div>
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
											<div className="text-lg font-bold text-purple-700">{pageContext.current?.hasRainfall ? stats.dataPoints : 'No Data'}</div>
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
								{pageContext.current?.hasRainfall ? (
									<div className="space-y-2 max-h-80 overflow-y-auto">
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
								) : (
									<div className="h-full flex flex-col items-center justify-center text-center p-6">
										<CloudRainWind className="h-16 w-16 text-blue-400 mb-4" />
										<h3 className="text-xl font-bold text-gray-800 mb-2">No Rainfall Data</h3>
									</div>
								)}
							</CardContent>
						</Card>
					</div>


					<div className="flex-1 p-4">
						<Card className="h-[95.5%] bg-white border-gray-200">
							<CardContent className="p-4 h-full">
								<div className="h-full">
									{pageContext.current?.hasRainfall ? (
										<ReactECharts
											option={getChartOption()}
											style={{ height: '100%', width: '100%' }}
											opts={{ renderer: 'canvas' }}
										/>
									) : (
										<div className="h-full flex flex-col items-center justify-center text-center p-6">
											<CloudRainWind className="h-16 w-16 text-blue-400 mb-4" />
											<h3 className="text-xl font-bold text-gray-800 mb-2">No Rainfall Data</h3>
											<p className="text-gray-600 mb-4">Please click the "Create" button to create new rainfall data to view the chart</p>
											<Button
												onClick={() => setShowRainfallDialog(true)}
												className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
											>
												<Plus className="h-4 w-4 mr-2" />
												Create New Rainfall
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