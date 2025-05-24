import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';
import { AttributePanelProps } from './types/types';
import AttributeEditor from './components/attributeEditor';
import store from '@/store';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
// import TopologyLayer from '../mapComponent/layers/TopologyLayer'; //改为AttributeLayer
import GridCore from '@/core/grid/NHGridCore';
import { GridSaveInfo } from '@/core/grid/types';
import { toast } from 'sonner';
import BasicInfo from './components/basicInfo';

export default function AttributePanel({
    onBack,
    ...props
}: AttributePanelProps) {
    const { language } = useContext(LanguageContext);

    const handleBack = () => {
        //改为AttributeLayer
        const clg = store.get<NHLayerGroup>('clg')!;
        // const layer = clg.getLayerInstance('TopologyLayer')! as TopologyLayer;
        // layer.removeResource();

        if (onBack) {
            onBack();
        }
    };

    const handleSaveTopologyState = () => {
        const core: GridCore = store.get('gridCore')!;
        core.save((saveInfo: GridSaveInfo) => {
            toast.success(
                language === 'zh'
                    ? '拓扑编辑状态保存成功'
                    : 'Topology edit state saved successfully',
                {
                    style: {
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        bottom: '30px',
                    },
                }
            );
        });
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
                        {language === 'zh' ? '拓扑编辑' : 'Topology Editor'}
                    </h1>
                </div>

                <div className="p-2">
                    <div className="-mt-3">
                        <BasicInfo />
                    </div>

                    <div
                        className="bg-green-500 hover:bg-green-600 mt-2 p-3 flex items-center justify-center text-md text-white font-bold cursor-pointer rounded-md shadow-md"
                        onClick={handleSaveTopologyState}
                    >
                        <span>
                            {language === 'zh'
                                ? '保存拓扑编辑状态'
                                : 'Save Topology Edit State'}
                        </span>
                    </div>

                    {/* 栅格资源编辑 */}
                    <AttributeEditor />
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
