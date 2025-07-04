import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SchemaService } from './schemaService'
import { SchemasPageContext } from './schemas'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GridLevel, SchemasPageProps } from './types'
import { MapPin, MapPinHouse, Save, X } from 'lucide-react'
import { enableMapPointSelection, convertCoordinate } from '@/components/mapContainer/utils'
import { createSchemaData, validateGridLayers, validateSchemaForm } from './utils'

const schemaTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

const gridLevelText = {
    title: 'Grid Level',
    addButton: 'Add Grid Level',
    noLayers: 'No layers added yet. Click the button above to add a layer.',
    rulesTitle: 'Grid levels should follow these rules:',
    rule1: 'Each level should have smaller cell dimensions than the previous level',
    rule2: "Previous level's width/height must be a multiple of the current level's width/height",
    rule3: 'First level defines the base grid cell size, and higher levels define increasingly finer grids'
};

const gridItemText = {
    level: 'Level',
    remove: 'Remove',
    width: 'Width/m',
    height: 'Height/m',
    widthPlaceholder: 'Width',
    heightPlaceholder: 'Height'
};

export default function SchemasPage({
    node,
    mapInstance,
}: SchemasPageProps) {

    const [lon, setLon] = useState('')
    const [lat, setLat] = useState('')
    const [epsg, setEpsg] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [gridLevel, setGridLayers] = useState<GridLevel[]>([])
    const [isSelectingPoint, setIsSelectingPoint] = useState(false)
    const [generalMessage, setGeneralMessage] = useState<string | null>(null)
    const [layerErrors, setLayerErrors] = useState<Record<number, string>>({})
    const [formErrors, setFormErrors] = useState<{
        name: boolean
        description: boolean
        coordinates: boolean
        epsg: boolean
    }>({
        name: false,
        description: false,
        coordinates: false,
        epsg: false,
    })
    const [convertedCoord, setConvertedCoord] = useState<{
        x: string
        y: string
    } | null>(null)
    const [schemaContext, setSchemaContext] = useState<SchemasPageContext | null>(null)

    const sortedLayers = [...gridLevel].sort((a, b) => a.id - b.id);

    let bgColor = 'bg-red-50'
    let textColor = 'text-red-700'
    let borderColor = 'border-red-200'

    if (generalMessage?.includes('正在提交数据') || generalMessage?.includes('Submitting data')) {
        bgColor = 'bg-orange-50'
        textColor = 'text-orange-700'
        borderColor = 'border-orange-200'
    } else if (
        generalMessage?.includes('创建成功') ||
        generalMessage?.includes('Created successfully')
    ) {
        bgColor = 'bg-green-50'
        textColor = 'text-green-700'
        borderColor = 'border-green-200'
    }

    const schemaService = new SchemaService()

    const resetForm = () => {
        setSchemaContext(null)
    }

    useEffect(() => {
        const _node = node as SceneNode
        const context = _node.pageContext as SchemasPageContext
        if (context) {
            setSchemaContext(context)
            setName(context.name || '')
            setEpsg(context.epsg?.toString() || '')
            setDescription(context.description || '')

            // Add null check for base_point
            if (context.base_point && Array.isArray(context.base_point) && context.base_point.length >= 2) {
                setConvertedCoord({
                    x: context.base_point[0].toString(),
                    y: context.base_point[1].toString()
                })
            }

            // Add null check for grid_info
            if (context.grid_info && Array.isArray(context.grid_info)) {
                setGridLayers(context.grid_info.map((layer, index) => ({
                    id: index,
                    width: layer[0].toString(),
                    height: layer[1].toString()
                })))
            }
        }
    }, [node])

    useEffect(() => {
        if (lon && lat && epsg) {
            const result = convertCoordinate(lon, lat, '4326', epsg)
            setConvertedCoord(result)
            
            if (node && result) {
                const _node = node as SceneNode
                if (_node.pageContext) {
                    const context = _node.pageContext as SchemasPageContext
                    context.base_point = [parseFloat(result.x), parseFloat(result.y)]
                }
            }
        } else {
            setConvertedCoord(null)
        }
    }, [lon, lat, epsg, node])

    useEffect(() => {
        if (schemaContext && node) {
            const _node = node as SceneNode
            _node.pageContext = schemaContext
        }
    }, [schemaContext, node])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const validation = validateSchemaForm(
            { name, epsg, lon, lat, gridLevel, convertedCoord },
        )

        if (!validation.isValid) {
            setFormErrors(validation.errors)
            setGeneralMessage(validation.generalError)
            return
        }

        const schemaData = createSchemaData(
            name,
            description,
            epsg,
            convertedCoord,
            gridLevel,
        )

        if (!schemaData) {
            setGeneralMessage('Unable to create Schema data')
            return
        }

        setGeneralMessage('Submitting data...')

        schemaService.submitSchemaData(
            schemaData,
            node.tree.isRemote || false,
            (err: Error | null | undefined, result: any) => {
                if (err) {
                    console.log('这是err', schemaData)
                    console.log(err)
                } else {
                    if (result && result.success === false) {
                        console.log(result.message)
                    } else {
                        setGeneralMessage('Created successfully!')
                            ; (node.tree as SceneTree).notifyDomUpdate()
                        // if (onCreationSuccess) {
                        //     console.log('你好')
                        //     onCreationSuccess()
                        //     if (sceneTree) {
                        //         const schemasKey = 'root.topo.schemas'
                        //         const schemasNode = sceneTree.scene.get(schemasKey)!
                        //         sceneTree.alignNodeInfo(schemasNode, true)
                        //     }
                        // }
                        setTimeout(() => {
                            resetForm()
                        }, 500)
                    }
                    setIsSelectingPoint(false)
                }
            }
        )
    }

    const handleDraw = () => {
        // 如果已经在选点模式，则取消选点
        if (isSelectingPoint) {
            setIsSelectingPoint(false)
            
            // 更新节点状态
            if (node) {
                const _node = node as SceneNode
                if (_node.pageContext) {
                    const context = _node.pageContext as SchemasPageContext
                    context.isDrawingPoint = false
                }
            }
            
            return
        }
        
        // 进入选点模式
        setIsSelectingPoint(true)
        
        // 获取地图容器引用
        const mapContainerRef = (node?.tree as any)?.mapContainerRef
        
        if (mapContainerRef?.current) {
            // 通知节点当前处于绘制状态
            if (node) {
                const _node = node as SceneNode
                if (!_node.pageContext) {
                    _node.pageContext = new SchemasPageContext()
                }
                
                const context = _node.pageContext as SchemasPageContext
                context.isDrawingPoint = true
                
                // 使用地图容器的方法启用绘制模式
                mapContainerRef.current.enableDrawMode((lng: number, lat: number) => {
                    // 设置经纬度
                    setLon(lng.toFixed(6))
                    setLat(lat.toFixed(6))
                    
                    // 更新节点中的坐标信息，实现持久化存储
                    if (_node.pageContext) {
                        const context = _node.pageContext as SchemasPageContext
                        context.lon = lng.toFixed(6)
                        context.lat = lat.toFixed(6)
                        context.isDrawingPoint = false
                        
                        // 如果有EPSG，同时更新转换后的坐标
                        if (epsg) {
                            const result = convertCoordinate(lng.toFixed(6), lat.toFixed(6), '4326', epsg)
                            if (result) {
                                context.base_point = [parseFloat(result.x), parseFloat(result.y)]
                            }
                        }
                    }
                    
                    setIsSelectingPoint(false)
                })
            }
        } 
        // else if (mapInstance) {
        //     // 兼容原有方式
        //     if (node) {
        //         const _node = node as SceneNode
        //         if (!_node.pageContext) {
        //             _node.pageContext = new SchemasPageContext()
        //         }
                
        //         const context = _node.pageContext as SchemasPageContext
        //         context.isDrawingPoint = true
                
        //         enableMapPointSelection(mapInstance, (lng, lat) => {
        //             // 设置经纬度
        //             setLon(lng.toFixed(6))
        //             setLat(lat.toFixed(6))
                    
        //             // 更新节点中的坐标信息，实现持久化存储
        //             if (_node.pageContext) {
        //                 const context = _node.pageContext as SchemasPageContext
        //                 context.lon = lng.toFixed(6)
        //                 context.lat = lat.toFixed(6)
        //                 context.isDrawingPoint = false
                        
        //                 // 如果有EPSG，同时更新转换后的坐标
        //                 if (epsg) {
        //                     const result = convertCoordinate(lng.toFixed(6), lat.toFixed(6), '4326', epsg)
        //                     if (result) {
        //                         context.base_point = [parseFloat(result.x), parseFloat(result.y)]
        //                     }
        //                 }
        //             }
                    
        //             setIsSelectingPoint(false)
        //         })
        //     }
        // }
    }

    const handleAddLayer = () => {
        setGridLayers((prevLayers) => {
            const nextId =
                prevLayers.length > 0
                    ? Math.max(...prevLayers.map((layer) => layer.id)) + 1
                    : 0;

            const updatedLayers = [
                ...prevLayers,
                { id: nextId, width: '', height: '' },
            ]

            const { errors } = validateGridLayers(updatedLayers)
            setLayerErrors(errors)

            // Update the grid_info in schemaContext
            setSchemaContext(prev => {
                if (!prev) return null;

                // Convert GridLevel[] to number[][] for grid_info
                const gridInfo = updatedLayers.map(layer => [
                    parseInt(layer.width) || 0,
                    parseInt(layer.height) || 0
                ]);

                return { ...prev, grid_info: gridInfo };
            });

            return updatedLayers;
        })
    }

    const handleUpdateWidth = (id: number, width: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, width } : layer
            )

            const { errors } = validateGridLayers(updatedLayers)
            setLayerErrors(errors)

            // Update the grid_info in schemaContext
            setSchemaContext(prev => {
                if (!prev) return null;

                // Convert GridLevel[] to number[][] for grid_info
                const gridInfo = updatedLayers.map(layer => [
                    parseInt(layer.width) || 0,
                    parseInt(layer.height) || 0
                ]);

                return { ...prev, grid_info: gridInfo };
            });

            return updatedLayers;
        })
    }

    const handleUpdateHeight = (id: number, height: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, height } : layer
            )

            const { errors } = validateGridLayers(updatedLayers)
            setLayerErrors(errors)

            // Update the grid_info in schemaContext
            setSchemaContext(prev => {
                if (!prev) return null;

                // Convert GridLevel[] to number[][] for grid_info
                const gridInfo = updatedLayers.map(layer => [
                    parseInt(layer.width) || 0,
                    parseInt(layer.height) || 0
                ]);

                return { ...prev, grid_info: gridInfo };
            });

            return updatedLayers;
        })
    }

    const handleRemoveLayer = (id: number) => {
        setGridLayers((prevLayers) => {
            const filteredLayers = prevLayers.filter(
                (layer) => layer.id !== id
            )

            const { errors } = validateGridLayers(filteredLayers);
            setLayerErrors(errors)

            // Update the grid_info in schemaContext
            setSchemaContext(prev => {
                if (!prev) return null;

                // Convert GridLevel[] to number[][] for grid_info
                const gridInfo = filteredLayers.map(layer => [
                    parseInt(layer.width) || 0,
                    parseInt(layer.height) || 0
                ]);

                return { ...prev, grid_info: gridInfo };
            });

            return filteredLayers;
        })
    }

    return (
        <form onSubmit={handleSubmit} className='pt-0 w-2/5 h-full flex flex-col'>
            <div className="flex-1 overflow-hidden">
                {/* Create Page Introduction */}
                <div className='h-50 w-full border-b border-gray-700 flex flex-row'>
                    <div className='w-1/3 h-full flex justify-center items-center'>
                        <Avatar className='bg-[#007ACC] h-28 w-28 border-2 border-white'>
                            <AvatarFallback>
                                <MapPinHouse className='h-15 w-15 text-white' />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className='w-2/3 h-full p-4 space-y-1 text-white'>
                        <h1 className='font-bold text-[25px]'>Create New Schema {node.tree.isRemote ? '(Remote)' : '(Local)'}</h1>
                        <div className='text-sm p-2 px-4 w-full'>
                            <ul className='list-disc space-y-1'>
                                {schemaTips.map((tip, index) => (
                                    <li key={index}>
                                        {Object.values(tip)[0]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <ScrollArea className='h-full max-h-[calc(100vh-14.5rem)]'>
                    <div className='w-2/3 mx-auto mt-4 mb-4 space-y-4 pb-4'>
                        {/* Schema Name */}
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <h2 className="text-black text-lg font-semibold mb-2">
                                New Schema Name
                            </h2>
                            <div className="space-y-2">
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value)
                                        setSchemaContext(prev => prev ? { ...prev, name: e.target.value } : null)
                                    }}
                                    placeholder={
                                        'Enter new schema name'
                                    }
                                    className={`w-full text-black border-gray-300 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {/* Schema Description */}
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <h2 className="text-black text-lg font-semibold mb-2">
                                Schema Description (Optional)
                            </h2>
                            <div className="space-y-2">
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value)
                                        setSchemaContext(prev => prev ? { ...prev, description: e.target.value } : null)
                                    }}
                                    placeholder={'Enter schema description'}
                                    className={`w-full text-black border-gray-300 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {/* EPSG Code */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-black text-lg font-semibold mb-2">
                                EPSG Code
                            </h2>
                            <div className="space-y-2">
                                <Input
                                    id="epsg"
                                    placeholder={
                                        'Enter EPSG code (e.g. 4326)'
                                    }
                                    className={`text-black w-full border-gray-300 ${formErrors.epsg ? 'border-red-500 focus:ring-red-500' : ''
                                        }`}
                                    value={epsg}
                                    onChange={(e) => {
                                        setEpsg(e.target.value)
                                        setSchemaContext(prev => prev ? { ...prev, epsg: Number(e.target.value) } : null)
                                    }}
                                />
                            </div>
                        </div>
                        {/* Coordinate (EPSG:4326) */}
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <h2 className="text-black text-lg font-semibold mb-2">
                                Coordinate (EPSG:4326)
                            </h2>
                            <div className="flex items-stretch gap-4">
                                <div className="flex-1 flex flex-col justify-between text-black">
                                    <div className=" flex items-center gap-2 mb-2">
                                        <Label htmlFor="lon" className="text-sm font-medium w-1/4">
                                            Longitude
                                        </Label>
                                        <Input
                                            id="lon"
                                            type="number"
                                            step="0.000001"
                                            value={lon}
                                            onChange={(e) => {
                                                setLon(e.target.value)
                                                setSchemaContext(prev => prev ? { ...prev, lon: e.target.value } : null)
                                            }}
                                            placeholder={'Enter longitude'}
                                            className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="lat" className="text-sm font-medium w-1/4">
                                            Latitude
                                        </Label>
                                        <Input
                                            id="lat"
                                            type="number"
                                            step="0.000001"
                                            value={lat}
                                            onChange={(e) => {
                                                setLat(e.target.value)
                                                setSchemaContext(prev => prev ? { ...prev, lat: e.target.value } : null)
                                            }}
                                            placeholder={'Enter latitude'}
                                            className={`w-3/4 border-gray-300 ${formErrors.coordinates ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleDraw}
                                    className={`w-[80px] h-[84px] ${isSelectingPoint
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        } text-white cursor-pointer`}
                                >
                                    <div className="flex flex-col items-center">
                                        {isSelectingPoint ? (
                                            <X className="h-8 w-8 mb-1 font-bold stroke-6" />
                                        ) : (
                                            <MapPin className="h-8 w-8 mb-1 stroke-2" />
                                        )}
                                        <span>
                                            {isSelectingPoint
                                                ? 'Cancel'
                                                : 'Draw'
                                            }
                                        </span>
                                    </div>
                                </Button>
                            </div>
                        </div>
                        {(convertedCoord && epsg) &&
                            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-black">
                                <h2 className="text-lg font-semibold mb-2">
                                    Converted Coordinate (EPSG:{epsg}
                                    )
                                </h2>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2 ">
                                        <Label className="text-sm font-medium w-1/4">X</Label>
                                        <div className="w-3/4 p-2 bg-gray-100 rounded border border-gray-300">
                                            {convertedCoord.x}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium w-1/4">Y</Label>
                                        <div className="w-3/4 p-2 bg-gray-100 rounded border border-gray-300">
                                            {convertedCoord.y}
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        <div className="p-3 bg-white text-black rounded-md shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">{gridLevelText.title}</h3>
                                <button
                                    type="button"
                                    className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm cursor-pointer"
                                    onClick={handleAddLayer}
                                >
                                    <span className="text-lg">+</span> {gridLevelText.addButton}
                                </button>
                            </div>
                            {sortedLayers.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedLayers.map((layer, index) => (
                                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-medium">{gridItemText.level} {index + 1}</h4>
                                                <button
                                                    className="px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs cursor-pointer"
                                                    onClick={() => handleRemoveLayer(layer.id)}
                                                >
                                                    {gridItemText.remove}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs mb-1">{gridItemText.width}</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                        value={layer.width}
                                                        onChange={(e) => handleUpdateWidth(layer.id, e.target.value)}
                                                        placeholder={gridItemText.widthPlaceholder}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs mb-1">{gridItemText.height}</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                        value={layer.height}
                                                        onChange={(e) => handleUpdateHeight(layer.id, e.target.value)}
                                                        placeholder={gridItemText.heightPlaceholder}
                                                    />
                                                </div>
                                            </div>
                                            {layerErrors[layer.id] && (
                                                <div className="mt-2 p-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                                                    {layerErrors[layer.id]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-2">
                                    {gridLevelText.noLayers}
                                </div>
                            )}
                            {sortedLayers.length > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
                                    <p>{gridLevelText.rulesTitle}</p>
                                    <ul className="list-disc pl-4 mt-1">
                                        <li>
                                            {gridLevelText.rule1}
                                        </li>
                                        <li>
                                            {gridLevelText.rule2}
                                        </li>
                                        <li>
                                            {gridLevelText.rule3}
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        {generalMessage &&
                            <>
                                <div
                                    className={` p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
                                >
                                    {generalMessage}
                                </div>
                            </>
                        }
                        <div className="mt-4">
                            <Button
                                type='submit'
                                className='w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                            >
                                <Save className='h-4 w-4 mr-2' />
                                Create and Back
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </form>
    )
}
