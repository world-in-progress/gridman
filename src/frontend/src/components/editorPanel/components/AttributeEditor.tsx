import { useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../../../context';
import { AttributePanelProps } from '../types/types';
import store from '@/store';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
// import AttributeLayer from '@/components/mapComponent/layers/AttributeLayer';

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function AttributePanel({}: AttributePanelProps) {
    const { language } = useContext(LanguageContext);

    const clg = store.get<NHLayerGroup>('clg')!;
    // const attributeLayer = clg.getLayerInstance(
    //     'AttributeLayer'
    // )! as AttributeLayer;

    const topologyCardRef = useRef<HTMLDivElement>(null);
    const terrainCardRef = useRef<HTMLDivElement>(null);
    const lumCardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [lines, setLines] = useState<Line[]>([]);

    useEffect(() => {
        if (
            topologyCardRef.current &&
            terrainCardRef.current &&
            lumCardRef.current &&
            containerRef.current
        ) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const topologyRect =
                topologyCardRef.current.getBoundingClientRect();
            const terrainRect = terrainCardRef.current.getBoundingClientRect();
            const lumRect = lumCardRef.current.getBoundingClientRect();

            const newLines: Line[] = [];

            // Line from Topology to Terrain
            newLines.push({
                x1:
                    topologyRect.left -
                    containerRect.left +
                    topologyRect.width / 2,
                y1: topologyRect.bottom - containerRect.top,
                x2:
                    terrainRect.left -
                    containerRect.left +
                    terrainRect.width / 2,
                y2: terrainRect.top - containerRect.top,
            });

            // Line from Topology to LUM
            newLines.push({
                x1:
                    topologyRect.left -
                    containerRect.left +
                    topologyRect.width / 2,
                y1: topologyRect.bottom - containerRect.top,
                x2: lumRect.left - containerRect.left + lumRect.width / 2,
                y2: lumRect.top - containerRect.top,
            });
            setLines(newLines);
        }
    }, [
        language,
        topologyCardRef.current,
        terrainCardRef.current,
        lumCardRef.current,
        containerRef.current,
    ]); // Rerun on language change or if refs become available

    return (
        <>
            <div
                ref={containerRef}
                className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative"
            >
                <h3 className="text-2xl mt-1 ml-1 font-bold">
                    {language === 'zh'
                        ? '属性编辑器工作流'
                        : 'Attribute Editor Workflow'}
                </h3>
                {/* 拓扑编辑卡片 */}
                <div
                    ref={topologyCardRef}
                    className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200"
                >
                    <h3 className="text-md ml-1 mb-1 font-bold text-center">
                        {language === 'zh' ? '拓扑编辑' : 'Topology Validation'}
                    </h3>
                </div>

                {/* SVG for lines */}
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 0 }}
                >
                    {lines.map((line, index) => (
                        <line
                            key={index}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="gray"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* 地形数据和土地利用数据卡片容器 */}
                <div className="flex justify-around mt-8 relative" style={{ zIndex: 1 }}> {/* Increased mt and added relative z-index */}
                    {/* 地形数据卡片 */}
                    <div
                        ref={terrainCardRef}
                        className="w-5/12 p-2 bg-white rounded-md shadow-sm border border-gray-200"
                    >
                        <h3 className="text-md ml-1 mb-1 font-bold text-center">
                            {language === 'zh' ? '地形数据' : 'Terrain Data'}
                        </h3>
                    </div>
                    {/* 土地利用数据卡片 */}
                    <div
                        ref={lumCardRef}
                        className="w-5/12 p-2 bg-white rounded-md shadow-sm border border-gray-200"
                    >
                        <h3 className="text-md ml-1 mb-1 font-bold text-center">
                            {language === 'zh' ? '土地利用数据' : 'LUM Data'}
                        </h3>
                    </div>
                </div>
            </div>
            {/* <div className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
                <h3 className="text-2xl mt-1 ml-1 font-bold">
                    {language === 'zh'
                        ? '工作流节点功能'
                        : 'Workflow Node Function'}
                </h3>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '拓扑编辑' : 'Topology Validation'}
                    </h3>
                </div>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '地形数据' : 'Terrain Data'}
                    </h3>
                </div>
                <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <h3 className="text-md ml-1 mb-1 font-bold">
                        {language === 'zh' ? '土地利用数据' : 'LUM Data'}
                    </h3>
                </div>
            </div> */}
        </>
    );
}
