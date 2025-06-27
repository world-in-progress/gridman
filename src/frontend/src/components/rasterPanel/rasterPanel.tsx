import { ArrowLeft } from 'lucide-react';
import { useContext, useState } from 'react';
import { LanguageContext } from '../../context';
import { RasterPanelProps, LayerItem } from './types/types';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import store from '@/store';
import BasicInfo from '../aggregationPanel/components/basicInfo';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import LayerList from './components/layerList';
import { RasterService } from './utils/RasterService';
import { toast } from 'sonner';

export default function RasterPanel({
    onBack,
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    isEditMode,
    setIsEditMode,
    iconOptions,
    symbologyOptions,
    getIconComponent,
    getIconString,
    ...props
}: RasterPanelProps) {
    const { language } = useContext(LanguageContext)
    const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newIcon, setNewIcon] = useState("")
    const [newSymbology, setNewSymbology] = useState("")

    const handleBack = () => {
        const map = window.mapInstance;
        const clg = store.get<NHLayerGroup>('clg')!;
        if (map) {
            const sourceId = `patch-bounds-edit`;
            const outlineLayerId = `patch-outline-edit`;

            if (map.getLayer(outlineLayerId)) {
                map.removeLayer(outlineLayerId);
            }
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
            const layers = map.getStyle()?.layers ?? [];
            layers.forEach((layer) => {
                if (layer.id.endsWith("feature")) {
                    if (map.getLayer(layer.id)) {
                        map.removeLayer(layer.id);
                    }
                }
            });
            Object.keys(map.getStyle()?.sources ?? {}).forEach((sourceId) => {
                if (sourceId.endsWith("feature")) {
                    if (map.getSource(sourceId)) {
                        map.removeSource(sourceId);
                    }
                }
            });
            const draw = window.mapboxDrawInstance;
            if (draw) {
                draw.deleteAll();
            }
        }
        if (onBack) {
            onBack();
        }
    };

    const handlePropertiesChange = (id: string) => {
        console.log("点击了属性", id);
        const layer = layers.find((layer) => layer.id === id);
        if (layer) {
            setNewName(layer.name);
            setNewIcon(getIconString(layer.icon));
            setNewSymbology((layer as LayerItem).symbology);
            setSelectedLayerId(id);
        }
        setIsPropertiesDialogOpen(true);
    };

    const handleDeleteLayer = (id: string) => {
        const rasterService = new RasterService(language);
        // rasterService.deleteFeature(id, (err, result) => {
        //     if (err) {
        //         toast.error("删除要素失败");
        //     } else {
        //         toast.success("删除要素成功");
        //         setLayers(layers.filter((layer) => layer.id !== id));
        //         setSelectedLayerId(null);
        //         removeLayerFromMap(id);
        //         removeSourceFromMap(id);
        //     }
        // });
    };

    const handleSelectLayer = (id: string | null) => {
        if (!isEditMode) {
            if (selectedLayerId === null || id === null) {
                setSelectedLayerId(id);
                store.get<{ on: Function }>("isEditSwitchAllowed")!.on();
            } else {
                setSelectedLayerId(id);
            }
            console.log("点击了图层", id);
        } else {
            toast.warning("有图层正在编辑，请先保存或取消编辑");
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
                        {language === 'zh' ? '栅格编辑' : 'Raster Editor'}
                    </h1>
                </div>

                <div className="p-2 -mt-3 space-y-2">
                    <BasicInfo />
                    <LayerList
                        layers={layers}
                        setLayers={setLayers}
                        selectedLayerId={selectedLayerId}
                        onSelectLayer={handleSelectLayer}
                        onDeleteLayer={handleDeleteLayer}
                        getIconComponent={getIconComponent}
                        onPropertiesChange={handlePropertiesChange}
                    />
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
