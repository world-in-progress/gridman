    import { useContext, useRef, useState } from 'react';
    import { LanguageContext } from '../../../context';
    import { Separator } from '@/components/ui/separator';
    import {
        Brush,
        Trash2,
        SquareDashed,
        FolderOpen,
        SquareMousePointer,
        SquareDashedMousePointer,
    } from 'lucide-react';
    import BrushCard from './brushCard';
    import { TopologyPanelProps } from '../types/types';
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

    export default function TopologyPanel({
        pickingTab,
        setPickingTab,
        activeSelectTab,
        setActiveSelectTab,
    }: TopologyPanelProps) {
        const { language } = useContext(LanguageContext);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [deleteSelectDialogOpen, setDeleteSelectDialogOpen] = useState(false);
        const [deleteGridDialogOpen, setDeleteGridDialogOpen] = useState(false);

        const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                // Process the selected file
                console.log('选择的文件:', files[0].name);
                // Clear the file input so the same file can be selected again
                event.target.value = '';
            }
            setActiveSelectTab('brush');
        };

        const handleFeatureClick = () => {
            setActiveSelectTab('feature');
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        };

        const handleDeleteSelectClick = () => {
            setPickingTab('delete');
            setDeleteSelectDialogOpen(true);
        };

        const handleDeleteGridClick = () => {
            setDeleteGridDialogOpen(true);
        };

        const handleConfirmDeleteSelect = () => {
            // Add real delete logic
            setPickingTab('picking');
            setDeleteSelectDialogOpen(false);
        };

        const handleConfirmDeleteGrid = () => {
            // Add real delete logic
            setDeleteGridDialogOpen(false);
        };

        return (
            <div className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
                <AlertDialog
                    open={deleteSelectDialogOpen}
                    onOpenChange={setDeleteSelectDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'zh' ? '确认操作' : 'Confirm Action'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {language === 'zh'
                                    ? '是否确认取消全部框选？'
                                    : 'Are you sure you want to cancel all selections?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                className="cursor-pointer"
                                onClick={() => setPickingTab('picking')}
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDeleteSelect}
                                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                                {language === 'zh' ? '确认' : 'Confirm'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog
                    open={deleteGridDialogOpen}
                    onOpenChange={setDeleteGridDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'zh' ? '确认操作' : 'Confirm Action'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {language === 'zh'
                                    ? '是否确认删除选中的网格？'
                                    : 'Are you sure you want to delete the selected grids?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDeleteGrid}
                                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                                {language === 'zh' ? '确认' : 'Confirm'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* 隐藏的文件输入元素 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".shp,.geojson,.json,.kml,.gpx"
                    title={
                        language === 'zh' ? '选择要素文件' : 'Select feature file'
                    }
                    aria-label={
                        language === 'zh' ? '选择要素文件' : 'Select feature file'
                    }
                />

                <h3 className="text-2xl mt-1 ml-1 font-bold">
                    {language === 'zh' ? '模式选择' : 'Picking'}
                </h3>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '操作' : 'Operation'}
                    </h3>
                    <div className="flex items-center p-1 h-[43px] bg-gray-200 rounded-lg">
                        <button
                            className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                pickingTab === 'picking'
                                    ? 'bg-[#757575] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => setPickingTab('picking')}
                        >
                            <SquareMousePointer className="h-4 w-4" />
                            {language === 'zh' ? '选择' : 'Picking'}
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                pickingTab === 'unpicking'
                                    ? 'bg-[#757575] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => setPickingTab('unpicking')}
                        >
                            <SquareDashedMousePointer className="h-4 w-4" />
                            {language === 'zh' ? '撤选' : 'Unpicking'}
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                pickingTab === 'delete'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={handleDeleteSelectClick}
                        >
                            <Trash2 className="h-4 w-4" />
                            {language === 'zh' ? '删除' : 'Delete'}
                        </button>
                    </div>
                </div>
                <div className="mt-2 mb-3 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '模式' : 'Mode'}
                    </h3>
                    <div className="flex items-center h-[43px] p-1 bg-gray-200 rounded-lg">
                        <button
                            className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'brush'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveSelectTab('brush')}
                        >
                            <Brush className="h-4 w-4" />
                            {language === 'zh' ? '笔刷' : 'Brush'}
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'box'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveSelectTab('box')}
                        >
                            <SquareDashed className="h-4 w-4" />
                            {language === 'zh' ? '框选' : 'Box'}
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'feature'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={handleFeatureClick}
                        >
                            <FolderOpen className="h-4 w-4" />
                            {language === 'zh' ? '要素' : 'Feature'}
                        </button>
                    </div>
                </div>
                <Separator />
                <h3 className="text-2xl ml-1 mb-1 -mt-1 font-bold">
                    {language === 'zh' ? '拓扑' : 'Topology'}
                </h3>
                <div className="flex items-center h-[43px] space-x-1 mt-2 p-2 bg-gray-200 rounded-md shadow-sm border border-gray-200">
                    <button className="flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer bg-gray-600 text-white hover:bg-blue-600">
                        {language === 'zh' ? '细分' : 'Subdivide'}
                    </button>
                    <button className="flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer bg-gray-600 text-white hover:bg-green-600">
                        {language === 'zh' ? '合并' : 'Merge'}
                    </button>
                    <button
                        className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer text-white ${
                            deleteGridDialogOpen
                                ? 'bg-red-600'
                                : 'bg-gray-600 hover:bg-red-600 '
                        }`}
                        onClick={handleDeleteGridClick}
                    >
                        {language === 'zh' ? '删除' : 'Delete'}
                    </button>
                    <button className="flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer bg-gray-600 text-white hover:bg-purple-600">
                        {language === 'zh' ? '恢复' : 'Recover'}
                    </button>
                </div>
                <BrushCard />
            </div>
        );
    }
