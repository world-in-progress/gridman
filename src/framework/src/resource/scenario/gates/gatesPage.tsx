import React, { useEffect, useReducer, useRef, useState } from 'react'
import {
    RotateCcw,
    CheckCircle,
    FolderOpen,
} from "lucide-react"
import { GatesPageProps } from './types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { GatesPageContext } from './gates'
import { toast } from 'sonner'
import store from '@/store'
import MapContainer from '@/components/mapContainer/mapContainer'
import * as apis from '@/core/apis/apis'


export default function GatesPage({ node }: GatesPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<GatesPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as GatesPageContext

        triggerRepaint()
    }

    const unloadContext = () => {
        console.log('组件卸载')
    }

    const handleSaveGate = async () => {
        if (!pageContext.current?.gateData.name || !pageContext.current?.gateData.src_path) {
            toast.warning('Please enter name and file path')
            return
        }

        const gateData = {
            name: pageContext.current?.gateData.name!,
            type: 'gate',
            src_path: pageContext.current?.gateData.src_path!
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.on()

        const response = await apis.common.createCommon.fetch(gateData, node.tree.isPublic)

        store.get<{ on: Function, off: Function }>('isLoading')!.off()

        if (response.success) {
            toast.success('Gate saved successfully')

            const tree = node.tree as SceneTree
            await tree.alignNodeInfo(node, true)
            tree.notifyDomUpdate()

            handleReset()
        } else {
            toast.error('Failed to save gate')
        }

        triggerRepaint()
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (pageContext.current) {
            pageContext.current.gateData.name = e.target.value
            triggerRepaint()
        }
    }

    const handleReset = () => {
        if (pageContext.current) {
            pageContext.current.gateData = {
                name: null,
                type: 'gate',
                src_path: null,
            }
            triggerRepaint()
            toast.info('Form reset')
        }
    }

    const handleFileSelect = async () => {
        if (window.electronAPI && typeof window.electronAPI.openTxtFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openTxtFileDialog()
                if (filePath) {
                    if (pageContext.current) {
                        pageContext.current.gateData.src_path = filePath
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
                                    value={pageContext.current?.gateData.name || ''}
                                    onChange={handleNameChange}
                                    placeholder='Enter gate name'
                                />
                            </div>
                            <div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
                                <div className='w-20 font-bold'>File Path</div>
                                <div className="flex flex-1 gap-2">
                                    <Input
                                        className='flex-1'
                                        value={pageContext.current?.gateData.src_path || ''}
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
                                <Button className='gap-1 bg-red-500 hover:bg-red-600 text-white cursor-pointer' onClick={handleReset}>
                                    <RotateCcw className='w-4 h-4 text-white' />Reset
                                </Button>
                                <Button className='gap-1 bg-sky-500 hover:bg-sky-600 text-white cursor-pointer' onClick={handleSaveGate}>
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
