import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPinPlus } from "lucide-react"
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { SchemasInformationProps } from './types'
import { useTranslation } from 'react-i18next'

const schemaTips = [
    { tip: 'Grid size specifications for different levels' },
    { tip: 'Reference point coordinates' },
    { tip: 'EPSG code for coordinate reference system' },
    { tip: 'A unique name for identification' },
]



export default function SchemasInformation({ node }: SchemasInformationProps) {
    const { t } = useTranslation('schemasPage')

    const handleCreateNow = (): void => {
        // 将当前节点的 pageId 设置为 'default'，表示创建新 Schema
        (node as SceneNode).pageId = 'default';
        // 调用 startEditingNode 方法开始编辑
        (node.tree as SceneTree).startEditingNode(node as SceneNode);
    }

    return (
        <div className='w-full h-full flex flex-col'>
            {/* <div className='flex-1 overflow-hidden'> */}
            <div className='w-full border-b border-gray-700 flex flex-row'>
                {/* ------------*/}
                {/* Page Avatar */}
                {/* ------------*/}
                <div className='w-1/3 h-full flex justify-center items-center my-auto'>
                    <Avatar className='h-28 w-28 border-2 border-white'>
                        <AvatarFallback className='bg-[#007ACC]'>
                            <MapPinPlus className='h-15 w-15 text-white' />
                        </AvatarFallback>
                    </Avatar>
                </div>
                {/* -----------------*/}
                {/* Page Description */}
                {/* -----------------*/}
                <div className='w-2/3 h-full p-4 space-y-2 text-white'>
                    {/* -----------*/}
                    {/* Page Title */}
                    {/* -----------*/}
                    <h1 className='font-bold text-[25px] relative flex items-center'>
                        {t('About Schemas')}
                    </h1>
                    {/* ----------*/}
                    {/* Page Tips */}
                    {/* ----------*/}
                    <div className='text-sm p-2 px-4 w-[40%] space-y-2'>
                        <p>{t('Each schema requires:')}</p>
                        <ul className='list-disc space-y-1'>
                            {schemaTips.map((tip, index) => (
                                <li key={index}>
                                    {t(tip.tip)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Button
                        type='button'
                        className='px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                        onClick={handleCreateNow}
                    >
                        {t('Create new Schemas now!')}
                    </Button>
                </div>

            </div>

            <ScrollArea className='h-[80%] overflow-auto'>
                <div className="w-[50%] p-4 space-y-5 ml-[20%] mr-[30%] mb-[5%]">
                    {/* <h2 className="text-3xl font-semibold text-white">About Schemas</h2>
                            <div className="text-sm text-gray-300 space-y-3">
                                <p>Schemas are the fundamental structure for organizing spatial data in the grid system. They define how geographical areas are divided into hierarchical grid cells.</p>
                                <p>Each schema requires:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>A unique name for identification</li>
                                    <li>EPSG code for coordinate reference system</li>
                                    <li>Reference point coordinates</li>
                                    <li>Grid size specifications for different levels</li>
                                </ul>
                            </div> */}
                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('About Schemas')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{t('Schemas are the fundamental structure for organizing spatial data in the grid system. They define how geographical areas are divided into hierarchical grid cells.')}</p>
                        </CardContent>
                    </Card>

                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('Each schema requires:')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>{t('A unique name for identification')}</li>
                                <li>{t('EPSG code for coordinate reference system')}</li>
                                <li>{t('Reference point coordinates')}</li>
                                <li>{t('Grid size specifications for different levels')}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('Why You Need to Create a Schema?')}</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                            <p>
                                {t('Schemas serve as the essential framework for managing spatial data within a grid - based system. By creating a schema, you establish a standardized and organized way to structure geographical information.')}
                            </p>
                            <p>
                                {t('It ensures that spatial data is divided into hierarchical grid cells consistently, which is crucial for accurate analysis, mapping, and sharing of geographic data. Defining elements like grid sizes for different levels, reference points, coordinate systems via EPSG codes, and unique identifiers brings clarity and precision. This, in turn, helps avoid confusion, errors in data interpretation, and enables seamless integration of spatial data into various applications, whether for urban planning, environmental studies, or any field relying on geographical information organization.')}
                            </p>
                        </CardContent>
                    </Card>
                    <p className='text-center text-sm text-gray-300'>
                        {t('If you have already created a schema, you can skip this step.')}
                    </p>
                    <Button
                        type='button'
                        className='ml-[35%] px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                        onClick={handleCreateNow}
                    >
                        {t('Create new Schemas now!')}
                    </Button>
                </div>

            </ScrollArea>

            {/* </div> */}
        </div>
    )
}
