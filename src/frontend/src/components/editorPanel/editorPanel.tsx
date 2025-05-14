import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft, Trash2, FolderOpen } from 'lucide-react';
import BrushCard from './components/brushCard';
import { EditorPanelProps } from './types/types';
import BasicInfo from './components/basicInfo';
import brush from '/icon/tool_brush.png';
import box from '/icon/tool_box.png';
import clear from '/icon/tool_clear.png';
import feature from '/icon/tool_feature.png';

export default function EditorPanel({ onBack, ...props }: EditorPanelProps) {
    const { language } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState<'topology' | 'attribute'>(
        'topology'
    );
    const [pickingTab, setPickingTab] = useState<'picking' | 'unpicking'>(
        'picking'
    );
    const [activeTopologyTab, setActiveTopologyTab] = useState<
        'brush' | 'box' | 'feature'
    >('brush');

    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <div className="flex items-center p-3 justify-between">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh' ? '编辑面板' : 'Editor Panel'}
                    </h1>
                </div>

                <div className="p-2">
                    <div className="flex items-center p-1 mb-2 bg-gray-200 rounded-md">
                        <button
                            className={` flex-1 py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer ${
                                activeTab === 'topology'
                                    ? 'bg-black text-white'
                                    : 'bg-transparent hover:bg-gray-300 '
                            }`}
                            onClick={() => setActiveTab('topology')}
                        >
                            {language === 'zh' ? '拓扑' : 'Topology'}
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer ${
                                activeTab === 'attribute'
                                    ? 'bg-black text-white'
                                    : 'bg-transparent hover:bg-gray-300 '
                            }`}
                            onClick={() => setActiveTab('attribute')}
                        >
                            {language === 'zh' ? '属性' : 'Attribute'}
                        </button>
                    </div>

                    <BasicInfo />
                    <div className="mt-2 space-y-2 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold">
                            {language === 'zh'
                                ? '选择操作'
                                : 'Picking Operation'}
                        </h3>
                        <div className="flex flex-row space-x-1">
                            <div className="flex items-center w-[67%] h-[43px] p-1 bg-gray-200 rounded-lg">
                                <button
                                    className={` flex-1 py-1 px-4 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                        pickingTab === 'picking'
                                            ? 'bg-[#FFAC64] text-white'
                                            : 'bg-transparent hover:bg-gray-300'
                                    }`}
                                    onClick={() => setPickingTab('picking')}
                                >
                                    {language === 'zh' ? '选择' : 'Picking'}
                                </button>
                                <button
                                    className={`flex-1 py-1 px-4 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                        pickingTab === 'unpicking'
                                            ? 'bg-[#FFAC64] text-white'
                                            : 'bg-transparent hover:bg-gray-300'
                                    }`}
                                    onClick={() => setPickingTab('unpicking')}
                                >
                                    {language === 'zh' ? '撤选' : 'Unpicking'}
                                </button>
                            </div>
                            <div className="w-[30%]">
                                <button
                                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center h-[43px] p-1 bg-gray-200 rounded-lg">
                            <button
                                className={` flex-1 py-1 px-4 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                    activeTopologyTab === 'brush'
                                        ? 'bg-[#FFAC64] text-white'
                                        : 'bg-transparent hover:bg-gray-300'
                                }`}
                                onClick={() => setActiveTopologyTab('brush')}
                            >
                                <img
                                    src={brush}
                                    alt="brush"
                                    className="h-6 w-6"
                                />
                                {language === 'zh' ? '笔刷' : 'Brush'}
                            </button>
                            <button
                                className={`flex-1 py-1 px-4 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                    activeTopologyTab === 'box'
                                        ? 'bg-[#FFAC64] text-white'
                                        : 'bg-transparent hover:bg-gray-300'
                                }`}
                                onClick={() => setActiveTopologyTab('box')}
                            >
                                <img src={box} alt="box" className="h-6 w-6" />
                                {language === 'zh' ? '框选' : 'Box'}
                            </button>
                            <button
                                className={`flex-1 py-1 px-4 rounded-md transition-colors duration-200 flex flex-row gap-2 text-sm justify-center items-center cursor-pointer ${
                                    activeTopologyTab === 'feature'
                                        ? 'bg-[#FFAC64] text-white'
                                        : 'bg-transparent hover:bg-gray-300'
                                }`}
                                onClick={() => setActiveTopologyTab('feature')}
                            >
                                <img
                                    src={feature}
                                    alt="feature"
                                    className="h-6 w-6"
                                />
                                {language === 'zh' ? '要素' : 'Feature'}
                            </button>
                        </div>
                        <BrushCard />
                    </div>

                    {/* 属性编辑面板 */}
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
