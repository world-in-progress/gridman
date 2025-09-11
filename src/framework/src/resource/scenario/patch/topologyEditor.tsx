import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
    Save,
    Grip,
    Brush,
    Delete,
    ArrowUp,
    ArrowDown,
    CircleOff,
    ArrowLeft,
    ArrowRight,
    FolderOpen,
    SquareDashed,
    SquareMousePointer,
    SquareDashedMousePointer,
} from 'lucide-react'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogTrigger,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import store from '@/store'
import { toast } from 'sonner'
import { PatchPageContext } from './patch'
import GridCore from '@/core/grid/NHGridCore'
import { GridContext } from '@/core/grid/types'
import { deletepatch, setPatch } from './utils'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import CapacityBar from '@/components/ui/capacityBar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { boundingBox2D } from '@/core/util/boundingBox2D'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { convertToWGS84 } from '@/components/mapContainer/utils'
import MapContainer from '@/components/mapContainer/mapContainer'
import CustomLayerGroup from '@/components/mapContainer/customLayerGroup'
import TopologyLayer from '@/components/mapContainer/TopologyLayer'
import { SceneNode, SceneTree } from '@/components/resourceScene/scene'
import { useSettingsStore } from "@/components/settingPage/settingStore"
import { GridCheckingInfo, TopologyEditorProps, TopologyOperationType } from './types'

const topologyTips = [
    { tip: 'Hold Shift to select/deselect grids with Brush or Box.' },
    { tip: 'Subdivide splits grids; Merge combines.' },
    { tip: 'Delete removes grids; Recover restores.' },
    { tip: 'Check mode shows grid details; Ctrl+A selects all.' },
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
]

