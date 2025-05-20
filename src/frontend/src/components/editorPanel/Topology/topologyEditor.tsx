import { useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../../../context';
import { Separator } from '@/components/ui/separator';
import {
    Grip,
    Brush,
    CircleOff,
    SquareDashed,
    FolderOpen,
    SquareMousePointer,
    SquareDashedMousePointer,
} from 'lucide-react';
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
import store from '@/store';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
import TopologyLayer from '@/components/mapComponent/layers/TopologyLayer';
import GridChecking from './gridChecking';

type TopologyOperationType =
    | 'subdivide'
    | 'merge'
    | 'delete'
    | 'recover'
    | null;

export default function TopologyPanel({
    pickingTab,
    setPickingTab,
    activeSelectTab,
    setActiveSelectTab,
}: TopologyPanelProps) {
    const { language } = useContext(LanguageContext);

    const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
    const [deleteSelectDialogOpen, setDeleteSelectDialogOpen] = useState(false);
    const [activeTopologyOperation, setActiveTopologyOperation] =
        useState<TopologyOperationType>(null);

    const clg = store.get<NHLayerGroup>('clg')!;
    const topologyLayer = clg.getLayerInstance(
        'TopologyLayer'
    )! as TopologyLayer;

    const handleFeatureClick = async () => {
        setActiveSelectTab('feature');
        store.set('modeSelect', 'feature');
        if (
            window.electronAPI &&
            typeof window.electronAPI.openFileDialog === 'function'
        ) {
            try {
                const filePath = await window.electronAPI.openFileDialog();
                if (filePath) {
                    console.log('Selected file path:', filePath);
                    store
                        .get<{ on: Function; off: Function }>('isLoading')!
                        .on();
                    topologyLayer.executePickGridsByFeature(filePath);
                } else {
                    console.log('No file selected');
                    setActiveSelectTab('brush');
                    store;
                }
            } catch (error) {
                console.error('Error opening file dialog:', error);
                setActiveSelectTab('brush');
                store.set('modeSelect', 'brush');
            }
        } else {
            console.warn('Electron API not available');
            setActiveSelectTab('brush');
            store.set('modeSelect', 'brush');
        }
    };

    const handleDeleteSelectClick = () => {
        setDeleteSelectDialogOpen(true);
    };

    const handleSelectAllClick = () => {
        setSelectAllDialogOpen(true);
    };

    const handleConfirmSelectAll = () => {
        setSelectAllDialogOpen(false);
        topologyLayer.executePickAllGrids();
    };

    const handleConfirmDeleteSelect = () => {
        setDeleteSelectDialogOpen(false);
        topologyLayer.executeClearSelection();
    };

    const handleConfirmTopologyAction = () => {
        switch (activeTopologyOperation) {
            case 'subdivide':
                topologyLayer.executeSubdivideGrids();
                break;
            case 'merge':
                topologyLayer.executeMergeGrids();
                break;
            case 'delete':
                topologyLayer.executeDeleteGrids();
                break;
            case 'recover':
                topologyLayer.executeRecoverGrids();
                break;
            default:
                // Should not happen if dialog is only open when activeTopologyOperation is not null
                console.warn('No active topology operation to confirm.');
        }
        // 关闭对话框
        setActiveTopologyOperation(null);
    };

    store.set('gridCheckingOn', false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                console.log(store.get<boolean>('gridCheckingOn'));
                if (store.get<boolean>('gridCheckingOn') === true) return;
                if (event.key === 'P' || event.key === 'p') {
                    event.preventDefault();
                    setPickingTab('picking');
                    store.set('pickingSelect', true);
                }
                if (event.key === 'U' || event.key === 'u') {
                    event.preventDefault();
                    setPickingTab('unpicking');
                    store.set('pickingSelect', false);
                }
                if (event.key === 'A' || event.key === 'a') {
                    event.preventDefault();
                    setSelectAllDialogOpen(true);
                }
                if (event.key === 'C' || event.key === 'c') {
                    event.preventDefault();
                    setDeleteSelectDialogOpen(true);
                }
                if (event.key === '1') {
                    event.preventDefault();
                    setActiveSelectTab('brush');
                    store.set('modeSelect', 'brush');
                }
                if (event.key === '2') {
                    event.preventDefault();
                    setActiveSelectTab('box');
                    store.set('modeSelect', 'box');
                }
                if (event.key === '3') {
                    event.preventDefault();
                    setActiveSelectTab('feature');
                    handleFeatureClick();
                    store.set('modeSelect', 'feature');
                }
                if (event.key === 'S' || event.key === 's') {
                    event.preventDefault();
                    setActiveTopologyOperation('subdivide');
                }
                if (event.key === 'M' || event.key === 'm') {
                    event.preventDefault();
                    setActiveTopologyOperation('merge');
                }
                if (event.key === 'D' || event.key === 'd') {
                    event.preventDefault();
                    setActiveTopologyOperation('delete');
                }
                if (event.key === 'R' || event.key === 'r') {
                    event.preventDefault();
                    setActiveTopologyOperation('recover');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [setPickingTab]);

    const onTopologyOperationClick = () => {
        switch (activeTopologyOperation) {
            case 'subdivide':
                setActiveTopologyOperation('subdivide');
                break;
            case 'merge':
                setActiveTopologyOperation('merge');
                break;
            case 'delete':
                setActiveTopologyOperation('delete');
                break;
            case 'recover':
                setActiveTopologyOperation('recover');
                break;
            default:
                // Should not happen if dialog is only open when activeTopologyOperation is not null
                console.warn('No active topology operation to confirm.');
        }
    };

    const topologyOperations = [
        {
            type: 'subdivide',
            zh: '细分',
            en: 'Subdivide',
            activeColor: 'bg-blue-600',
            shortcut: '[ Ctrl+S ]',
        },
        {
            type: 'merge',
            zh: '合并',
            en: 'Merge',
            activeColor: 'bg-green-600',
            shortcut: '[ Ctrl+M ]',
        },
        {
            type: 'delete',
            zh: '删除',
            en: 'Delete',
            activeColor: 'bg-red-600',
            shortcut: '[ Ctrl+D ]',
        },
        {
            type: 'recover',
            zh: '恢复',
            en: 'Recover',
            activeColor: 'bg-purple-600',
            shortcut: '[ Ctrl+R ]',
        },
    ];

    return (
        <div className="relative">
            {store.get<boolean>('gridCheckingOn') === true && (
                <div
                    className="absolute inset-0 bg-gray-200 opacity-60 z-50 flex items-center justify-center"
                    style={{ pointerEvents: 'auto' }}
                >
                    <span className="text-lg text-gray-700">
                        {' '}
                        {language === 'zh'
                            ? '网格检查中'
                            : 'Under Grid Checking'}
                    </span>
                </div>
            )}
            <div className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
                {/* 框选全部网格 */}
                <AlertDialog
                    open={selectAllDialogOpen}
                    onOpenChange={setSelectAllDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'zh'
                                    ? '操作确认'
                                    : 'Operation Confirm'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {language === 'zh'
                                    ? '是否确认框选所有网格？'
                                    : 'Are you sure you want to select all grids?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                className="cursor-pointer"
                                onClick={() => {
                                    setPickingTab('picking');
                                    store.set('pickingSelect', true);
                                }}
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmSelectAll}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                            >
                                {language === 'zh' ? '确认' : 'Confirm'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* 取消全部网格框选 */}
                <AlertDialog
                    open={deleteSelectDialogOpen}
                    onOpenChange={setDeleteSelectDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'zh'
                                    ? '操作确认'
                                    : 'Operation Confirm'}
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
                                onClick={() => {
                                    setPickingTab('picking');
                                    store.set('pickingSelect', true);
                                }}
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

                {/* 通用的拓扑操作确认对话框 */}
                <AlertDialog
                    open={activeTopologyOperation !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setActiveTopologyOperation(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'zh'
                                    ? '操作确认'
                                    : 'Operation Confirm'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {language === 'zh'
                                    ? activeTopologyOperation === 'subdivide'
                                        ? '是否确认细分选中的网格？'
                                        : activeTopologyOperation === 'merge'
                                        ? '是否确认合并选中的网格？'
                                        : activeTopologyOperation === 'delete'
                                        ? '是否确认删除选中的网格？'
                                        : activeTopologyOperation === 'recover'
                                        ? '是否确认恢复选中的网格？'
                                        : '' // Fallback in case activeTopologyOperation is unexpectedly null
                                    : activeTopologyOperation === 'subdivide'
                                    ? 'Are you sure you want to subdivide the selected grids?'
                                    : activeTopologyOperation === 'merge'
                                    ? 'Are you sure you want to merge the selected grids?'
                                    : activeTopologyOperation === 'delete'
                                    ? 'Are you sure you want to delete the selected grids?'
                                    : activeTopologyOperation === 'recover'
                                    ? 'Are you sure you want to recover the selected grids?'
                                    : ''}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmTopologyAction}
                                className={
                                    activeTopologyOperation === 'subdivide'
                                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                        : activeTopologyOperation === 'merge'
                                        ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                        : activeTopologyOperation === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                        : activeTopologyOperation === 'recover'
                                        ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                                        : 'bg-gray-600 cursor-not-allowed'
                                }
                                disabled={activeTopologyOperation === null}
                            >
                                {language === 'zh'
                                    ? activeTopologyOperation === 'subdivide'
                                        ? '细分'
                                        : activeTopologyOperation === 'merge'
                                        ? '合并'
                                        : activeTopologyOperation === 'delete'
                                        ? '删除'
                                        : activeTopologyOperation === 'recover'
                                        ? '恢复'
                                        : '确认'
                                    : activeTopologyOperation === 'subdivide'
                                    ? 'Subdivide'
                                    : activeTopologyOperation === 'merge'
                                    ? 'Merge'
                                    : activeTopologyOperation === 'delete'
                                    ? 'Delete'
                                    : activeTopologyOperation === 'recover'
                                    ? 'Recover'
                                    : 'Confirm'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <h3 className="text-2xl mt-1 ml-1 font-bold">
                    {language === 'zh' ? '模式选择' : 'Picking'}
                </h3>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '操作' : 'Operation'}
                    </h3>
                    <div className="flex items-center p-1 h-[64px] bg-gray-200 rounded-lg">
                        <button
                            className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                pickingTab === 'picking'
                                    ? 'bg-[#4d4d4d] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => {
                                setPickingTab('picking');
                                store.set('pickingSelect', true);
                            }}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <SquareMousePointer className="h-4 w-4" />
                                {language === 'zh' ? '选择' : 'Picking'}
                            </div>
                            <div
                                className={`text-xs ${
                                    pickingTab === 'picking' && ' text-white'
                                }`}
                            >
                                [ Ctrl+P ]
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                pickingTab === 'unpicking'
                                    ? 'bg-[#4d4d4d] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => {
                                setPickingTab('unpicking');
                                store.set('pickingSelect', false);
                            }}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <SquareDashedMousePointer className="h-4 w-4" />
                                {language === 'zh' ? '撤选' : 'Unpicking'}
                            </div>
                            <div
                                className={`text-xs ${
                                    pickingTab === 'unpicking' && ' text-white'
                                }`}
                            >
                                [Ctrl+U]
                            </div>
                        </button>
                    </div>
                    <div className="flex items-center gap-1 p-1 mt-2 h-[64px] bg-gray-200 rounded-lg">
                        <button
                            className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                selectAllDialogOpen
                                    ? 'bg-green-500 '
                                    : 'bg-gray-600 hover:bg-green-500'
                            }`}
                            onClick={handleSelectAllClick}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <Grip className="h-4 w-4" />
                                {language === 'zh' ? '全选' : 'Select All'}
                            </div>
                            <div
                                className={`text-xs ${
                                    selectAllDialogOpen && ' text-white'
                                }`}
                            >
                                [ Ctrl+A ]
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                deleteSelectDialogOpen
                                    ? 'bg-red-500 '
                                    : 'bg-gray-600 hover:bg-red-500'
                            }`}
                            onClick={handleDeleteSelectClick}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <CircleOff className="h-4 w-4" />
                                {language === 'zh' ? '取消全选' : 'Cancel All'}
                            </div>
                            <div
                                className={`text-xs ${
                                    deleteSelectDialogOpen && ' text-white'
                                }`}
                            >
                                [ Ctrl+C ]
                            </div>
                        </button>
                    </div>
                </div>
                <div className="mt-2 mb-3 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '模式' : 'Mode'}
                    </h3>
                    <div className="flex items-center h-[64px] mb-1 p-1 bg-gray-200 rounded-lg shadow-md">
                        <button
                            className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'brush'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => {
                                setActiveSelectTab('brush');
                                store.set('modeSelect', 'brush');
                            }}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <Brush className="h-4 w-4" />
                                {language === 'zh' ? '笔刷' : 'Brush'}
                            </div>
                            <div
                                className={`text-xs ${
                                    activeSelectTab === 'brush' && 'text-white'
                                } `}
                            >
                                [ Ctrl+1 ]
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'box'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={() => {
                                setActiveSelectTab('box');
                                store.set('modeSelect', 'box');
                            }}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <SquareDashed className="h-4 w-4" />
                                {language === 'zh' ? '框选' : 'Box'}
                            </div>
                            <div
                                className={`text-xs ${
                                    activeSelectTab === 'box' && 'text-white'
                                } `}
                            >
                                [ Ctrl+2 ]
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer ${
                                activeSelectTab === 'feature'
                                    ? 'bg-[#FF8F2E] text-white'
                                    : 'bg-transparent hover:bg-gray-300'
                            }`}
                            onClick={handleFeatureClick}
                        >
                            <div className="flex flex-row gap-1 items-center">
                                <FolderOpen className="h-4 w-4" />
                                {language === 'zh' ? '要素' : 'Feature'}
                            </div>
                            <div
                                className={`text-xs ${
                                    activeSelectTab === 'feature' &&
                                    'text-white'
                                } `}
                            >
                                [ Ctrl+3 ]
                            </div>
                        </button>
                    </div>
                </div>
                <Separator />
                <h3 className="text-2xl ml-1 mb-1 mt-0 font-bold">
                    {language === 'zh' ? '拓扑' : 'Topology'}
                </h3>
                <div className="flex items-center h-[56px] mt-2 mb-2 p-1 space-x-1 bg-gray-200 rounded-lg shadow-md">
                    {topologyOperations.map((operation) => (
                        <button
                            key={operation.type}
                            className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer  text-white ${
                                activeTopologyOperation === operation.type
                                    ? operation.activeColor
                                    : 'bg-gray-600 hover:' +
                                      operation.activeColor.replace(
                                          'bg-',
                                          'bg-'
                                      ) // Keep hover effect consistent
                            }`}
                            // onClick={operation.onClick}
                            onClick={() => {
                                setActiveTopologyOperation(
                                    operation.type as TopologyOperationType
                                );
                                onTopologyOperationClick();
                            }}
                        >
                            <div className="flex flex-row items-center">
                                {language === 'zh'
                                    ? operation.zh
                                    : operation.en}
                            </div>
                            <div className="text-xs text-white">
                                {operation.shortcut}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <GridChecking />
        </div>
    );
}
