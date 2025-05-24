import { toast } from 'sonner';
import { ArrowLeft, Mountain, MountainSnow, Upload } from 'lucide-react';
import { LanguageContext } from '../../context';
import { AttributePanelProps } from './types/types';
import { useContext, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import store from '@/store';
import BasicInfo from '../aggregationPanel/components/basicInfo';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
// import GridCore from '@/core/grid/NHGridCore';
// import { GridSaveInfo } from '@/core/grid/types';
// import TopologyLayer from '../mapComponent/layers/TopologyLayer'; // Change to AttributeLayer

const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
);

export default function AttributePanel({
    onBack,
    ...props
}: AttributePanelProps) {
    const { language } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState('Terrain');

    const handleBack = () => {
        const clg = store.get<NHLayerGroup>('clg')!;
        // Change to AttributeLayer
        // const layer = clg.getLayerInstance('TopologyLayer')! as TopologyLayer;
        // layer.removeResource();
        if (onBack) {
            onBack();
        }
    };

    const handleSaveAttributeState = () => {
        // Add save raster resource logic here
        toast.success(
            language === 'zh'
                ? '栅格资源保存成功'
                : 'Raster resource saved successfully',
            {
                style: {
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    bottom: '30px',
                },
            }
        );
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <div className="flex items-center p-3 justify-between">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-300 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh' ? '属性编辑' : 'Attribute Editor'}
                    </h1>
                </div>

                <div className="p-2 -mt-3">
                    <BasicInfo />
                    <div className="flex items-center mt-2 p-1 mb-2  bg-white rounded-md shadow-sm">
                        <button
                            className={` flex-1 py-2 px-4 items-center rounded-md transition-colors duration-200 cursor-pointer ${
                                activeTab === 'Terrain'
                                    ? 'bg-black text-white'
                                    : 'bg-transparent hover:bg-gray-300 '
                            }`}
                            onClick={() => setActiveTab('Terrain')}
                        >
                            <div className=" flex gap-1 justify-center">
                                <Mountain />
                                {language === 'zh' ? '地形' : 'Terrain'}
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 items-center rounded-md transition-colors duration-200 cursor-pointer ${
                                activeTab === 'Landuse'
                                    ? 'bg-black text-white'
                                    : 'bg-transparent hover:bg-gray-300 '
                            }`}
                            onClick={() => setActiveTab('Landuse')}
                        >
                            <div className="flex gap-1 justify-center">
                                <MountainSnow />
                                {language === 'zh' ? '土地利用' : 'Landuse'}
                            </div>
                        </button>
                    </div>

                    {/* Attribute Editor */}
                    <div>
                        {/* Basic terrain upload */}
                        <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                            <div className="flex mt-1 mb-1 ml-1 items-center text-2xl font-bold">
                                {language === 'zh'
                                    ? '基础地形上传'
                                    : 'Basic Terrain Upload'}
                            </div>
                            <div
                                className={cn(
                                    'relative flex items-center justify-center w-full h-[120px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-300/50 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200'
                                )}
                            >
                                <Input
                                    id="tif-upload"
                                    type="file"
                                    accept=".tif,.tiff"
                                    className="absolute inset-0 opacity-0 h-full cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <Upload className="h-8 w-8 text-gray-500" />
                                    <span className="text-xs text-gray-600 font-medium">
                                        {language === 'zh'
                                            ? '拖放或点击上传 .tif 文件'
                                            : 'Drag and drop or click to upload .tif file'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Layer list and detailed terrain upload */}
                        <div className="mt-2 p-2 space-y-2 bg-white rounded-md shadow-sm border border-gray-200">
                            <div className="border rounded-md p-2 shadow-md">
                                <div className="flex mb-1 ml-1 items-center text-2xl font-bold">
                                    {language === 'zh'
                                        ? '精细地形上传'
                                        : 'Detailed Terrain Upload'}
                                </div>
                                <div
                                    className={cn(
                                        'relative flex items-center justify-center w-full h-[120px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-300/50 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200'
                                    )}
                                >
                                    <Input
                                        id="tif-upload"
                                        type="file"
                                        accept=".tif,.tiff"
                                        className="absolute inset-0 opacity-0 h-full cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <Upload className="h-8 w-8 text-gray-500" />
                                        <span className="text-xs text-gray-600 font-medium">
                                            {language === 'zh'
                                                ? '拖放或点击上传 .tif 文件'
                                                : 'Drag and drop or click to upload .tif file'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-md p-2 shadow-md">
                                <div className="flex mb-1 ml-1 items-center text-2xl font-bold">
                                    {language === 'zh'
                                        ? '图层列表'
                                        : 'Layer List'}
                                </div>
                                <ScrollArea className="h-50 w-full rounded-md border-2 border-gray-300">
                                    <div className="p-4">
                                        <h4 className="mb-4 text-sm font-medium leading-none">
                                            Tags
                                        </h4>
                                        {tags.map((tag) => (
                                            <>
                                                <div
                                                    key={tag}
                                                    className="text-sm"
                                                >
                                                    {tag}
                                                </div>
                                                <Separator className="my-2" />
                                            </>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                            <div className="border rounded-md p-2 shadow-md">
                                <div className="flex ml-1 items-center text-2xl font-bold">
                                    {language === 'zh'
                                        ? '编辑图层'
                                        : 'Edit Layer'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save raster resource button */}
                    <div
                        className="bg-green-500 hover:bg-green-600 mt-2 p-3 flex items-center justify-center text-md text-white font-bold cursor-pointer rounded-md shadow-md"
                        onClick={handleSaveAttributeState}
                    >
                        <span>
                            {language === 'zh'
                                ? '保存栅格资源'
                                : 'Save Raster Resouce'}
                        </span>
                    </div>
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
