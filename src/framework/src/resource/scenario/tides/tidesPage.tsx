import { TidesPageProps } from './types'
import React, { useEffect, useReducer, useRef } from 'react'
import {
    RotateCcw,
    CheckCircle,
    FolderOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode } from '@/components/resourceScene/scene'
import { TidesPageContext } from './tides'
import { toast } from 'sonner'
import MapContainer from '@/components/mapContainer/mapContainer'
import * as apis from '@/core/apis/apis'

export default function TidesPage({ node }: TidesPageProps) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<TidesPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await TidesPageContext.create(node)
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const handleReset = () => {
        if (pageContext.current) {
            pageContext.current.tideData = {
                name: '',
                type: 'tide',
                src_path: '',
            }
            triggerRepaint()
            toast.info('Form reset')
        }
    }

    const handleFileSelect = async () => {
        if (window.electronAPI && typeof window.electronAPI.openCsvFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openCsvFileDialog()
                if (filePath) {
                    if (pageContext.current) {
                        pageContext.current.tideData.src_path = filePath
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

    const handleSaveInp = async () => {
        if (!pageContext.current?.tideData.name) {
            toast.warning('Please enter tide name')
            return
        }

        const gateData = {
            name: pageContext.current?.tideData.name,
            type: 'tide',
            src_path: pageContext.current?.tideData.src_path
        }

        const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)
        if (response.success) {
            toast.success('Gate saved successfully')
        } else {
            toast.error('Failed to save gate')
        }
        toast.success('Gate saved successfully')
    }

    return (
        <div className='relative w-full h-full flex flex-col'>
            <div className='absolute z-30 top-0 left-0 p-4 w-80'>
                <Card className='w-full shadow-md'>
                    <CardHeader>
                        <CardTitle>Create New Gate</CardTitle>
                    </CardHeader>
                    <CardContent className='p-4'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
                                <div className='w-20 font-bold'>Name</div>
                                <Input
                                    className='flex-1 w-full'
                                    value={pageContext.current?.tideData.name}
                                    onChange={(e) => {
                                        pageContext.current!.tideData.name = e.target.value
                                        triggerRepaint()
                                    }}
                                    placeholder='Enter gate name'
                                />
                            </div>
                            <div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
                                <div className='w-20 font-bold'>File Path</div>
                                <div className="flex flex-1 gap-2">
                                    <Input
                                        className='flex-1'
                                        value={pageContext.current?.tideData.src_path || ''}
                                        readOnly={true}
                                        placeholder='Select file path'
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

                            <div className='flex flex-row gap-2 justify-end'>
                                <Button variant='outline' className='gap-1 bg-red-500 hover:bg-red-600 text-white' onClick={handleReset}>
                                    <RotateCcw className='w-4 h-4 text-white' />Reset
                                </Button>
                                <Button className='gap-1 bg-sky-500 hover:bg-sky-600 text-white' onClick={handleSaveInp}>
                                    <CheckCircle className='w-4 h-4 text-white' />Save
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className='flex-1 relative'>
                <MapContainer node={node} />
            </div>
        </div>
    )
} 