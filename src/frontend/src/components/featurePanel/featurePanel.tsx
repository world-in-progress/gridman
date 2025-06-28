import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { LanguageContext } from "../../context";
import { FeaturePanelProps, LayerItem, LayerNode } from "./types/types";
import { useContext, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import BasicInfo from "../aggregationPanel/components/basicInfo";
import LayerList from "./components/layerList";
import store from "@/store";
import { FeatureService } from "./utils/FeatureService";
import {
    SelectGroup,
    SelectContent,
    Select,
    SelectTrigger,
    SelectValue,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import {
    addLayerToMap,
    removeLayerFromMap,
    removeSourceFromMap,
} from "@/utils/featureUtils";

export default function FeaturePanel({
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
}: FeaturePanelProps) {
    const { language } = useContext(LanguageContext);
    const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("");
    const [newSymbology, setNewSymbology] = useState("");

    const handleBack = () => {
        const map = window.mapInstance;
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
            setLayers([]);
            setSelectedLayerId(null);
        }
        if (onBack) {
            onBack();
        }
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

    const handleDeleteLayer = (id: string) => {
        const featureService = new FeatureService(language);
        featureService.deleteFeature(id, (err, result) => {
            if (err) {
                toast.error("删除要素失败");
            } else {
                toast.success("删除要素成功");
                setLayers(layers.filter((layer) => layer.id !== id));
                setSelectedLayerId(null);
                removeLayerFromMap(id);
                removeSourceFromMap(id);
            }
        });
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

    const handleUpdateFeatureProperty = () => {
        console.log("点击了更新要素属性", newName, newIcon, newSymbology);
        const featureService = new FeatureService(language);
        const featureProperty = {
            name: newName,
            icon: newIcon,
            symbology: newSymbology,
        };
        featureService.updateFeatureProperty(
            selectedLayerId!,
            featureProperty,
            (err, result) => {
                if (err) {
                    toast.error("更新要素属性失败");
                } else {
                    toast.success("更新要素属性成功");
                    const oldLayer = layers.find((layer) => layer.id === selectedLayerId);
                    const newLayer = {
                        ...oldLayer,
                        name: newName,
                        icon: getIconComponent(newIcon),
                        symbology: newSymbology,
                    };
                    setLayers((prevLayers) => {
                        const updatedLayers = prevLayers.map((layer) => {
                            if (layer.id === selectedLayerId) {
                                return newLayer as LayerNode;
                            }
                            return layer;
                        });
                        return updatedLayers;
                    });
                    if (oldLayer) {
                        removeLayerFromMap(oldLayer.id);
                        addLayerToMap(newLayer as LayerItem);
                    }
                }
            }
        );

        setIsPropertiesDialogOpen(false);
        setNewName("");
        setNewIcon("");
        setNewSymbology("");
    };

    return (
        <>
            <Dialog
                open={isPropertiesDialogOpen}
                onOpenChange={setIsPropertiesDialogOpen}
            >
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {language === "zh" ? "修改要素属性" : "Modify Feature Property"}
                        </DialogTitle>
                        <DialogDescription>
                            {language === "zh"
                                ? "填写要素的名称、图标和符号样式以修改要素属性"
                                : "Fill in the feature name, icon, and symbology to modify the feature property."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-6">
                            <Label className="w-20 text-right flex-shrink-0">
                                {language === "zh" ? "名称 :" : "Name :"}
                            </Label>
                            <Input
                                className="flex-1"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <Label className="w-20 text-right flex-shrink-0">
                                {language === "zh" ? "图标 :" : "Icon :"}
                            </Label>
                            <Select value={newIcon} onValueChange={setNewIcon}>
                                <SelectTrigger className="flex-1 w-full cursor-pointer">
                                    <SelectValue
                                        placeholder={language === "zh" ? "选择图标" : "Select Icon"}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {iconOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                className="cursor-pointer hover:bg-gray-200"
                                                value={option.value}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <option.Icon className="h-4 w-4" />
                                                    {option.value}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-5">
                            <Label className="w-21 text-right flex-shrink-0">
                                {language === "zh" ? "符号 :" : "Symbology :"}
                            </Label>
                            <Select value={newSymbology} onValueChange={setNewSymbology}>
                                <SelectTrigger className="flex-1 w-full cursor-pointer">
                                    <SelectValue
                                        placeholder={
                                            language === "zh" ? "选择符号样式" : "Select Symbology"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {symbologyOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                className="cursor-pointer hover:bg-gray-200"
                                                value={option.value}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn("w-4 h-4 rounded-full", option.color)}
                                                    />
                                                    {option.value}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setIsPropertiesDialogOpen(false);
                                setNewName("");
                                setNewIcon("");
                                setNewSymbology("");
                            }}
                        >
                            {language === "zh" ? "取消" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleUpdateFeatureProperty}
                        >
                            {language === "zh" ? "更新" : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                            {language === "zh" ? "要素编辑" : "Feature Editor"}
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
        </>
    );
}
