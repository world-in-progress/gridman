'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../../../context';
import type { TestProps } from '../types/types';
import store from '@/store';
import type NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
import LUMDataNode from './LUMDataNode';
import TerrainDataNode from './TerrainDataNode';
import TopologyValidation from './TopologyValidation';
import {
    AnimatedCardNoShadow,
    CardBackground,
    Blob,
} from './nodeBackground';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/utils';

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

type ActiveNode = 'TOPOLOGY' | 'LUM' | 'TERRAIN' | null;

export default function Test({}: TestProps) {
    const { language } = useContext(LanguageContext);
    const [activeNodeKey, setActiveNodeKey] = useState<ActiveNode>(null);

    const clg = store.get<NHLayerGroup>('clg')!;
    // const attributeLayer = clg.getLayerInstance(
    //     'AttributeLayer'
    // )! as AttributeLayer;

    const topologyCardRef = useRef<HTMLDivElement>(null);
    const terrainCardRef = useRef<HTMLDivElement>(null); // This ref will be passed to TerrainDataNode
    const lumCardRef = useRef<HTMLDivElement>(null); // This ref will be passed to LUMDataNode
    const containerRef = useRef<HTMLDivElement>(null);

    const [lines, setLines] = useState<Line[]>([]);

    const handleNodeClick = (nodeKey: ActiveNode) => {
        setActiveNodeKey((prevKey) => (prevKey === nodeKey ? null : nodeKey));
    };

    useEffect(() => {
        // Ensure refs are attached to the correct elements based on active state for line drawing
        const currentTopologyRef =
            (activeNodeKey === 'TOPOLOGY' &&
                topologyCardRef.current?.querySelector(
                    '.animated-card-actual-content'
                )) ||
            topologyCardRef.current;
        const currentTerrainRef =
            (activeNodeKey === 'TERRAIN' &&
                terrainCardRef.current?.querySelector(
                    '.animated-card-actual-content'
                )) ||
            terrainCardRef.current;
        const currentLumRef =
            (activeNodeKey === 'LUM' &&
                lumCardRef.current?.querySelector(
                    '.animated-card-actual-content'
                )) ||
            lumCardRef.current;

        if (
            topologyCardRef.current &&
            currentTerrainRef &&
            currentLumRef &&
            containerRef.current
        ) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const topologyRect =
                topologyCardRef.current.getBoundingClientRect();
            // Cast to HTMLElement to access getBoundingClientRect
            const terrainRect = (
                currentTerrainRef as HTMLElement
            ).getBoundingClientRect();
            const lumRect = (
                currentLumRef as HTMLElement
            ).getBoundingClientRect();

            const newLines: Line[] = [];

            newLines.push({
                x1:
                    topologyRect.left -
                    containerRect.left +
                    topologyRect.width / 2,
                y1: topologyRect.bottom - containerRect.top + 5, // Small offset for arrowhead
                x2:
                    terrainRect.left -
                    containerRect.left +
                    terrainRect.width / 2,
                y2: terrainRect.top - containerRect.top - 5, // Offset for arrowhead
            });

            newLines.push({
                x1:
                    topologyRect.left -
                    containerRect.left +
                    topologyRect.width / 2,
                y1: topologyRect.bottom - containerRect.top + 5, // Small offset for arrowhead
                x2: lumRect.left - containerRect.left + lumRect.width / 2,
                y2: lumRect.top - containerRect.top - 5, // Offset for arrowhead
            });
            setLines(newLines);
        }
    }, [
        language,
        activeNodeKey, // Add activeNodeKey as a dependency
        topologyCardRef,
        terrainCardRef,
        lumCardRef,
        containerRef,
    ]);

    return (
        <>
            <div
                ref={containerRef}
                className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative"
            >
                <h3 className="text-2xl mt-1 ml-1 mb-2 font-bold">
                    {language === 'zh' ? '工作流' : 'Workflow'}
                </h3>
                {/* 拓扑验证卡片 */}
                <div className="mt-2 p-4 bg-gray-200 rounded-md shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center mt-2">
                        <TopologyValidation
                            ref={topologyCardRef}
                            isClicked={activeNodeKey === 'TOPOLOGY'}
                            onNodeClick={() => handleNodeClick('TOPOLOGY')}
                        />
                    </div>

                    {/* SVG for lines */}
                    <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="0"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="#666"
                                />
                            </marker>
                            <linearGradient
                                id="lineGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor="#4F46E5" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                        {lines.map((line, index) => (
                            <g key={index}>
                                {/* Animated dashed line */}
                                <line
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke="url(#lineGradient)"
                                    strokeWidth="2"
                                    strokeDasharray="6"
                                    markerEnd="url(#arrowhead)"
                                >
                                    <animate
                                        attributeName="stroke-dashoffset"
                                        from="24"
                                        to="0"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </line>
                            </g>
                        ))}
                    </svg>

                    {/* 地形数据和土地利用数据卡片容器 */}
                    <div className="flex justify-around mt-8 relative z-10">
                        {/* 地形数据卡片 */}
                        <TerrainDataNode
                            ref={terrainCardRef}
                            isClicked={activeNodeKey === 'TERRAIN'}
                            onNodeClick={() => handleNodeClick('TERRAIN')}
                        />
                        {/* 土地利用数据卡片 */}
                        <LUMDataNode
                            ref={lumCardRef}
                            isClicked={activeNodeKey === 'LUM'}
                            onNodeClick={() => handleNodeClick('LUM')}
                        />
                    </div>
                </div>
            </div>
            <div className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
                <div className="flex flex-row gap-2 items-center">
                    <h3 className="text-2xl font-bold w-[55.5%]">
                        {language === 'zh' ? '节点功能' : 'Node Function'}:
                    </h3>
                    {activeNodeKey && (
                        <AnimatedCardNoShadow className="w-[42%] p-1 bg-gray-200">
                            <CardBackground />
                            <Blob />
                            <div className="bg-white rounded-lg text-xs font-bold flex justify-center items-center border p-1 border-gray-200 z-20 relative">
                                <span className="text-center">
                                    {language === 'zh'
                                        ? activeNodeKey === 'TOPOLOGY'
                                            ? '拓扑验证'
                                            : activeNodeKey === 'LUM'
                                            ? '土地利用数据'
                                            : activeNodeKey === 'TERRAIN'
                                            ? '地形数据'
                                            : ''
                                        : activeNodeKey === 'TOPOLOGY'
                                        ? 'Topology Validation'
                                        : activeNodeKey === 'LUM'
                                        ? 'LUM Data'
                                        : activeNodeKey === 'TERRAIN'
                                        ? 'Terrain Data'
                                        : ''}
                                </span>
                            </div>
                        </AnimatedCardNoShadow>
                    )}
                </div>
                <div className="mt-2 p-2 space-y-1 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md font-bold">
                        {language === 'zh' ? '描述' : 'Description'}:
                    </h3>
                    <div className="text-gary-600 text-sm">
                        Node Function Description
                    </div>
                </div>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md font-bold">
                        {language === 'zh' ? '功能区域' : 'Function Area'}
                    </h3>
                    <div className="space-y-2 mt-1">
                        <div className="flex flex-row bg-white rounded-md shadow-sm border border-gray-200 p-2">
                            <div className="grid w-full max-w-sm items-center gap-2">
                                <Label
                                    htmlFor="tif-upload"
                                    className="flex items-center text-sm font-medium"
                                >
                                    {language === 'zh'
                                        ? '数据上传（栅格）'
                                        : 'Data Upload (Raster)'}
                                </Label>
                                <div
                                    className={cn(
                                        'relative flex items-center justify-center w-full h-[120px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200'
                                    )}
                                >
                                    <Input
                                        id="tif-upload"
                                        type="file"
                                        accept=".tif,.tiff"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                                        <Upload className="h-8 w-8 text-gray-500" />
                                        <span className="text-xs text-gray-600 font-medium">
                                            {language === 'zh'
                                                ? '拖放或点击上传 .tif 文件'
                                                : 'Drag and drop or click to upload .tif file'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row bg-white rounded-md shadow-sm border border-gray-200 p-2">
                            <div className="grid w-full max-w-sm items-center gap-2">
                                <Label
                                    htmlFor="tif-upload"
                                    className="flex items-center text-sm font-medium"
                                >
                                    {language === 'zh'
                                        ? '数值调整'
                                        : 'Value Adjustment'}
                                </Label>
                                <div
                                    className={cn(
                                        'relative flex items-center justify-center w-full h-[120px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200'
                                    )}
                                >
                                    <Input
                                        id="tif-upload"
                                        type="file"
                                        accept=".tif,.tiff"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                                        <Upload className="h-8 w-8 text-gray-500" />
                                        <span className="text-xs text-gray-600 font-medium">
                                            {language === 'zh'
                                                ? '拖放或点击上传 .tif 文件'
                                                : 'Drag and drop or click to upload .tif file'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
