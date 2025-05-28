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
import { cn } from '@/utils/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LayerList from './components/layerList';
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
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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

    const handleUploadRasterResource = () => {
        console.log('你好，这里是栅格资源上传逻辑');
        // You might want to close the dialog after upload or on success/failure
        // setUploadDialogOpen(false);
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <AlertDialog
                    open={uploadDialogOpen}
                    onOpenChange={setUploadDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                <span className="text-2xl">
                                    {language === 'zh'
                                        ? '操作确认'
                                        : 'Operation Confirm'}
                                </span>
                            </AlertDialogTitle>
                            {/* <AlertDialogDescription>
                                {language === 'zh'
                                    ? '栅格资源上传确认'
                                    : 'Raster resources upload confirm'}
                            </AlertDialogDescription> */}
                        </AlertDialogHeader>
                        <div className="flex flex-col space-y-2">
                            <div className="p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                <div className="flex mt-1 mb-1 ml-1 items-center text-md font-bold">
                                    {language === 'zh'
                                        ? '栅格数据上传'
                                        : 'Raster Data Upload'}
                                </div>
                                <div
                                    className={cn(
                                        'relative flex items-center justify-center w-full h-[200px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-300/50 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200'
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
                            <RadioGroup
                                defaultValue="option-one"
                                className="flex flex-row mt-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="option-one"
                                        id="option-one"
                                    />
                                    <Label htmlFor="option-one">
                                        {language === 'zh'
                                            ? '基础地形数据'
                                            : 'Basic Terrain Data'}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="option-two"
                                        id="option-two"
                                    />
                                    <Label htmlFor="option-two">
                                        {language === 'zh'
                                            ? '精细地形数据'
                                            : 'Detailed Terrain Data'}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleUploadRasterResource}
                                className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                            >
                                {language === 'zh' ? '上传' : 'Upload'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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

                    {/* Layer list */}
                    <LayerList onUpload={setUploadDialogOpen} />

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
