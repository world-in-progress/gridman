import MapContainer from "@/components/mapContainer/mapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Delete,
    SquareMousePointer,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    SquareDashedMousePointer,
    Grip,
    CircleOff,
    Brush,
    SquareDashed,
    FolderOpen,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TopologyEditorProps, TopologyOperationType } from "./types";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { SceneNode } from "@/components/resourceScene/scene";
import { PatchPageContext } from "./patch";
import { addMapPatchBounds, convertToWGS84 } from "@/components/mapContainer/utils";
import { GridMeta } from "@/core/apis/types";
import { setPatch } from "./util";
import GridCore from "@/core/grid/NHGridCore";
import { GridContext } from "@/core/grid/types";
import { boundingBox2D } from "@/core/util/boundingBox2D";
import TopologyLayer from "@/components/mapContainer/TopologyLayer";
import store from "@/store";
import NHLayerGroup from "@/components/mapContainer/NHLayerGroup";
import CapacityBar from "@/components/ui/capacityBar";

const topologyTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
]

const topologyOperations = [
    {
        type: 'subdivide',
        text: 'Subdivide',
        activeColor: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
        shortcut: '[ Ctrl+S ]',
    },
    {
        type: 'merge',
        text: 'Merge',
        activeColor: 'bg-green-500',
        hoverColor: 'hover:bg-green-600',
        shortcut: '[ Ctrl+M ]',
    },
    {
        type: 'delete',
        text: 'Delete',
        activeColor: 'bg-red-500',
        hoverColor: 'hover:bg-red-600',
        shortcut: '[ Ctrl+D ]',
    },
    {
        type: 'recover',
        text: 'Recover',
        activeColor: 'bg-orange-500',
        hoverColor: 'hover:bg-orange-600',
        shortcut: '[ Ctrl+R ]',
    },
];