export default function TopologyEditor(
    { node }: TopologyEditorProps
) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const [pickingTab, setPickingTab] = useState<boolean>(true)
    const [selectTab, setSelectTab] = useState<'brush' | 'box' | 'feature'>('brush');
    const [checkSwitchOn, setCheckSwitchOn] = useState(false);
    const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
    const [deleteSelectDialogOpen, setDeleteSelectDialogOpen] = useState(false)
    const [topologyLayer, setTopologyLayer] = useState<TopologyLayer | null>(null)

    const [activeTopologyOperation, setActiveTopologyOperation] = useState<TopologyOperationType>(null);

    const pageContext = useRef<PatchPageContext>(new PatchPageContext())
    const gridInfo = useRef<GridCheckingInfo | null>(null)

    const highSpeedMode = useSettingsStore(state => state.highSpeedMode)

    useEffect(() => {
        const map = store.get<mapboxgl.Map>('map')!
        const canvas = map.getCanvas()
        const localIsMouseDown = { current: false }
        const localMouseDownPos = { current: [0, 0] as [number, number] }
        const localMouseMovePos = { current: [0, 0] as [number, number] }

        const onMouseDown = (e: MouseEvent) => {
            if (!e.shiftKey) return;
            localIsMouseDown.current = true;
            map.dragPan.disable();
            map.scrollZoom.disable();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            localMouseDownPos.current = [x, y];

            if (checkSwitchOn) {
                gridInfo.current = topologyLayer!.executeCheckGrid([x, y])
                triggerRepaint()
            }
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!e.shiftKey || !localIsMouseDown.current) return;
            if (checkSwitchOn) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            localMouseMovePos.current = [x, y];

            if (selectTab === 'brush') {
                topologyLayer!.executePickGrids(
                    selectTab,
                    pickingTab,
                    [localMouseMovePos.current[0], localMouseMovePos.current[1]]
                );
            } else {
                map!.dragPan.disable();
                if (map!.getCanvas()) {
                    map!.getCanvas().style.cursor = 'crosshair';
                }

                topologyLayer!.executeDrawBox(
                    [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                    [localMouseMovePos.current[0], localMouseMovePos.current[1]]
                );
            }
        }

        const onMouseUp = (e: MouseEvent) => {
            if (!localIsMouseDown.current) return
            localIsMouseDown.current = false

            if (map) {
                map.dragPan.enable();
                map.scrollZoom.enable();
                topologyLayer!.executeClearDrawBox();
                if (map.getCanvas()) {
                    map.getCanvas().style.cursor = '';
                }
            }

            if (!e.shiftKey) return
            if (checkSwitchOn) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const localMouseUpPos = [x, y]

            topologyLayer!.executePickGrids(
                selectTab,
                pickingTab,
                [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                [localMouseUpPos[0], localMouseUpPos[1]]
            )
        }

        const onMouseOut = (e: MouseEvent) => {
            if (checkSwitchOn) return;
            if (map) {
                map.dragPan.enable();
                map.scrollZoom.enable();
                topologyLayer!.executeClearDrawBox();
                if (map.getCanvas()) {
                    map.getCanvas().style.cursor = '';
                }
            }
            if (!e.shiftKey) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const mouseUpPos = [x, y]

            topologyLayer!.executePickGrids(
                selectTab,
                pickingTab,
                [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                [mouseUpPos[0], mouseUpPos[1]]
            )
        }
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseout', onMouseOut)

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown)
            canvas.removeEventListener('mousemove', onMouseMove)
            canvas.removeEventListener('mouseup', onMouseUp)
            canvas.removeEventListener('mouseout', onMouseOut)
        }
    }, [selectTab, pickingTab, checkSwitchOn, topologyLayer])

    useEffect(() => {
        loadContext(node as SceneNode)
        return () => {
            unloadContext(node as SceneNode)
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        store.get<{ on: Function, off: Function }>('isLoading')!.on()
        await setPatch(node as SceneNode)

        pageContext.current = await node.getPageContext() as PatchPageContext

        const map = store.get<mapboxgl.Map>('map')!
        const pc = pageContext.current

        const waitForMapLoad = () => {
            return new Promise<void>((resolve) => {
                if (map.loaded()) {
                    resolve()
                } else {
                    map.once('load', () => {
                        resolve()
                    })
                }
            })
        }

        await waitForMapLoad()

        const waitForClg = () => {
            return new Promise<CustomLayerGroup>((resolve) => {
                const checkClg = () => {
                    const clg = store.get<CustomLayerGroup>('clg')!
                    if (clg) {
                        resolve(clg)
                    } else {
                        setTimeout(checkClg, 100)
                    }
                }
                checkClg()
            })
        }

        const clg = await waitForClg()

        const gridContext: GridContext = {
            srcCS: `EPSG:${pageContext.current.patch?.epsg}`,
            targetCS: 'EPSG:4326',
            bBox: boundingBox2D(...pageContext.current.patch!.bounds),
            rules: pageContext.current.patch!.subdivide_rules
        }
        const gridLayer = new TopologyLayer(map)
        clg.addLayer(gridLayer)
        const gridCore: GridCore = new GridCore(gridContext, node.tree.isPublic)
        await gridLayer.initialize(map, map.painter.context.gl)
        pc.topologyLayer = gridLayer
        gridLayer.gridCore = gridCore
        pc.gridCore = gridCore

        setTopologyLayer(pc.topologyLayer)
        setPickingTab(pc.editingState.pick)
        setSelectTab(pc.editingState.select)
        setCheckSwitchOn(pc.isChecking)

        if (pc.topologyLayer && pc.isChecking) {
            pc.topologyLayer.setCheckMode(pc.isChecking)
        }

        store.get<{ on: Function, off: Function }>('isLoading')!.off()
        const boundsOn4326 = convertToWGS84(pageContext.current.patch!.bounds, pageContext.current.patch!.epsg.toString())
        map.fitBounds(boundsOn4326, {
            duration: 1000,
            padding: { top: 50, bottom: 50, left: 100, right: 100 }
        });
    }

    const unloadContext = (node: SceneNode) => {
        const core: GridCore = pageContext.current.gridCore!
        core.save(() => { })

        const clg = store.get<CustomLayerGroup>('clg')!
        clg.removeLayer('TopologyLayer')

        pageContext.current.editingState.select = selectTab
        pageContext.current.editingState.pick = pickingTab
        pageContext.current.isChecking = checkSwitchOn
    }

    const handleSelectAllClick = () => {
        if (highSpeedMode) {
            handleConfirmSelectAll();
            return;
        }
        setSelectAllDialogOpen(true);
    };

    const handleDeleteSelectClick = () => {
        if (highSpeedMode) {
            handleConfirmDeleteSelect();
            return;
        }
        setDeleteSelectDialogOpen(true);
    };

    const handleConfirmSelectAll = useCallback(() => {
        setSelectAllDialogOpen(false);
        topologyLayer!.executePickAllGrids();
    }, [topologyLayer])

    const handleConfirmDeleteSelect = useCallback(() => {
        setDeleteSelectDialogOpen(false);
        topologyLayer!.executeClearSelection();
    }, [topologyLayer]);

    const handlePatchDelete = async () => {
        const response = await deletepatch(node as SceneNode, node.tree.isPublic)
        if (response) {
            toast.success('Patch deleted successfully')
            const tree = node.tree as SceneTree
            await tree.removeNode(node)
        } else {
            toast.error('Failed to delete patch')
        }
    }

    const handleConfirmTopologyAction = useCallback(() => {
        switch (activeTopologyOperation) {
            case 'subdivide':
                topologyLayer!.executeSubdivideGrids()
                break;
            case 'merge':
                topologyLayer!.executeMergeGrids()
                break;
            case 'delete':
                topologyLayer!.executeDeleteGrids()
                break;
            case 'recover':
                topologyLayer!.executeRecoverGrids()
                break;
            default:
                console.warn('No active topology operation to confirm.');
        }
        setActiveTopologyOperation(null);
    }, [activeTopologyOperation, topologyLayer]);

    const onTopologyOperationClick = (operationType: string) => {
        if (highSpeedMode && operationType !== null) {
            switch (operationType) {
                case 'subdivide':
                    topologyLayer!.executeSubdivideGrids();
                    break;
                case 'merge':
                    topologyLayer!.executeMergeGrids();
                    break;
                case 'delete':
                    topologyLayer!.executeDeleteGrids();
                    break;
                case 'recover':
                    topologyLayer!.executeRecoverGrids();
                    break;
                default:
                    console.warn(
                        'Unknown topology operation type:',
                        operationType
                    );
            }
        } else {
            setActiveTopologyOperation(operationType as TopologyOperationType);
        }
    };

    const handleFeatureClick = useCallback(async () => {
        const currentTab: 'brush' | 'box' | 'feature' = selectTab
        setSelectTab('feature')
        if (window.electronAPI && typeof window.electronAPI.openFileDialog === 'function') {
            try {
                const filePath = await window.electronAPI.openFileDialog();
                if (filePath) {
                    console.log('Selected file path:', filePath);
                    store.get<{ on: Function; off: Function }>('isLoading')!.on();
                    topologyLayer!.executePickGridsByFeature(filePath);
                    setSelectTab(currentTab)
                } else {
                    console.log('No file selected');
                    setSelectTab(currentTab)
                }
            } catch (error) {
                console.error('Error opening file dialog:', error);
                setSelectTab(currentTab)
            }
        } else {
            console.warn('Electron API not available');
            setSelectTab(currentTab)
        }
    }, [topologyLayer])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (checkSwitchOn) return;
            if (event.ctrlKey || event.metaKey) {
                if (event.key === 'P' || event.key === 'p') {
                    event.preventDefault();
                    setPickingTab(true)
                }
                if (event.key === 'U' || event.key === 'u') {
                    event.preventDefault();
                    setPickingTab(false)
                }
                if (event.key === 'A' || event.key === 'a') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        handleConfirmSelectAll()
                    } else {
                        setSelectAllDialogOpen(true);
                    }
                }
                if (event.key === 'C' || event.key === 'c') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        handleConfirmDeleteSelect();
                    } else {
                        setDeleteSelectDialogOpen(true);
                    }
                }
                if (event.key === '1') {
                    event.preventDefault();
                    pageContext.current!.editingState.select = 'brush'
                    setSelectTab('brush')
                }
                if (event.key === '2') {
                    event.preventDefault();
                    pageContext.current!.editingState.select = 'box'
                    setSelectTab('box')
                }
                if (event.key === '3') {
                    event.preventDefault();
                    pageContext.current!.editingState.select = 'feature'
                    setSelectTab('feature')
                    handleFeatureClick();
                }
                if (event.key === 'S' || event.key === 's') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        topologyLayer!.executeSubdivideGrids();
                    } else {
                        setActiveTopologyOperation('subdivide');
                    }
                }
                if (event.key === 'M' || event.key === 'm') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        topologyLayer!.executeMergeGrids();
                    } else {
                        setActiveTopologyOperation('merge');
                    }
                }
                if (event.key === 'D' || event.key === 'd') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        topologyLayer!.executeDeleteGrids();
                    } else {
                        setActiveTopologyOperation('delete');
                    }
                }
                if (event.key === 'R' || event.key === 'r') {
                    event.preventDefault();
                    if (highSpeedMode) {
                        topologyLayer!.executeRecoverGrids();
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
        handleConfirmDeleteSelect,
        handleConfirmSelectAll,
        selectTab,
        topologyLayer,
        checkSwitchOn,
        highSpeedMode
    ]);

    const toggleCheckSwitch = () => {
        if (checkSwitchOn === pageContext.current!.isChecking) {
            const newCheckState = !checkSwitchOn
            setCheckSwitchOn(newCheckState)
            pageContext.current!.isChecking = newCheckState

            if (topologyLayer) {
                topologyLayer.setCheckMode(newCheckState)
            }
        }
    }

    const handleSaveTopologyState = () => {
        const core: GridCore = pageContext.current.gridCore!
        core.save(() => {
            toast.success(`Topology edit state of ${pageContext.current.patch?.name} saved successfully`)
        })
    };

    return (
        <div className='w-full h-full flex flex-row'>
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
                                Topology Editor
                                <span className=' bg-[#D63F26] rounded px-0.5 mb-2 text-[12px] inline-flex items-center mx-1'>{node.tree.isPublic ? 'Public' : 'Private'}</span>
                                <span>[{node.name}]</span>
                            </h1>
                            {/* ----------*/}
                            {/* Page Tips */}
                            {/* ----------*/}
                            <div className='text-sm p-2 px-4 w-full'>
                                <ul className='list-disc space-y-1'>
                                    {topologyTips.map((tip, index) => (
                                        <li key={index}>
                                            {tip.tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className='text-sm w-full flex flex-row space-x-4 px-4'>
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
                                    onClick={toggleCheckSwitch}
                                >
                                    <span>Check</span>
                                    <Separator orientation='vertical' className='h-4 mx-2' />
                                    <Switch
                                        className='data-[state=checked]:bg-amber-300 data-[state=unchecked]:bg-gray-300 cursor-pointer'
                                        checked={checkSwitchOn}
                                        onCheckedChange={toggleCheckSwitch}
                                    />
                                </div>
                                <Button
                                    className='bg-green-500 hover:bg-green-600 h-8 text-white cursor-pointer rounded-sm flex'
                                    onClick={handleSaveTopologyState}
                                >
                                    <span>Save</span>
                                    <Separator orientation='vertical' className='h-4' />
                                    <Save className='w-4 h-4' />
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* ---------------- */}
                    {/* Grid Schema Form */}
                    {/* ---------------- */}
                    <ScrollArea className='flex-1 h-[calc(100vh-16rem)]'>
                        <div className='w-3/5 mx-auto'>
                            <div className='p-3 rounded-md shadow-sm'>
                                <h2 className='text-xl font-bold text-white'>Current Editing Information</h2>
                                <div className='text-sm text-white mt-1 grid gap-1'>
                                    <div>
                                        <span className='font-bold'>Patch Name: </span>
                                        {pageContext.current?.patch?.name}
                                    </div>
                                    <div>
                                        <span className='font-bold'>EPSG: </span>
                                        {pageContext.current?.patch?.epsg}
                                    </div>
                                    <div className='flex items-start flex-row'>
                                        <div className={`font-bold w-[35%]`}>Grid Levels(m): </div>
                                        <div className='space-y-1'>
                                            {pageContext.current?.patch?.subdivide_rules && (
                                                pageContext.current?.patch?.subdivide_rules.map(
                                                    (level: number[], index: number) => {
                                                        const color = topologyLayer!.paletteColorList ?
                                                            [topologyLayer!.paletteColorList[(index + 1) * 3], topologyLayer!.paletteColorList[(index + 1) * 3 + 1], topologyLayer!.paletteColorList[(index + 1) * 3 + 2]] : null;
                                                        const colorStyle = color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : undefined;

                                                        return (
                                                            <div key={index} className='text-sm'
                                                                style={{ color: colorStyle }}
                                                            >
                                                                level {index + 1}: [{level.join(', ')}]
                                                            </div>
                                                        );
                                                    }
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className='font-bold'>
                                        <span className='text-white'>BoundingBox:</span>
                                        {/* {bounds ? ( */}
                                        <div className='grid grid-cols-3 gap-1 text-xs text-white mt-4'>
                                            {/* Top Left Corner */}
                                            <div className='relative h-8 flex items-center justify-center'>
                                                <div className='absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-300 rounded-tl'></div>
                                            </div>
                                            {/* North/Top */}
                                            <div className='text-center'>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-col items-center'>
                                                                <ArrowUp className='h-4 w-4 text-blue-500' />
                                                                <span className='font-bold text-blue-500 text-sm mb-1'>N</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className='text-[12px] space-y-1'>
                                                                <p className='font-bold text-blue-500'>North</p>
                                                                <p>{pageContext.current?.patch?.bounds[3].toFixed(6)}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {/* Top Right Corner */}
                                            <div className='relative h-8 flex items-center justify-center'>
                                                <div className='absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-300 rounded-tr'></div>
                                            </div>
                                            {/* West/Left */}
                                            <div className='text-center'>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-row items-center justify-center gap-1 mt-2'>
                                                                <ArrowLeft className='h-4 w-4 text-green-500' />
                                                                <span className='font-bold text-green-500 text-sm mr-1 mt-1'>W</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className='text-[12px]'>
                                                                <p className='font-bold mb-1 text-green-500'>West</p>
                                                                <p>{pageContext.current?.patch?.bounds[0].toFixed(6)}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {/* Center */}
                                            <div className='text-center'>
                                                <span className='font-bold text-[14px] text-orange-500'>Center</span>
                                                <div className='text-[12px]'>
                                                    <div>{pageContext.current?.patch && ((pageContext.current?.patch?.bounds[0] + pageContext.current?.patch?.bounds[2]) / 2).toFixed(6)}</div>
                                                    <div>{pageContext.current?.patch && ((pageContext.current?.patch?.bounds[1] + pageContext.current?.patch?.bounds[3]) / 2).toFixed(6)}</div>
                                                </div>
                                            </div>
                                            {/* East/Right */}
                                            <div className='text-center'>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-row items-center justify-center gap-1 mt-2'>
                                                                <span className='font-bold text-red-500 text-sm mt-1 ml-4'>E</span>
                                                                <ArrowRight className='h-4 w-4 text-red-500' />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className='text-[12px]'>
                                                                <p className='font-bold mb-1 text-red-500'>East</p>
                                                                <p>{pageContext.current?.patch?.bounds[2].toFixed(6)}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {/* Bottom Left Corner */}
                                            <div className='relative h-8 flex items-center justify-center'>
                                                <div className='absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-300 rounded-bl'></div>
                                            </div>
                                            {/* South/Bottom */}
                                            <div className='text-center'>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-col items-center'>
                                                                <span className='font-bold text-purple-500 text-sm mt-1'>S</span>
                                                                <ArrowDown className='h-4 w-4 text-purple-500' />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className='text-[12px]'>
                                                                <p className='font-bold mb-1 text-purple-500'>South</p>
                                                                <p>{pageContext.current?.patch?.bounds[1].toFixed(6)}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {/* Bottom Right Corner */}
                                            <div className='relative h-8 flex items-center justify-center'>
                                                <div className='absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-300 rounded-br'></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='w-full flex flex-row border-t-2 border-[#414141] relative mb-2'>
                            {checkSwitchOn && (
                                <div className='absolute w-5/7 inset-0 bg-black/10 z-10 flex items-center justify-center rounded-md backdrop-blur-sm'>
                                    <div className=' text-white px-6 py-3 rounded-lg text-center'>
                                        <span className='text-3xl font-bold'>Check Mode On</span>
                                        <p className='text-sm mt-1'>Please click the grid to view information</p>
                                    </div>
                                </div>
                            )}
                            <div className='w-5/7 mx-auto space-y-4 pl-4 pr-1 border-r border-[#414141]'>
                                <div className='space-y-2 p-2'>
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
                                                    className='cursor-pointer'
                                                    onClick={() => { setPickingTab(true) }}
                                                >
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleConfirmSelectAll}
                                                    className='bg-green-500 hover:bg-green-600 cursor-pointer'
                                                >
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
                                                    className='cursor-pointer'
                                                    onClick={() => { setPickingTab(true) }}
                                                >
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleConfirmDeleteSelect}
                                                    className='bg-red-500 hover:bg-red-600 cursor-pointer'
                                                >
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
                                                <AlertDialogCancel className='cursor-pointer'>
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
                                    <div className='space-y-2'>
                                        <h1 className='text-2xl font-bold text-white'>Picking</h1>
                                        <div className='mt-2'>
                                            <h3 className='text-md mb-1 font-bold text-white'>Operation</h3>
                                            <div className='flex items-center gap-1 p-1 h-[64px] border border-gray-200 rounded-lg'>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md transition-colors text-white duration-200 flex flex-col text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${pickingTab === true ? 'bg-gray-600 ' : 'bg-transparent hover:bg-gray-500'}`}
                                                    onClick={() => { !checkSwitchOn && setPickingTab(true) }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <SquareMousePointer className='h-4 w-4' />
                                                        Picking
                                                    </div>
                                                    <div className={`text-xs ${pickingTab === true && ' text-white'}`}>
                                                        [ Ctrl+P ]
                                                    </div>
                                                </button>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md transition-colors text-white duration-200 flex flex-col text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${pickingTab === false ? 'bg-gray-700 ' : 'bg-transparent hover:bg-gray-500'}`}
                                                    onClick={() => { !checkSwitchOn && setPickingTab(false) }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <SquareDashedMousePointer className='h-4 w-4' />
                                                        Unpicking
                                                    </div>
                                                    <div className={`text-xs ${pickingTab === false && ' text-white'}`}>
                                                        [Ctrl+U]
                                                    </div>
                                                </button>
                                            </div>
                                            <div className='flex items-center gap-1 p-1 mt-2 h-[64px] border border-gray-200 rounded-lg'>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${selectAllDialogOpen ? 'bg-green-500 ' : ' hover:bg-green-500'}`}
                                                    onClick={() => { !checkSwitchOn && handleSelectAllClick() }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <Grip className='h-4 w-4' />
                                                        Select All
                                                    </div>
                                                    <div className={`text-xs ${selectAllDialogOpen && ' text-white'}`}>
                                                        [ Ctrl+A ]
                                                    </div>
                                                </button>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md text-white transition-colors duration-200 flex flex-col text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${deleteSelectDialogOpen ? 'bg-red-500 ' : ' hover:bg-red-500'}`}
                                                    onClick={() => { !checkSwitchOn && handleDeleteSelectClick() }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <CircleOff className='h-4 w-4' />
                                                        Cancel All
                                                    </div>
                                                    <div className={`text-xs ${deleteSelectDialogOpen && ' text-white'}`}>
                                                        [ Ctrl+C ]
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                        <div className='mb-2'>
                                            <h3 className='text-md mb-1 font-bold text-white'>Mode</h3>
                                            <div className='flex items-center h-[64px] mb-1 p-1 gap-1 rounded-lg border border-gray-200 shadow-md'>
                                                <button
                                                    className={` flex-1 py-2 px-3 rounded-md transition-colors duration-200 text-white flex flex-col gap-0.5 text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${selectTab === 'brush' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                    onClick={() => { !checkSwitchOn && setSelectTab('brush') }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <Brush className='h-4 w-4' />
                                                        Brush
                                                    </div>
                                                    <div className={`text-xs ${selectTab === 'brush' && 'text-white'} `}>
                                                        [ Ctrl+1 ]
                                                    </div>
                                                </button>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 text-white flex flex-col gap-0.5 text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${selectTab === 'box' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                    onClick={() => { !checkSwitchOn && setSelectTab('box') }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <SquareDashed className='h-4 w-4' />
                                                        Box
                                                    </div>
                                                    <div className={`text-xs ${selectTab === 'box' && 'text-white'} `}>
                                                        [ Ctrl+2 ]
                                                    </div>
                                                </button>
                                                <button
                                                    className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 flex flex-col text-white gap-0.5 text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                                                            ${selectTab === 'feature' ? 'bg-[#FF8F2E] ' : ' hover:bg-gray-500'}`}
                                                    onClick={() => { !checkSwitchOn && handleFeatureClick() }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <FolderOpen className='h-4 w-4' />
                                                        Feature
                                                    </div>
                                                    <div className={`text-xs ${selectTab === 'feature' && 'text-white'} `}>
                                                        [ Ctrl+3 ]
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator className='my-6 bg-[#414141]' />
                                    <div className='space-y-2'>
                                        <h1 className='text-2xl font-bold text-white'>Topology</h1>
                                        <div className='flex items-center h-[56px] mt-2 mb-2 p-1 space-x-1 border border-gray-200 rounded-lg shadow-md'>
                                            {topologyOperations.map((operation) => (
                                                <button
                                                    key={operation.type}
                                                    className={`flex-1 py-1 px-2 rounded-md transition-colors duration-200 flex flex-col gap-0.5 text-sm justify-center items-center ${checkSwitchOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-white'} 
                                                            ${activeTopologyOperation === operation.type ? operation.activeColor : `${operation.hoverColor}`}`}
                                                    onClick={() => { !checkSwitchOn && onTopologyOperationClick(operation.type) }}
                                                    disabled={checkSwitchOn}
                                                >
                                                    <div className='flex flex-row items-center'>
                                                        {operation.text}
                                                    </div>
                                                    <div className='text-xs text-white'>
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
                            <div className='w-2/7 mx-auto space-y-4 pr-4 pl-1 border-l border-[#414141]'>
                                <div className='space-y-2 p-2 mb-4'>
                                    <h1 className='text-2xl font-bold text-white'>Checking</h1>
                                    <div className='space-y-2 p-1 text-white'>
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-300'>Level</span>
                                            <span className='text-lg font-semibold'>{gridInfo.current?.level ?? '-'}</span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-300'>Local ID</span>
                                            <span className='text-lg font-semibold'>{gridInfo.current?.localId ?? '-'}</span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-300'>Deleted</span>
                                            <span className='text-lg font-semibold'>
                                                {gridInfo.current?.deleted === true
                                                    ? 'True'
                                                    : gridInfo.current?.deleted === false
                                                        ? 'False'
                                                        : '-'}
                                            </span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-300'>Global ID</span>
                                            <span className='text-lg font-semibold'>{gridInfo.current?.globalId ?? '-'}</span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-300'>Storage ID</span>
                                            <span className='text-lg font-semibold'>{gridInfo.current?.storageId ?? '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className='w-3/4 h-full py-4 pr-4 relative'>
                <div className='absolute left-0 z-10'>
                    <CapacityBar gridCore={pageContext.current.gridCore!} />
                </div>
                <MapContainer node={node} style='w-full h-full rounded-lg shadow-lg bg-gray-200' />
            </div>
        </div>
    )
}
