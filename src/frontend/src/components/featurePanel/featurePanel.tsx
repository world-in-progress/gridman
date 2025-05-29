import { toast } from 'sonner';
import { ArrowLeft, Mountain, MountainSnow, Upload } from 'lucide-react';
import { LanguageContext } from '../../context';
import { FeaturePanelProps } from './types/types';
import { useContext, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import BasicInfo from '../aggregationPanel/components/basicInfo';
import LayerList from './components/layerList';

export default function FeaturePanel({
    onBack,
    layers,
    setLayers,
    ...props
}: FeaturePanelProps) {

    const { language } = useContext(LanguageContext);

    const handleBack = () => {
        if (window.mapInstance) {
            const sourceId = `patch-bounds-edit`;
            const outlineLayerId = `patch-outline-edit`;

            if (window.mapInstance.getLayer(outlineLayerId)) {
                window.mapInstance.removeLayer(outlineLayerId);
            }
            if (window.mapInstance.getSource(sourceId)) {
                window.mapInstance.removeSource(sourceId);
            }
        }
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
                        className="p-2 rounded-full hover:bg-gray-300 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh' ? '要素编辑' : 'Feature Editor'}
                    </h1>
                </div>

                <div className="p-2 -mt-3 space-y-2">
                    <BasicInfo />
                    <LayerList layers={layers} setLayers={setLayers} />
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
