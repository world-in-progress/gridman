import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SquaresIntersect } from "lucide-react"
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { PatchesInformationProps } from "./types"
import { useTranslation } from 'react-i18next'

const patchTips = [
    { tip: 'A unique name for identification' },
    { tip: 'Geographical bounds defining the patch area' },
    { tip: 'Description of the patch purpose and content' },
    { tip: 'Grid cell specifications for the patch' },
]

export default function PatchInformation({ node }: PatchesInformationProps) {
    const { t } = useTranslation('patchesPage')

    const handleCreateNow = (): void => {
        // 将当前节点的 pageId 设置为 'default'，表示创建新 Patch
        (node as SceneNode).pageId = 'default';
        // 调用 startEditingNode 方法开始编辑
        (node.tree as SceneTree).startEditingNode(node as SceneNode);
    }

    return (
        <div className='w-full h-full flex flex-col'>
            <div className='w-full border-b border-gray-700 flex flex-row'>
                {/* ------------*/}
                {/* Page Avatar */}
                {/* ------------*/}
                <div className='w-1/3 h-full flex justify-center items-center my-auto'>
                    <Avatar className='h-28 w-28 border-2 border-white'>
                        <AvatarFallback className='bg-[#007ACC]'>
                            <SquaresIntersect className='h-15 w-15 text-white' />
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
                        {t('About Patches')}
                    </h1>
                    {/* ----------*/}
                    {/* Page Tips */}
                    {/* ----------*/}
                    <div className='text-sm p-2 px-4 w-[40%] space-y-2'>
                        <p>{t('Each patch requires:')}</p>
                        <ul className='list-disc space-y-1'>
                            {patchTips.map((tip, index) => (
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
                        {t('Create new Patch now!')}
                    </Button>
                </div>
            </div>

            <ScrollArea className='h-[80%] overflow-auto'>
                <div className="w-[50%] p-4 space-y-5 ml-[20%] mr-[30%] mb-[5%]">
                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('About Patches')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{t('Patches are specific geographical areas within a schema where grid cells are generated. They define the boundaries for data collection, analysis, and visualization.')}</p>
                        </CardContent>
                    </Card>

                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('Each patch requires:')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>{t('A unique name for identification')}</li>
                                <li>{t('Geographical bounds defining the patch area')}</li>
                                <li>{t('Description of the patch purpose and content')}</li>
                                <li>{t('Grid cell specifications for the patch')}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="text-gray-300 bg-neutral-800 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-white/30 hover:border-white/50">
                        <CardHeader>
                            <CardTitle>{t('Why You Need to Create a Patch?')}</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                            <p>
                                {t('Patches are essential for focusing computational resources on specific areas of interest within your larger schema. By defining patches, you can generate detailed grid cells only where needed, optimizing performance and storage.')}
                            </p>
                            <p>
                                {t('Creating patches allows you to organize your spatial data into manageable units, each with its own purpose and characteristics. This modular approach enables efficient data management, analysis, and visualization across different geographical regions. Patches can represent different study areas, administrative boundaries, or any other spatial divisions relevant to your project.')}
                            </p>
                        </CardContent>
                    </Card>
                    <p className='text-center text-sm text-gray-300'>
                        {t('If you have already created a patch, you can skip this step.')}
                    </p>
                    <Button
                        type='button'
                        className='ml-[35%] px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm shadow-sm cursor-pointer'
                        onClick={handleCreateNow}
                    >
                        {t('Create new Patch now!')}
                    </Button>
                </div>
            </ScrollArea>
        </div>
    )
}