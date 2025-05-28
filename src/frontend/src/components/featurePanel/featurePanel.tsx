import { toast } from 'sonner';
import { ArrowLeft, Mountain, MountainSnow, Upload } from 'lucide-react';
import { LanguageContext } from '../../context';
import { FeaturePanelProps } from './types/types';
import { useContext, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import BasicInfo from '../aggregationPanel/components/basicInfo';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';



export default function FeaturePanel({
    onBack,
    ...props
}: FeaturePanelProps) {

    const { language } = useContext(LanguageContext);

    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    const handleSaveFeatureState = () => {
        toast.success(
            language === 'zh'
                ? '要素资源保存成功'
                : 'Feature resource saved successfully',
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
                        {language === 'zh' ? '要素编辑' : 'Feature Editor'}
                    </h1>
                </div>

                <div className="p-2 -mt-3">
                    <BasicInfo />
                    <div className="flex items-center mt-2 p-1 mb-2  bg-white rounded-md shadow-sm">
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
                        onClick={handleSaveFeatureState}
                    >
                        <span>
                            {language === 'zh'
                                ? '保存要素资源'
                                : 'Save Feature Resouce'}
                        </span>
                    </div>
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
