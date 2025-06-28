import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext, CheckingSwitch } from '../../../context';
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
import { GridEditorProps } from '../types/types';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import store from '@/store';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
import TopologyLayer from '@/components/mapComponent/layers/TopologyLayer';
import GridChecking from './gridChecking';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type TopologyOperationType =
    | 'subdivide'
    | 'merge'
    | 'delete'
    | 'recover'
    | null;

export default function GridEditor({
    pickingTab,
    setPickingTab,
    activeSelectTab,
    setActiveSelectTab,
}: GridEditorProps) {
    const { language } = useContext(LanguageContext);

    const [isVisible, setIsVisible] = useState(true);
    const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
    const [deleteSelectDialogOpen, setDeleteSelectDialogOpen] = useState(false);
    const [activeTopologyOperation, setActiveTopologyOperation] =
        useState<TopologyOperationType>(null);
    const [isPickingHighSpeedModeOn, setIsPickingHighSpeedModeOn] =
        useState(false);
    const [isTopologyHighSpeedModeOn, setIsTopologyHighSpeedModeOn] =
        useState(false);

    const checkOnEvent = () => setIsVisible(false);
    const checkOffEvent = () => setIsVisible(true);

    const clg = store.get<NHLayerGroup>('clg')!;
    const topologyLayer = clg.getLayerInstance(
        'TopologyLayer'
    )! as TopologyLayer;

    const handleFeatureClick = useCallback(async () => {
        const currentTab: 'brush' | 'box' | 'feature' = setActiveSelectTab('feature');
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
                    setActiveSelectTab(currentTab);
                } else {
                    console.log('No file selected');
                    setActiveSelectTab(currentTab);
                    store;
                }
            } catch (error) {
                console.error('Error opening file dialog:', error);
                setActiveSelectTab(currentTab);
            }
        } else {
            console.warn('Electron API not available');
            setActiveSelectTab(currentTab);
        }
    }, [setActiveSelectTab, topologyLayer]);

    const handleDeleteSelectClick = () => {
        if (store.get<boolean>('highSpeedModeState')!) {
            handleConfirmDeleteSelect();
        } else {
            setDeleteSelectDialogOpen(true);
        }
    };

    const handleSelectAllClick = () => {
        if (store.get<boolean>('highSpeedModeState')!) {
            handleConfirmSelectAll();
        } else {
            setSelectAllDialogOpen(true);
        }
    };

    const handleConfirmSelectAll = useCallback(() => {
        setSelectAllDialogOpen(false);
        topologyLayer.executePickAllGrids();
    }, [topologyLayer]);

    const handleConfirmDeleteSelect = useCallback(() => {
        setDeleteSelectDialogOpen(false);
        topologyLayer.executeClearSelection();
    }, [topologyLayer]);

    const handleConfirmTopologyAction = useCallback(() => {
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
                console.warn('No active topology operation to confirm.');
        }
        setActiveTopologyOperation(null);
    }, [activeTopologyOperation, topologyLayer]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                if (store.get<CheckingSwitch>('checkingSwitch')!.isOn) return;
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
                    if (store.get<boolean>('highSpeedModeState')!) {
                        handleConfirmSelectAll();
                    } else {
                        setSelectAllDialogOpen(true);
                    }
                }
                if (event.key === 'C' || event.key === 'c') {
                    event.preventDefault();
                    if (store.get<boolean>('highSpeedModeState')!) {
                        handleConfirmDeleteSelect();
                    } else {
                        setDeleteSelectDialogOpen(true);
                    }
                }
                if (event.key === '1') {
                    event.preventDefault();
                    setActiveSelectTab('brush');
                }
                if (event.key === '2') {
                    event.preventDefault();
                    setActiveSelectTab('box');
                }
                if (event.key === '3') {
                    event.preventDefault();
                    setActiveSelectTab('feature');
                    handleFeatureClick();
                }
                if (event.key === 'S' || event.key === 's') {
                    event.preventDefault();
                    if (store.get<boolean>('highSpeedModeState')!) {
                        topologyLayer.executeSubdivideGrids();
                    } else {
                        setActiveTopologyOperation('subdivide');
                    }
                }
                if (event.key === 'M' || event.key === 'm') {
                    event.preventDefault();
                    if (store.get<boolean>('highSpeedModeState')!) {
                        topologyLayer.executeMergeGrids();
                    } else {
                        setActiveTopologyOperation('merge');
                    }
                }
                if (event.key === 'D' || event.key === 'd') {
                    event.preventDefault();
                    if (store.get<boolean>('highSpeedModeState')!) {
                        topologyLayer.executeDeleteGrids();
                    } else {
                        setActiveTopologyOperation('delete');
                    }
                }
                if (event.key === 'R' || event.key === 'r') {
                    event.preventDefault();
                    if (store.get<boolean>('highSpeedModeState')!) {
                        topologyLayer.executeRecoverGrids();
                    } else {
                        setActiveTopologyOperation('recover');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        setPickingTab, 
        isPickingHighSpeedModeOn, 
        isTopologyHighSpeedModeOn, 
        handleConfirmDeleteSelect, 
        handleConfirmSelectAll, 
        handleFeatureClick, 
        setActiveSelectTab, 
        topologyLayer
    ]);

    useEffect(() => {
        const checkingSwitch: CheckingSwitch = store.get('checkingSwitch')!;
        checkingSwitch.addEventListener('on', checkOnEvent);
        checkingSwitch.addEventListener('off', checkOffEvent);

        return () => {
            checkingSwitch.removeEventListener('on', checkOnEvent);
            checkingSwitch.removeEventListener('off', checkOffEvent);
        };
    });

    const onTopologyOperationClick = (operationType: TopologyOperationType) => {
        // if (isTopologyHighSpeedModeOn && operationType !== null) {
        if (store.get<boolean>('highSpeedModeState')! && operationType !== null) {
            switch (operationType) {
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
                    console.warn(
                        'Unknown topology operation type:',
                        operationType
                    );
            }
        } else {
            setActiveTopologyOperation(operationType);
        }
    };

    const topologyOperations = [
        {
            type: 'subdivide' as TopologyOperationType,
            zh: '细分',
            en: 'Subdivide',
            activeColor: 'bg-blue-600',
            hoverColor: 'hover:bg-blue-700',
            shortcut: '[ Ctrl+S ]',
        },
        {
            type: 'merge' as TopologyOperationType,
            zh: '合并',
            en: 'Merge',
            activeColor: 'bg-green-600',
            hoverColor: 'hover:bg-green-700',
            shortcut: '[ Ctrl+M ]',
        },
        {
            type: 'delete' as TopologyOperationType,
            zh: '删除',
            en: 'Delete',
            activeColor: 'bg-red-600',
            hoverColor: 'hover:bg-red-700',
            shortcut: '[ Ctrl+D ]',
        },
        {
            type: 'recover' as TopologyOperationType,
            zh: '恢复',
            en: 'Recover',
            activeColor: 'bg-orange-500',
            hoverColor: 'hover:bg-orange-500',
            shortcut: '[ Ctrl+R ]',
        },
    ];

    return (
        <div className="relative">
            {isVisible && (
                <div className="space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
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
                                        ? activeTopologyOperation ===
                                          'subdivide'
                                            ? '是否确认细分选中的网格？'
                                            : activeTopologyOperation ===
                                              'merge'
                                            ? '是否确认合并选中的网格？'
                                            : activeTopologyOperation ===
                                              'delete'
                                            ? '是否确认删除选中的网格？'
                                            : activeTopologyOperation ===
                                              'recover'
                                            ? '是否确认恢复选中的网格？'
                                            : '' // Fallback in case activeTopologyOperation is unexpectedly null
                                        : activeTopologyOperation ===
                                          'subdivide'
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
                                            : activeTopologyOperation ===
                                              'merge'
                                            ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                            : activeTopologyOperation ===
                                              'delete'
                                            ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                            : activeTopologyOperation ===
                                              'recover'
                                            ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                            : 'bg-gray-600 cursor-not-allowed'
                                    }
                                    disabled={activeTopologyOperation === null}
                                >
                                    {language === 'zh'
                                        ? activeTopologyOperation ===
                                          'subdivide'
                                            ? '细分'
                                            : activeTopologyOperation ===
                                              'merge'
                                            ? '合并'
                                            : activeTopologyOperation ===
                                              'delete'
                                            ? '删除'
                                            : activeTopologyOperation ===
                                              'recover'
                                            ? '恢复'
                                            : '确认'
                                        : activeTopologyOperation ===
                                          'subdivide'
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
                    <div className="flex mt-1 ml-1 items-center">
                        <h3 className="text-2xl font-bold">
                            {language === 'zh' ? '模式选择' : 'Picking'}
                        </h3>
                    </div>

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
                                        pickingTab === 'picking' &&
                                        ' text-white'
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
                                        pickingTab === 'unpicking' &&
                                        ' text-white'
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
                                    {language === 'zh'
                                        ? '取消全选'
                                        : 'Cancel All'}
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
                                }}
                            >
                                <div className="flex flex-row gap-1 items-center">
                                    <Brush className="h-4 w-4" />
                                    {language === 'zh' ? '笔刷' : 'Brush'}
                                </div>
                                <div
                                    className={`text-xs ${
                                        activeSelectTab === 'brush' &&
                                        'text-white'
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
                                }}
                            >
                                <div className="flex flex-row gap-1 items-center">
                                    <SquareDashed className="h-4 w-4" />
                                    {language === 'zh' ? '框选' : 'Box'}
                                </div>
                                <div
                                    className={`text-xs ${
                                        activeSelectTab === 'box' &&
                                        'text-white'
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
                    <div className="ml-1 mb-1 mt-0 flex items-center">
                        <h3 className="text-2xl font-bold">
                            {language === 'zh' ? '拓扑' : 'Topology'}
                        </h3>
                    </div>
                    <div className="flex items-center h-[56px] mt-2 mb-2 p-1 space-x-1 bg-gray-200 rounded-lg shadow-md">
                        {topologyOperations.map((operation) => (
                            <button
                                key={operation.type}
                                className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer text-white ${
                                    activeTopologyOperation === operation.type
                                        ? operation.activeColor
                                        : `bg-gray-600 ${operation.hoverColor}`
                                }`}
                                onClick={() => {
                                    onTopologyOperationClick(operation.type);
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
            )}

            <GridChecking />
        </div>
    );
}