export default function TopologyEditor(
    { node }: TopologyEditorProps
) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [pickingTab, setPickingTab] = useState<'picking' | 'unpicking'>('picking');
    const [checkSwitchOn, setCheckSwitchOn] = useState(false);
    const [activeSelectTab, setActiveSelectTab] = useState<'brush' | 'box' | 'feature'>('brush');
    const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
    const [deleteSelectDialogOpen, setDeleteSelectDialogOpen] = useState(false);

    const [activeTopologyOperation, setActiveTopologyOperation] = useState<TopologyOperationType>(null);

    const pageContext = useRef<PatchPageContext>(new PatchPageContext())
    const patchRef = useRef<GridMeta | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext(node as SceneNode)
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as PatchPageContext
        const pc = pageContext.current
        const map = store.get<mapboxgl.Map>('map')

        // Set Patch
        const patchMeta = await setPatch(node)
        patchRef.current = patchMeta

        const gridContext: GridContext = {
            srcCS: `EPSG:${patchMeta?.epsg}`,
            targetCS: 'EPSG:4326',
            bBox: boundingBox2D(...patchMeta!.bounds),
            rules: patchMeta!.subdivide_rules
        }

        const gridCore: GridCore = new GridCore(gridContext, node.tree.isPublic)

        const gridLayer = new TopologyLayer(map!)
        const clg = store.get<NHLayerGroup>('clg')
        clg!.addLayer(gridLayer)
        

        // TODO: Set Loading
        gridLayer.startCallback = () => {
            store.get<{ on: Function; off: Function }>('isLoading')!.on()
        }
        gridLayer.endCallback = () => {
            store.get<{ on: Function; off: Function }>('isLoading')!.off()
            triggerRepaint()
        }
        gridLayer.gridCore = gridCore

        if (patchRef.current) {
            addMapPatchBounds(patchRef.current.bounds, undefined, {
                fillColor: 'rgba(255, 0, 0, 0.5)',
                lineColor: '#FFFFFF',
                opacity: 0.8,
                lineWidth: 5
            })
        }

        triggerRepaint()
    }

    const unloadContext = (node: SceneNode) => {
        return
    }

    const handleSelectAllClick = () => {
        // if (store.get<boolean>('highSpeedModeState')!) {
        //     handleConfirmSelectAll();
        // } 
        setSelectAllDialogOpen(true);
    };

    const handleDeleteSelectClick = () => {
        // if (store.get<boolean>('highSpeedModeState')!) {
        //     handleConfirmDeleteSelect();
        // } 
        setDeleteSelectDialogOpen(true);
    };

    const handleConfirmSelectAll = useCallback(() => {
        setSelectAllDialogOpen(false);
        // topologyLayer.executePickAllGrids();
    }, []
        // [topologyLayer]
    );

    const handleConfirmDeleteSelect = useCallback(() => {
        setDeleteSelectDialogOpen(false);
        // topologyLayer.executeClearSelection();
    }, []
        // [topologyLayer]
    );

    const handlePatchDelete = async () => {
        console.log('delete patch')
    }

    const handleConfirmTopologyAction = useCallback(() => {
        switch (activeTopologyOperation) {
            case 'subdivide':
                // topologyLayer.executeSubdivideGrids();
                console.log('subdivide')
                break;
            case 'merge':
                // topologyLayer.executeMergeGrids();
                console.log('merge')
                break;
            case 'delete':
                // topologyLayer.executeDeleteGrids();
                console.log('delete')
                break;
            case 'recover':
                // topologyLayer.executeRecoverGrids();
                console.log('recover')
                break;
            default:
                console.warn('No active topology operation to confirm.');
        }
        setActiveTopologyOperation(null);
    }, [activeTopologyOperation,
        // topologyLayer
    ]);

    const onTopologyOperationClick = (operationType: string) => {
        // if (store.get<boolean>('highSpeedModeState')! && operationType !== null) {
        if (operationType !== null) {
            switch (operationType) {
                case 'subdivide':
                    // topologyLayer.executeSubdivideGrids();
                    break;
                case 'merge':
                    // topologyLayer.executeMergeGrids();
                    break;
                case 'delete':
                    // topologyLayer.executeDeleteGrids();
                    break;
                case 'recover':
                    // topologyLayer.executeRecoverGrids();
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

    const handleFeatureClick = useCallback(async () => {
        // const currentTab: 'brush' | 'box' | 'feature' = setActiveSelectTab('feature');
        // if (
        //     window.electronAPI &&
        //     typeof window.electronAPI.openFileDialog === 'function'
        // ) {
        //     try {
        //         const filePath = await window.electronAPI.openFileDialog();
        //         if (filePath) {
        //             console.log('Selected file path:', filePath);
        //             store
        //                 .get<{ on: Function; off: Function }>('isLoading')!
        //                 .on();
        //             topologyLayer.executePickGridsByFeature(filePath);
        //             setActiveSelectTab(currentTab);
        //         } else {
        //             console.log('No file selected');
        //             setActiveSelectTab(currentTab);
        //             store;
        //         }
        //     } catch (error) {
        //         console.error('Error opening file dialog:', error);
        //         setActiveSelectTab(currentTab);
        //     }
        // } else {
        //     console.warn('Electron API not available');
        //     setActiveSelectTab(currentTab);
        // }
        console.log('handleFeatureClick');
    }, []
        // [setActiveSelectTab, topologyLayer]
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                // if (store.get<CheckingSwitch>('checkingSwitch')!.isOn) return;
                if (event.key === 'P' || event.key === 'p') {
                    event.preventDefault();
                    setPickingTab('picking');
                    // store.set('pickingSelect', true);
                }
                if (event.key === 'U' || event.key === 'u') {
                    event.preventDefault();
                    setPickingTab('unpicking');
                    // store.set('pickingSelect', false);
                }
                if (event.key === 'A' || event.key === 'a') {
                    event.preventDefault();
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     handleConfirmSelectAll();
                    // } else {
                    //     setSelectAllDialogOpen(true);
                    // }
                    setSelectAllDialogOpen(true);
                }
                if (event.key === 'C' || event.key === 'c') {
                    event.preventDefault();
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     handleConfirmDeleteSelect();
                    // } else {
                    //     setDeleteSelectDialogOpen(true);
                    // }
                    setDeleteSelectDialogOpen(true);
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
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     topologyLayer.executeSubdivideGrids();
                    // } else {
                    //     setActiveTopologyOperation('subdivide');
                    // }
                    setActiveTopologyOperation('subdivide');
                }
                if (event.key === 'M' || event.key === 'm') {
                    event.preventDefault();
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     topologyLayer.executeMergeGrids();
                    // } else {
                    //     setActiveTopologyOperation('merge');
                    // }
                    setActiveTopologyOperation('merge');
                }
                if (event.key === 'D' || event.key === 'd') {
                    event.preventDefault();
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     topologyLayer.executeDeleteGrids();
                    // } else {
                    //     setActiveTopologyOperation('delete');
                    // }
                    setActiveTopologyOperation('delete');
                }
                if (event.key === 'R' || event.key === 'r') {
                    event.preventDefault();
                    // if (store.get<boolean>('highSpeedModeState')!) {
                    //     topologyLayer.executeRecoverGrids();
                    // } else {
                    //     setActiveTopologyOperation('recover');
                    // }
                    setActiveTopologyOperation('recover');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        // setPickingTab,
        // isPickingHighSpeedModeOn,
        // isTopologyHighSpeedModeOn,
        // handleConfirmDeleteSelect,
        // handleConfirmSelectAll,
        // handleFeatureClick,
        // setActiveSelectTab,
        // topologyLayer
    ]);

    const toggleCheckSwitch = () => {
        setCheckSwitchOn(prev => !prev);
    };

    return (
        <div className='w-full h-[96vh] flex flex-row'>
            <div className='w-2/5 h-full flex flex-col'>
                <div className='flex-1 overflow-hidden'>
                    {/* ----------------- */}
                    {/* Page Introduction */}
                    {/* ----------------- */}
                    <div className='w-full border-b border-gray-700 flex flex-row'>
                        {/* ------------*/}
                        {/* Page Avatar */}
                        {/* ------------*/}
                        <div className='w-1/3 h-full flex justify-center items-center my-auto'>
                            <Avatar className=' h-28 w-28 border-2 border-white'>
                                <AvatarFallback className='bg-[#007ACC]'>
                                    <SquareMousePointer className='h-15 w-15 text-white' />
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
                                Create New Schema
                                <span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">{node.tree.isPublic ? 'Public' : 'Private'}</span>
                                <span>[{node.name}]</span>
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {topologyTips.map((tip, index) => (
                                        <li key={index}>
                                            {Object.values(tip)[0]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className='text-sm w-full flex flex-row space-x-2 px-4'>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='destructive'
                                            className='bg-red-500 hover:bg-red-600 h-8 text-white cursor-pointer rounded-sm flex'
                                        >
                                            <span>Delete</span>
                                            <Separator orientation='vertical' className='h-4' />
                                            <Delete className='w-4 h-4' />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure to delete this patch?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this patch and all its data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className='cursor-pointer border border-gray-300'>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className='bg-red-500 hover:bg-red-600 cursor-pointer'
                                                onClick={handlePatchDelete}
                                            >
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <div
                                    className='bg-sky-500 hover:bg-sky-600 h-8 p-2 text-white cursor-pointer rounded-sm flex items-center px-4'
                                    onClick={() => setCheckSwitchOn(!checkSwitchOn)}
                                >
                                    <span>Check</span>
                                    <Separator orientation='vertical' className='h-4 mx-2' />
                                    <Switch
                                        className='data-[state=checked]:bg-amber-300 data-[state=unchecked]:bg-gray-300 cursor-pointer'
                                        checked={checkSwitchOn}
                                        onCheckedChange={setCheckSwitchOn}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* ---------------- */}
                    {/* Grid Schema Form */}
                    {/* ---------------- */}
                    <ScrollArea className='h-full max-h-[calc(100vh-12.5rem)]'>
                        <div className="mt-4">
                            <div className='w-2/3 mx-auto'>
                                <div className="p-3 rounded-md shadow-sm">
                                    <h2 className="text-xl font-bold text-white">Current Editing Information</h2>
                                    <div className="text-sm text-white mt-1 grid gap-1">
                                        <div>
                                            <span className="font-bold">Patch Name: </span>
                                            {patchRef.current?.name}
                                        </div>
                                        <div>
                                            <span className="font-bold">EPSG: </span>
                                            {patchRef.current?.epsg}
                                        </div>
                                        <div className="flex items-start flex-row">
                                            <div className={`font-bold w-[25%]`}>Grid Levels(m): </div>
                                            <div className="space-y-1">
                                                {patchRef.current?.subdivide_rules && (
                                                    patchRef.current?.subdivide_rules.map(
                                                        (level: number[], index: number) => {
                                                            // const color = paletteColorList ?
                                                            //     [paletteColorList[(index + 1) * 3], paletteColorList[(index + 1) * 3 + 1], paletteColorList[(index + 1) * 3 + 2]] :
                                                            //     null;
                                                            // const colorStyle = color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : undefined;

                                                            return (
                                                                <div key={index} className="text-sm"
                                                                // style={{ color: colorStyle }}
                                                                >
                                                                    level {index + 1}: [{level.join(', ')}]
                                                                </div>
                                                            );
                                                        }
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="font-bold">
                                            <span className="text-white">BoundingBox:</span>
                                            {/* {bounds ? ( */}
                                            <div className="grid grid-cols-3 gap-1 text-xs text-white mt-4">
                                                {/* Top Left Corner */}
                                                <div className="relative h-8 flex items-center justify-center">
                                                    <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-300 rounded-tl"></div>
                                                </div>
                                                {/* North/Top */}
                                                <div className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex flex-col items-center">
                                                                    <ArrowUp className="h-4 w-4 text-blue-500" />
                                                                    <span className="font-bold text-blue-500 text-sm mb-1">N</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[12px] space-y-1">
                                                                    <p className="font-bold text-blue-500">North</p>
                                                                    <p>{patchRef.current?.bounds[3].toFixed(6)}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                {/* Top Right Corner */}
                                                <div className="relative h-8 flex items-center justify-center">
                                                    <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-300 rounded-tr"></div>
                                                </div>
                                                {/* West/Left */}
                                                <div className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex flex-row items-center justify-center gap-1 mt-2">
                                                                    <ArrowLeft className="h-4 w-4 text-green-500" />
                                                                    <span className="font-bold text-green-500 text-sm mr-1 mt-1">W</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[12px]">
                                                                    <p className="font-bold mb-1 text-green-500">West</p>
                                                                    <p>{patchRef.current?.bounds[0].toFixed(6)}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                {/* Center */}
                                                <div className="text-center">
                                                    <span className="font-bold text-[14px] text-orange-500">Center</span>
                                                    <div className="text-[12px]">
                                                        <div>{patchRef.current && ((patchRef.current?.bounds[0] + patchRef.current?.bounds[2]) / 2).toFixed(6)}</div>
                                                        <div>{patchRef.current && ((patchRef.current?.bounds[1] + patchRef.current?.bounds[3]) / 2).toFixed(6)}</div>
                                                    </div>
                                                </div>
                                                {/* East/Right */}
                                                <div className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex flex-row items-center justify-center gap-1 mt-2">
                                                                    <span className="font-bold text-red-500 text-sm mt-1 ml-4">E</span>
                                                                    <ArrowRight className="h-4 w-4 text-red-500" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[12px]">
                                                                    <p className="font-bold mb-1 text-red-500">East</p>
                                                                    <p>{patchRef.current?.bounds[2].toFixed(6)}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                {/* Bottom Left Corner */}
                                                <div className="relative h-8 flex items-center justify-center">
                                                    <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-300 rounded-bl"></div>
                                                </div>
                                                {/* South/Bottom */}
                                                <div className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-bold text-purple-500 text-sm mt-1">S</span>
                                                                    <ArrowDown className="h-4 w-4 text-purple-500" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[12px]">
                                                                    <p className="font-bold mb-1 text-purple-500">South</p>
                                                                    <p>{patchRef.current?.bounds[1].toFixed(6)}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                {/* Bottom Right Corner */}
                                                <div className="relative h-8 flex items-center justify-center">
                                                    <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-300 rounded-br"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='w-full flex flex-row border-t-2 border-[#414141]'>
                                <div className="w-2/3 mx-auto space-y-4 pl-4 pr-1 border-r border-[#414141]">
                                    <div className="space-y-2 p-2">
                                        {/* 框选全部网格 */}
                                        <AlertDialog
                                            open={selectAllDialogOpen}
                                            onOpenChange={setSelectAllDialogOpen}
                                        >
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Operation Confirm
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to select all grids?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel
                                                        className="cursor-pointer"
                                                        onClick={() => { setPickingTab('picking') }}
                                                    >
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleConfirmSelectAll}
                                                        className="bg-green-500 hover:bg-green-600 cursor-pointer"
                                                    >
                                                        Confirm
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
                                                        Operation Confirm
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to cancel all selections?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel
                                                        className="cursor-pointer"
                                                        onClick={() => { setPickingTab('picking') }}
                                                    >
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleConfirmDeleteSelect}
                                                        className="bg-red-500 hover:bg-red-600 cursor-pointer"
                                                    >
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        {/* 通用的拓扑操作确认对话框 */}
                                        <AlertDialog
                                            open={activeTopologyOperation !== null}
                                            onOpenChange={(open) => {
                                                if (!open) { setActiveTopologyOperation(null) }
                                            }}
                                        >
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Operation Confirm
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {activeTopologyOperation ===
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
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleConfirmTopologyAction}
                                                        className={
                                                            activeTopologyOperation === 'subdivide'
                                                                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                                                                : activeTopologyOperation ===
                                                                    'merge'
                                                                    ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                                                                    : activeTopologyOperation ===
                                                                        'delete'
                                                                        ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                                                                        : activeTopologyOperation ===
                                                                            'recover'
                                                                            ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                                                            : 'bg-gray-500 cursor-not-allowed'
                                                        }
                                                        disabled={activeTopologyOperation === null}
                                                    >
                                                        {activeTopologyOperation ===
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
                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold text-white">Picking</h1>
                                            <div className="mt-2">
                                                <h3 className="text-md mb-1 font-bold text-white">Operation</h3>
                                                <div className="flex items-center gap-1 p-1 h-[64px] border border-gray-200 rounded-lg">
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors text-white duration-200 flex flex-col text-sm justify-center items-center cursor-pointer 
                                                            ${pickingTab === 'picking' ? 'bg-gray-600 ' : 'bg-transparent hover:bg-gray-500'}`}
                                                        onClick={() => { setPickingTab('picking') }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <SquareMousePointer className="h-4 w-4" />
                                                            Picking
                                                        </div>
                                                        <div className={`text-xs ${pickingTab === 'picking' && ' text-white'}`}>
                                                            [ Ctrl+P ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors text-white duration-200 flex flex-col text-sm justify-center items-center cursor-pointer 
                                                            ${pickingTab === 'unpicking' ? 'bg-gray-700 ' : 'bg-transparent hover:bg-gray-500'}`}
                                                        onClick={() => { setPickingTab('unpicking') }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <SquareDashedMousePointer className="h-4 w-4" />
                                                            Unpicking
                                                        </div>
                                                        <div className={`text-xs ${pickingTab === 'unpicking' && ' text-white'}`}>
                                                            [Ctrl+U]
                                                        </div>
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 p-1 mt-2 h-[64px] border border-gray-200 rounded-lg">
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col text-sm justify-center items-center cursor-pointer 
                                                            ${selectAllDialogOpen ? 'bg-green-500 ' : ' hover:bg-green-500'}`}
                                                        onClick={handleSelectAllClick}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <Grip className="h-4 w-4" />
                                                            Select All
                                                        </div>
                                                        <div className={`text-xs ${selectAllDialogOpen && ' text-white'}`}>
                                                            [ Ctrl+A ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col text-sm justify-center items-center cursor-pointer 
                                                            ${deleteSelectDialogOpen ? 'bg-red-500 ' : ' hover:bg-red-500'}`}
                                                        onClick={handleDeleteSelectClick}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <CircleOff className="h-4 w-4" />
                                                            Cancel All
                                                        </div>
                                                        <div className={`text-xs ${deleteSelectDialogOpen && ' text-white'}`}>
                                                            [ Ctrl+C ]
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <h3 className="text-md mb-1 font-bold text-white">Mode</h3>
                                                <div className="flex items-center h-[64px] mb-1 p-1 gap-1 rounded-lg border border-gray-200 shadow-md">
                                                    <button
                                                        className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 text-white flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                            ${activeSelectTab === 'brush' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                        onClick={() => { setActiveSelectTab('brush') }}
                                                    >
                                                        <div className="flex flex-row items-center">
                                                            <Brush className="h-4 w-4" />
                                                            Brush
                                                        </div>
                                                        <div className={`text-xs ${activeSelectTab === 'brush' && 'text-white'} `}>
                                                            [ Ctrl+1 ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 text-white flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                            ${activeSelectTab === 'box' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                        onClick={() => { setActiveSelectTab('box') }}
                                                    >
                                                        <div className="flex flex-row items-center">
                                                            <SquareDashed className="h-4 w-4" />
                                                            Box
                                                        </div>
                                                        <div className={`text-xs ${activeSelectTab === 'box' && 'text-white'} `}>
                                                            [ Ctrl+2 ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col text-white gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                            ${activeSelectTab === 'feature' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                        onClick={() => { handleFeatureClick }}
                                                    >
                                                        <div className="flex flex-row items-center">
                                                            <FolderOpen className="h-4 w-4" />
                                                            Feature
                                                        </div>
                                                        <div className={`text-xs ${activeSelectTab === 'feature' && 'text-white'} `}>
                                                            [ Ctrl+3 ]
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="my-6 bg-[#414141]" />
                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold text-white">Topology</h1>
                                            <div className="flex items-center h-[56px] mt-2 mb-2 p-1 space-x-1 border border-gray-200 rounded-lg shadow-md">
                                                {topologyOperations.map((operation) => (
                                                    <button
                                                        key={operation.type}
                                                        className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer text-white 
                                                            ${activeTopologyOperation === operation.type ? operation.activeColor : `${operation.hoverColor}`}`}
                                                        onClick={() => { onTopologyOperationClick(operation.type) }}
                                                    >
                                                        <div className="flex flex-row items-center">
                                                            {operation.text}
                                                        </div>
                                                        <div className="text-xs text-white">
                                                            {operation.shortcut}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* ////////////////////////////////////////////////////////////////// */}
                                {/* ////////////////////////////////////////////////////////////////// */}
                                {/* ////////////////////////////////////////////////////////////////// */}
                                <div className="w-1/3 mx-auto space-y-4 pr-4 pl-1 border-l border-[#414141]">
                                    <div className="space-y-2 p-2 mb-4">
                                        <h1 className="text-2xl font-bold text-white">Checking</h1>
                                        <div className="text-md p-1 space-y-2 mt-2 text-white">
                                            <div>
                                                <span className="font-bold">level: </span>
                                                {/* {gridInfo?.level ?? '-'} */}
                                            </div>
                                            <div>
                                                <span className="font-bold">localId: </span>
                                                {/* {gridInfo?.localId ?? '-'} */}
                                            </div>
                                            <div>
                                                <span className="font-bold">deleted: </span>
                                                {/* {gridInfo?.deleted === true
                                                    ? 'true'
                                                    : gridInfo?.deleted === false
                                                        ? 'false'
                                                        : '-'} */}
                                            </div>
                                            <div>
                                                <span className="font-bold">globalId: </span>
                                                {/* {gridInfo?.globalId ?? '-'} */}
                                            </div>
                                            <div>
                                                <span className="font-bold">storageId: </span>
                                                {/* {gridInfo?.storageId ?? '-'} */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className='w-3/5 h-full py-4 pr-4'>
                <CapacityBar />
                <MapContainer node={null} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}
