import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';
import { EditorPanelProps } from './types/types';
import BasicInfo from './components/basicInfo';
import TopologyPanel from './components/topologyEditor';
import store from '@/store';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import TopologyLayer from '../mapComponent/layers/TopologyLayer';

export default function EditorPanel({ onBack, ...props }: EditorPanelProps) {
    const { language } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState<'topology' | 'attribute'>(
        'topology'
    );
    const [pickingTab, setPickingTab] = useState<
        'picking' | 'unpicking' | 'delete'
    >('picking');
    const [activeSelectTab, setActiveSelectTab] = useState<
        'brush' | 'box' | 'feature'
    >('brush');

    // let modeSelect = 1;
    // let pickingSelect = true;

    useEffect(() => {
        store.set('modeSelect', 1);
        store.set('pickingSelect', true);
        console.log(store.get<number>('modeSelect'), store.get<boolean>('pickingSelect'))
    }, []);

    const handleBack = () => {
        const clg = store.get<NHLayerGroup>('clg')!;
        const layer = clg.getLayerInstance('TopologyLayer')! as TopologyLayer;
        layer.removeResource();

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
                    <div className="flex items-center p-1 mb-2 -mt-2 bg-white rounded-md">
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

                    {/* 拓扑编辑 */}
                    <TopologyPanel
                        pickingTab={pickingTab}
                        setPickingTab={setPickingTab}
                        activeSelectTab={activeSelectTab}
                        setActiveSelectTab={setActiveSelectTab}
                    />

                    {/* 属性编辑面板 */}
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
