import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft, Upload } from 'lucide-react';
import { GridPanelProps } from '../gridPanel/types/types';
import BasicInfo from '../gridPanel/components/basicInfo';
import GridEditor from '../gridPanel/components/gridEditor';
import store from '@/store';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import TopologyLayer from '../mapComponent/layers/TopologyLayer';
import GridCore from '@/core/grid/NHGridCore';
import { GridSaveInfo } from '@/core/grid/types';
import { toast } from 'sonner';
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
import LayerList from '../rasterPanel/components/layerList';

export default function GridPanel({ onBack, ...props }: GridPanelProps) {
    const { language } = useContext(LanguageContext);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [pickingTab, setPickingTab] = useState<'picking' | 'unpicking'>(
        'picking'
    );
    const [activeSelectTab, setActiveSelectTab] = useState<
        'brush' | 'box' | 'feature'
    >('brush');

    useEffect(() => {
        store.set('modeSelect', 'brush');
        store.set('pickingSelect', true);
    }, []);

    const handleActivateSelectTab = (
        tab: 'brush' | 'box' | 'feature'
    ): 'brush' | 'box' | 'feature' => {
        const currentTab = activeSelectTab;
        setActiveSelectTab(tab);
        store.set('modeSelect', tab);
        return currentTab;
    };

    const handleBack = () => {
        const clg = store.get<NHLayerGroup>('clg')!;
        const layer = clg.getLayerInstance('TopologyLayer')! as TopologyLayer;
        layer.removeResource();

        if (onBack) {
            onBack();
        }
    };

    const handleSaveTopologyState = () => {
        const core: GridCore = store.get('gridCore')!;
        core.save((saveInfo: GridSaveInfo) => {
            toast.success(
                language === 'zh'
                    ? '拓扑编辑状态保存成功'
                    : 'Topology edit state saved successfully',
                {
                    style: {
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        bottom: '30px',
                    },
                }
            );
        });
    };

    const handleUploadRasterResource = () => {
        console.log('你好，这里是栅格资源上传逻辑');
        // You might want to close the dialog after upload or on success/failure
        setUploadDialogOpen(false);
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
                        {language === 'zh' ? '网格编辑' : 'Grid Editor'}
                    </h1>
                </div>

                <div className="p-2 -mt-3 space-y-2">
                    <BasicInfo />
                    {/* <LayerList onUpload={setUploadDialogOpen} /> */}
                    <div
                        className="bg-green-500 hover:bg-green-600 p-3 flex items-center justify-center text-md text-white font-bold cursor-pointer rounded-md shadow-md"
                        onClick={handleSaveTopologyState}
                    >
                        <span>
                            {language === 'zh'
                                ? '保存拓扑编辑状态'
                                : 'Save Topology Edit State'}
                        </span>
                    </div>

                    <GridEditor
                        pickingTab={pickingTab}
                        setPickingTab={setPickingTab}
                        activeSelectTab={activeSelectTab}
                        setActiveSelectTab={handleActivateSelectTab}
                    />
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
