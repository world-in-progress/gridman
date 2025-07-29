import React, { useEffect, useReducer, useRef, useState } from 'react'
import {
    X,
    Info,
    MapPin,
    Upload,
    RotateCcw,
    CheckCircle,
} from "lucide-react"
import { GatesPageProps } from './types'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { cn } from '@/utils/utils'
import { SceneNode } from '@/components/resourceScene/scene'
import { GatesPageContext } from './gates'
import { toast } from 'sonner'
import store from '@/store'
import MapContainer from '@/components/mapContainer/mapContainer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const REORDER_TYPE = 'application/x-gate-reorder'

export default function GatesPage({ node }: GatesPageProps) {

    const [isDragOver, setIsDragOver] = useState(false)
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<GatesPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await GatesPageContext.create(node)
    }

    const unloadContext = () => {
        console.log('组件卸载')
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

        if (e.dataTransfer.types.includes(REORDER_TYPE)) {
            return
        }

        const nodeKey = e.dataTransfer.getData('text/plain')
        
        // TODO: 根据需要处理拖放功能
        toast.info('Gate drop functionality to be implemented')
    }

    const handleSaveGate = () => {
        if (!pageContext.current?.gateData.name) {
            toast.warning('Please enter gate name')
            return
        }
        
        // TODO: 实现保存网闸数据的功能
        toast.success('Gate saved successfully')
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (pageContext.current) {
            pageContext.current.gateData.name = e.target.value
            triggerRepaint()
        }
    }

    const handleTypeChange = (value: string) => {
        if (pageContext.current) {
            pageContext.current.gateData.properties.type = value
            triggerRepaint()
        }
    }

    const handleReset = () => {
        if (pageContext.current) {
            pageContext.current.gateData = {
                name: '',
                properties: {
                    location: '',
                    type: '',
                    status: '',
                }
            }
            triggerRepaint()
            toast.info('Form reset')
        }
    }

    return (
        <div className='relative w-full h-full flex flex-col'>
            <div className='absolute z-30 top-0 left-0 w-full p-4'>
                <Card className='w-full'>
                    <CardContent className='p-4'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-row gap-2 items-center'>
                                <div className='w-20 font-bold'>名称</div>
                                <Input
                                    className='flex-1'
                                    value={pageContext.current?.gateData.name || ''}
                                    onChange={handleNameChange}
                                    placeholder='输入网闸名称'
                                />
                            </div>
                            
                            <div className='flex flex-row gap-2 items-center'>
                                <div className='w-20 font-bold'>类型</div>
                                <Select
                                    value={pageContext.current?.gateData.properties.type || ''}
                                    onValueChange={handleTypeChange}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="选择网闸类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="floodgate">防洪闸</SelectItem>
                                        <SelectItem value="tidegate">潮汐闸</SelectItem>
                                        <SelectItem value="drainage">排水闸</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='flex flex-row gap-2 justify-end'>
                                <Button variant='outline' className='gap-1' onClick={handleReset}>
                                    <RotateCcw className='w-4 h-4' />重置
                                </Button>
                                <Button className='gap-1' onClick={handleSaveGate}>
                                    <CheckCircle className='w-4 h-4' />保存
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className='flex-1 relative'>
                <MapContainer node={node} />
                <div
                    className={cn(
                        'absolute z-20 top-24 left-1/2 -translate-x-1/2 transition-all p-4 rounded-xl border-2 border-dashed',
                        isDragOver ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className='flex flex-col items-center gap-2'>
                        <Upload className='w-6 h-6' />
                        <div className='text-sm'>拖拽要素到此处以上传</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
