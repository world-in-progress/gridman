import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';
import { EditorPanelProps } from './types/types';
import BasicInfo from './basicInfo';
import TopologyPanel from './Topology/topologyEditor';
import store from '@/store';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import TopologyLayer from '../mapComponent/layers/TopologyLayer';
import AttributePanel from './Attribute/AttributeEditor';
import GridCore from '@/core/grid/NHGridCore';
import { GridSaveInfo } from '@/core/grid/NHGrid';
import { toast } from 'sonner';

export default function EditorPanel({ onBack, ...props }: EditorPanelProps) {
    const { language } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState<'topology' | 'attribute'>(
        'topology'
    );
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
            console.log(saveInfo);
            toast.success(
                language === 'zh'
                    ? '拓扑编辑状态保存成功'
                    : 'Topology edit state saved successfully',
                {
                    style: {
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        bottom: '30px'
                    },
                }
            );
        })
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
                    <div className="flex items-center p-1 mb-2 -mt-2 bg-white rounded-md shadow-sm">
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

                    <div
                        className="bg-green-500 hover:bg-green-600 mt-2 p-3 flex items-center justify-center text-md text-white font-bold cursor-pointer rounded-md shadow-sm"
                        onClick={handleSaveTopologyState}
                    >
                        <span>
                            {language === 'zh'
                                ? '保存拓扑编辑状态'
                                : 'Save Topology Edit State'}
                        </span>
                    </div>

                    {/* 拓扑编辑 */}
                    {activeTab === 'topology' && (
                        <TopologyPanel
                            pickingTab={pickingTab}
                            setPickingTab={setPickingTab}
                            activeSelectTab={activeSelectTab}
                            setActiveSelectTab={setActiveSelectTab}
                        />
                    )}

                    {/* 属性编辑面板 */}
                    {activeTab === 'attribute' && <AttributePanel />}
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
