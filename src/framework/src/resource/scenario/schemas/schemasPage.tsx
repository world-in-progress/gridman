import {
    SchemaNameCard,
    SchemaDescriptionCard,
    SchemaEpsgCard,
    SchemaCoordinateCard,
    SchemaConvertedCoordCard,
    GridLevel,
    SchemaErrorMessage
} from './createSchemaComponents'
import { Button } from '@/components/ui/button'
import { SchemaService } from './schemaService'
import { MapPinHouse, Save } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TopologyLayer, SchemasPageProps } from './types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createSchemaData, validateGridLayers, validateSchemaForm } from './utils'
import { enableMapPointSelection, convertCoordinate } from '@/components/mapContainer/utils'
import { SceneTree } from '@/components/resourceScene/scene'

const schemaTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
    { tip2: 'Description is optional.' },
    { tip3: 'Click the button to draw and obtain or manually fill in the coordinates of the reference point.' },
    { tip4: 'Set the grid size for each level.' },
]

export default function SchemasPage({
    node,
    mapInstance,
}: SchemasPageProps) {

    const [lon, setLon] = useState('')
    const [lat, setLat] = useState('')
    const [epsg, setEpsg] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isSelectingPoint, setIsSelectingPoint] = useState(false)
    const [topologyLayers, setGridLayers] = useState<TopologyLayer[]>([])
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

    const schemaService = new SchemaService()

    const resetForm = () => {
        setName('')
        setDescription('')
        setEpsg('')
        setLon('')
        setLat('')
        setGridLayers([])
        setFormErrors({
            name: false,
            description: false,
            coordinates: false,
            epsg: false,
        })
        setLayerErrors({})
        setConvertedCoord(null)
        setGeneralMessage(null)
    }

    useEffect(() => {
        if (lon && lat && epsg) {
            const result = convertCoordinate(lon, lat, '4326', epsg)
            setConvertedCoord(result)
        } else {
            setConvertedCoord(null)
        }
    }, [lon, lat, epsg])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const validation = validateSchemaForm(
            { name, epsg, lon, lat, topologyLayers, convertedCoord },
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
            topologyLayers,
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
                        console.log(err)
                    } else {
                        setGeneralMessage('Created successfully!')
                        ;(node.tree as SceneTree).notifyDomUpdate()
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
        if (isSelectingPoint && mapInstance) {
            if (mapInstance.getCanvas()) {
                mapInstance.getCanvas().style.cursor = ''
            }
            setIsSelectingPoint(false)
            return
        }
        setIsSelectingPoint(true);
        if (mapInstance) {
            enableMapPointSelection(mapInstance, (lng, lat) => {
                setLon(lng.toFixed(6))
                setLat(lat.toFixed(6))
                setIsSelectingPoint(false)
            })
        }
        console.log('点击了绘制')
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

            return updatedLayers
        })
    }

    const handleUpdateWidth = (id: number, width: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, width } : layer
            )

            const { errors } = validateGridLayers(updatedLayers)
            setLayerErrors(errors)

            return updatedLayers
        })
    }

    const handleUpdateHeight = (id: number, height: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, height } : layer
            )

            const { errors } = validateGridLayers(updatedLayers)
            setLayerErrors(errors)

            return updatedLayers
        })
    }

    const handleRemoveLayer = (id: number) => {
        setGridLayers((prevLayers) => {
            const filteredLayers = prevLayers.filter(
                (layer) => layer.id !== id
            )

            const { errors } = validateGridLayers(filteredLayers);
            setLayerErrors(errors)

            return filteredLayers
        })
    }

    return (
        <form onSubmit={handleSubmit} className='pt-0 w-2/5 h-full'>
            <ScrollArea className='h-full'>
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
                        <div className='  text-sm p-2 px-4 w-full'>
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
                <div className='w-2/3 mx-auto mt-4 mb-4 space-y-4'>
                    <SchemaNameCard
                        name={name}
                        hasError={formErrors.name}
                        onChange={setName}
                    />

                    <SchemaDescriptionCard
                        description={description}
                        hasError={formErrors.description}
                        onChange={setDescription}
                    />

                    <SchemaEpsgCard
                        epsg={epsg}
                        hasError={formErrors.epsg}
                        onChange={setEpsg}
                    />

                    <SchemaCoordinateCard
                        lon={lon}
                        lat={lat}
                        hasError={formErrors.coordinates}
                        isSelectingPoint={isSelectingPoint}
                        onLonChange={setLon}
                        onLatChange={setLat}
                        onDrawClick={handleDraw}
                    />

                    <SchemaConvertedCoordCard
                        convertedCoord={convertedCoord}
                        epsg={epsg}
                    />

                    <GridLevel
                        layers={topologyLayers}
                        layerErrors={layerErrors}
                        onAddLayer={handleAddLayer}
                        onUpdateWidth={handleUpdateWidth}
                        onUpdateHeight={handleUpdateHeight}
                        onRemoveLayer={handleRemoveLayer}
                    />

                    <SchemaErrorMessage message={generalMessage} />

                    <Button
                        type='submit'
                        className='w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                    >
                        <Save className='h-4 w-4 mr-2' />
                        Create and Back
                    </Button>
                </div>
            </ScrollArea>
        </form>
    )
}
