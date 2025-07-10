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
import { PatchPageProps } from "./types";

const topologyTips = [
    { tip1: 'Fill in the name of the Schema and the EPSG code.' },
]

const topologyOperations = [
    {
        type: 'subdivide',
        text: 'Subdivide',
        activeColor: 'bg-blue-600',
        hoverColor: 'hover:bg-blue-700',
        shortcut: '[ Ctrl+S ]',
    },
    {
        type: 'merge',
        text: 'Merge',
        activeColor: 'bg-green-600',
        hoverColor: 'hover:bg-green-700',
        shortcut: '[ Ctrl+M ]',
    },
    {
        type: 'delete',
        text: 'Delete',
        activeColor: 'bg-red-600',
        hoverColor: 'hover:bg-red-700',
        shortcut: '[ Ctrl+D ]',
    },
    {
        type: 'recover',
        text: 'Recover',
        activeColor: 'bg-orange-500',
        hoverColor: 'hover:bg-orange-500',
        shortcut: '[ Ctrl+R ]',
    },
];

export default function PatchPage(
    // {node}: PatchPageProps
) {
    const handlePatchDelete = async () => {
        console.log('delete patch')
    }

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
                                {/* <span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">{node.tree.isPublic ? 'Public' : 'Private'}</span> */}
                                <span className=" bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1">Private</span>
                                {/* <span>[{node.parent?.name}]</span> */}
                                <span>[你好]</span>
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
                                            className='bg-red-500 hover:bg-red-400 h-8 text-white cursor-pointer rounded-sm flex'
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
                                            <span className="font-bold">Schema Name: </span>
                                            '占位'
                                        </div>
                                        <div>
                                            <span className="font-bold">Patch: </span>
                                            '占位'
                                        </div>
                                        <div>
                                            <span className="font-bold">EPSG: </span>
                                            '占位'
                                        </div>
                                        <div className="flex items-start flex-row">
                                            <div className={`font-bold w-[35%]`}>Grid Levels(m): </div>
                                            <div className="space-y-1">
                                                {/* {schemaGridInfo ? (
                                                schemaGridInfo.map(
                                                    (level: number[], index: number) => {
                                                        const color = paletteColorList ?
                                                            [paletteColorList[(index + 1) * 3], paletteColorList[(index + 1) * 3 + 1], paletteColorList[(index + 1) * 3 + 2]] :
                                                            null;
                                                        const colorStyle = color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : undefined;

                                                        return (
                                                            <div key={index} className="text-sm" style={{ color: colorStyle }}>
                                                                level {index + 1}: [{level.join(', ')}]
                                                            </div>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <span>-</span>
                                            )} */}
                                            </div>
                                        </div>

                                        <div className="font-bold">
                                            BoundingBox:
                                            {/* {bounds ? ( */}
                                            {true ? (
                                                <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 mt-4">
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
                                                                        <ArrowUp className="h-4 w-4 text-blue-600" />
                                                                        <span className="font-bold text-blue-600 text-sm mb-1">
                                                                            N
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="text-[12px]">
                                                                        <p className="font-bold mb-1">
                                                                            North
                                                                        </p>
                                                                        {/* <p>{bounds[3].toFixed(6)}</p> */}
                                                                        <p>123</p>
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
                                                                        <ArrowLeft className="h-4 w-4 text-green-600" />
                                                                        <span className="font-bold text-green-600 text-sm mr-1 mt-1">
                                                                            W
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="text-[12px]">
                                                                        <p className="font-bold mb-1">
                                                                            West
                                                                        </p>
                                                                        {/* <p>{bounds[0].toFixed(6)}</p> */}
                                                                        <p>123</p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    {/* Center */}
                                                    <div className="text-center">
                                                        <span className="font-bold text-[14px] text-orange-500">
                                                            Center
                                                        </span>
                                                        <div className="text-[12px]">
                                                            {/* <div>{((bounds[0] + bounds[2]) / 2).toFixed(6)}</div>
                                                        <div>{((bounds[1] + bounds[3]) / 2).toFixed(6)}</div> */}
                                                            <div>123</div>
                                                            <div>123</div>
                                                        </div>
                                                    </div>
                                                    {/* East/Right */}
                                                    <div className="text-center">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex flex-row items-center justify-center gap-1 mt-2">
                                                                        <span className="font-bold text-red-600 text-sm mt-1 ml-4">
                                                                            E
                                                                        </span>
                                                                        <ArrowRight className="h-4 w-4 text-red-600" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="text-[12px]">
                                                                        <p className="font-bold mb-1">
                                                                            East
                                                                        </p>
                                                                        {/* <p>{bounds[2].toFixed(6)}</p> */}
                                                                        <p>123</p>
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
                                                                        <span className="font-bold text-purple-600 text-sm mt-1">
                                                                            S
                                                                        </span>
                                                                        <ArrowDown className="h-4 w-4 text-purple-600" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="text-[12px]">
                                                                        <p className="font-bold mb-1">
                                                                            South
                                                                        </p>
                                                                        {/* <p>{bounds[1].toFixed(6)}</p> */}
                                                                        <p>123</p>
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
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='w-full flex flex-row border-t-2 border-[#414141]'>
                                <div className="w-2/3 mx-auto space-y-4 pl-4 pr-1 border-r border-[#414141]">
                                    <div className="space-y-2 p-2">
                                        {/* 框选全部网格 */}
                                        <AlertDialog>
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
                                                    // onClick={() => {
                                                    //     setPickingTab('picking');
                                                    //     store.set('pickingSelect', true);
                                                    // }}
                                                    >
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        // onClick={handleConfirmSelectAll}
                                                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                                    >
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        {/* 取消全部网格框选 */}
                                        <AlertDialog>
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
                                                    // onClick={() => {
                                                    //     setPickingTab('picking');
                                                    //     store.set('pickingSelect', true);
                                                    // }}
                                                    >
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        // onClick={handleConfirmDeleteSelect}
                                                        className="bg-red-600 hover:bg-red-700 cursor-pointer"
                                                    >
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        {/* 通用的拓扑操作确认对话框 */}
                                        <AlertDialog
                                            // open={activeTopologyOperation !== null}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    // setActiveTopologyOperation(null);
                                                }
                                            }}
                                        >
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Operation Confirm
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {/* {language === 'zh'
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
                                                                            : ''} */}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                    // onClick={handleConfirmTopologyAction}
                                                    // className={
                                                    //     activeTopologyOperation === 'subdivide'
                                                    //         ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                                    //         : activeTopologyOperation ===
                                                    //             'merge'
                                                    //             ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                                    //             : activeTopologyOperation ===
                                                    //                 'delete'
                                                    //                 ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                                    //                 : activeTopologyOperation ===
                                                    //                     'recover'
                                                    //                     ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                                    //                     : 'bg-gray-600 cursor-not-allowed'
                                                    // }
                                                    // disabled={activeTopologyOperation === null}
                                                    >
                                                        {/* {language === 'zh'
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
                                                                            : 'Confirm'} */}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold text-white">Picking</h1>

                                            <div className="mt-2 px-2">
                                                <h3 className="text-md mb-1 font-bold text-white">Operation</h3>
                                                <div className="flex items-center p-1 h-[64px] bg-gray-200 rounded-lg">
                                                    <button
                                                        // className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${pickingTab === 'picking'
                                                        //     ? 'bg-[#4d4d4d] text-white'
                                                        //     : 'bg-transparent hover:bg-gray-300'
                                                        //     }`}
                                                        className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                    // onClick={() => {
                                                    //     setPickingTab('picking');
                                                    //     store.set('pickingSelect', true);
                                                    // }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <SquareMousePointer className="h-4 w-4" />
                                                            Picking
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${pickingTab === 'picking' &&
                                                        //     ' text-white'
                                                        //     }`}
                                                        >
                                                            [ Ctrl+P ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        // className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${pickingTab === 'unpicking'
                                                        //     ? 'bg-[#4d4d4d] text-white'
                                                        //     : 'bg-transparent hover:bg-gray-300'
                                                        //     }`}
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                    // onClick={() => {
                                                    //     setPickingTab('unpicking');
                                                    //     store.set('pickingSelect', false);
                                                    // }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <SquareDashedMousePointer className="h-4 w-4" />
                                                            Unpicking
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${pickingTab === 'unpicking' &&
                                                        //     ' text-white'
                                                        //     }`}
                                                        >
                                                            [Ctrl+U]
                                                        </div>
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 p-1 mt-2 h-[64px] bg-gray-200 rounded-lg">
                                                    <button
                                                        // className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${selectAllDialogOpen
                                                        //     ? 'bg-green-500 '
                                                        //     : 'bg-gray-600 hover:bg-green-500'
                                                        //     }`}
                                                        className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                    // onClick={handleSelectAllClick}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <Grip className="h-4 w-4" />
                                                            Select All
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${selectAllDialogOpen && ' text-white'
                                                        //     }`}
                                                        >
                                                            [ Ctrl+A ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        // className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${deleteSelectDialogOpen
                                                        //     ? 'bg-red-500 '
                                                        //     : 'bg-gray-600 hover:bg-red-500'
                                                        //     }`}
                                                        className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                    // onClick={handleDeleteSelectClick}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <CircleOff className="h-4 w-4" />
                                                            Cancel All
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${deleteSelectDialogOpen && ' text-white'
                                                        //     }`}
                                                        >
                                                            [ Ctrl+C ]
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-2 px-2">
                                                <h3 className="text-md ml-1 mb-1 font-bold text-white">
                                                    Mode
                                                </h3>
                                                <div className="flex items-center h-[64px] mb-1 p-1 bg-gray-200 rounded-lg shadow-md">
                                                    <button
                                                        // className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${activeSelectTab === 'brush'
                                                        //     ? 'bg-[#FF8F2E] text-white'
                                                        //     : 'bg-transparent hover:bg-gray-300'
                                                        //     }`}
                                                        className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                        onClick={() => {
                                                            // setActiveSelectTab('brush');
                                                        }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <Brush className="h-4 w-4" />
                                                            Brush
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${activeSelectTab === 'brush' &&
                                                        //     'text-white'
                                                        //     } `}
                                                        >
                                                            [ Ctrl+1 ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        // className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${activeSelectTab === 'box'
                                                        //     ? 'bg-[#FF8F2E] text-white'
                                                        //     : 'bg-transparent hover:bg-gray-300'
                                                        //     }`}
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                        onClick={() => {
                                                            // setActiveSelectTab('box');
                                                        }}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <SquareDashed className="h-4 w-4" />
                                                            Box
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${activeSelectTab === 'box' &&
                                                        //     'text-white'
                                                        //     } `}
                                                        >
                                                            [ Ctrl+2 ]
                                                        </div>
                                                    </button>
                                                    <button
                                                        // className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        //     ${activeSelectTab === 'feature'
                                                        //     ? 'bg-[#FF8F2E] text-white'
                                                        //     : 'bg-transparent hover:bg-gray-300'
                                                        //     }`}
                                                        className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer 
                                                        `}
                                                    // onClick={handleFeatureClick}
                                                    >
                                                        <div className="flex flex-row gap-1 items-center">
                                                            <FolderOpen className="h-4 w-4" />
                                                            Feature
                                                        </div>
                                                        <div
                                                        // className={`text-xs ${activeSelectTab === 'feature' &&
                                                        //     'text-white'
                                                        //     } `}
                                                        >
                                                            [ Ctrl+3 ]
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="my-8  bg-[#414141]" />
                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold text-white">Topology</h1>
                                            <div className="flex items-center h-[56px] mt-2 mb-2 p-1 space-x-1 bg-gray-200 rounded-lg shadow-md">
                                                {topologyOperations.map((operation) => (
                                                    <button
                                                        key={operation.type}
                                                        // className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer text-white 
                                                        //     ${activeTopologyOperation === operation.type
                                                        //     ? operation.activeColor
                                                        //     : `bg-gray-600 ${operation.hoverColor}`
                                                        //     }
                                                        //     `}
                                                        className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center cursor-pointer text-white 
                                                        
                                                        `}
                                                        onClick={() => {
                                                            // onTopologyOperationClick(operation.type);
                                                        }}
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
                <MapContainer node={null} style='w-full h-full rounded-lg shadow-lg bg-gray-200 p-2' />
            </div>
        </div>
    )
}
