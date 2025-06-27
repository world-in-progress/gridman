import { useContext, useState, useEffect } from "react";
import {
    Pencil,
    PencilOff,
    MousePointer2,
    RotateCcw,
    Scissors,
    Copy,
    Clipboard,
    Trash2,
    FilePlus2,
    Import,
    Upload,
    Paintbrush,
    Save,
    PaintbrushVertical,
} from "lucide-react";
import {
    LayerItem,
    FeatureToolbarProps,
    ToolItem,
} from "../types/types";
import { LanguageContext } from "@/context";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectGroup,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import wbda from "../../../assets/wbda.jpg";
import store from "@/store";
import { FeatureService } from "../utils/FeatureService";
import { FeatureProperty } from "@/core/feature/types";
import { addLayerToMap, addSourceToMap } from "@/utils/featureUtils";

export default function FeatureToolbar({
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    iconOptions,
    getIconComponent,
    getIconString,
    symbologyOptions,
    isEditMode,
    setIsEditMode,
}: FeatureToolbarProps) {
    const { language } = useContext(LanguageContext);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("");
    const [newSymbology, setNewSymbology] = useState("");
    const [importFeatureError, setImportFeatureError] = useState("");
    const [createNewFeatureError, setCreateNewFeatureError] = useState("");
    const [newIcon, setNewIcon] = useState("MapPin");
    const [dataSourceType, setDataSourceType] = useState("local");
    const [isDrawing, setIsDrawing] = useState(false);
    const [importFeatureDialog, setImportFeatureDialog] = useState(false);
    const [isEditSwitchAllowed, setIsEditSwitchAllowed] = useState(false);
    const [createNewFeatureDialog, setCreateNewFeatureDialog] = useState(false);

    store.set("isEditSwitchAllowed", {
        on: () => {
            setIsEditSwitchAllowed((prev) => !prev);
            if (isEditSwitchAllowed === true) {
                if (isEditMode) {
                    setIsEditMode((prev) => !prev);
                }
            }
        },
    });

    let localFeaturePath: string | null = "";

    const generateFeatureId = (name: string): string => {
        const timestamp = Date.now();
        return `${name}_${timestamp}_feature`;
    };

    const openCreateNewFeatureDialog = () => {
        setCreateNewFeatureDialog(true);
    };

    const handleCreateNewFeature = () => {
        console.log(
            language === "zh" ? "点击了创建新要素" : "Create New Feature clicked"
        );
        if (
            !newName.trim() ||
            !newType.trim() ||
            !newIcon.trim() ||
            !newSymbology.trim()
        ) {
            setCreateNewFeatureError(
                language === "zh" ? "所有字段不能为空" : "All fields are required"
            );
            return;
        }

        const newId = generateFeatureId(newName);

        const newLayerItem: LayerItem = {
            id: newId,
            name: newName,
            type: newType,
            visible: true,
            group: "Editing",
            icon: getIconComponent(newIcon),
            symbology: newSymbology,
            isEditing: false,
        };

        setLayers((prevLayers) => {
            const updatedLayers = [...prevLayers, newLayerItem];
            return updatedLayers;
        });

        setSelectedLayerId(newLayerItem.id);
        setIsEditSwitchAllowed(true);
        setCreateNewFeatureDialog(false);
        setNewName("");
        setNewType("");
        setNewIcon("MapPin");
        setNewSymbology("");
        setCreateNewFeatureError("");
    };

    const openImportFeatureDialog = () => {
        setImportFeatureDialog(true);
    };

    const handleLocalFeatureSelect = async () => {
        if (
            window.electronAPI &&
            typeof window.electronAPI.openFileDialog === "function"
        ) {
            try {
                localFeaturePath = await window.electronAPI.openFileDialog();
                if (localFeaturePath) {
                    console.log("Selected local feature path: ", localFeaturePath);
                    console.log("对应的本地要素处理逻辑触发");
                } else {
                    console.log("No local feature selected");
                }
            } catch (error) {
                console.log("Error opening file dialog:", error);
            }
        } else {
            console.error("Electron API not available");
        }
    };

    const handleImportFeature = () => {
        console.log(
            language === "zh" ? "点击了导入要素" : "Import Feature clicked"
        );
        setImportFeatureDialog(false);
    };

    const handleStartEditing = () => {
        console.log(
            language === "zh"
                ? isEditMode
                    ? "点击了停止编辑工具"
                    : "点击了开始编辑工具"
                : isEditMode
                    ? "Stop Editing tool clicked"
                    : "Start Editing tool clicked"
        );
        setIsEditMode((prev) => !prev);

        // if selectedLayer is Edited, then change the layer to draw mode
        const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
        if (selectedLayer && (selectedLayer as LayerItem).group === "Edited") {
            const draw = window.mapboxDrawInstance;
            const map = window.mapInstance;
            if (!draw || !map) return;
            draw.deleteAll();

            const featureService = new FeatureService(language);
            featureService.getFeatureJson(
                (selectedLayer as LayerItem).id,
                (error, result) => {
                    if (error) {
                        console.error("获取要素失败:", error);
                    } else {
                        const geojsonData = result.feature_json;
                        if (geojsonData && geojsonData.features?.length) {
                            geojsonData.features.forEach((feature: GeoJSON.Feature) => {
                                draw.add(feature);
                            });
                        }
                        // update the layer group to "Editing"
                        setLayers((prevLayers) => {
                            const updatedLayers = prevLayers.map((layer) => {
                                if (layer.id === selectedLayerId) {
                                    return { ...layer, group: "Editing" };
                                }
                                return layer;
                            });
                            return updatedLayers;
                        });
                    }
                }
            );

            if (map.getLayer(selectedLayer.id)) {
                map.removeLayer(selectedLayer.id);
            }
            if (map.getSource(selectedLayer.id)) {
                map.removeSource(selectedLayer.id);
            }

            map.getCanvas().style.cursor = "default";
        }
    };

    const handleSaveFeature = () => {
        console.log(language === "zh" ? "点击了保存要素" : "Save Feature clicked");

        const draw = window.mapboxDrawInstance;
        const map = window.mapInstance;
        if (!draw || !map) return;

        const data = draw.getAll(); // return a FeatureCollection

        data.features.forEach((feature) => {
            if (feature.geometry?.type === "Polygon") {
                if (feature.geometry.coordinates[0].length < 3) {
                    data.features.splice(data.features.indexOf(feature), 1);
                }
            } else if (feature.geometry?.type === "LineString") {
                if (feature.geometry.coordinates.length < 2) {
                    data.features.splice(data.features.indexOf(feature), 1);
                }
            } else if (feature.geometry?.type === "Point") {
                if (
                    !feature.geometry.coordinates ||
                    feature.geometry.coordinates.length !== 2
                ) {
                    data.features.splice(data.features.indexOf(feature), 1);
                }
            }
        });

        console.log("绘制的要素：", data);

        if (data.features.length === 0) {
            alert("没有绘制任何要素！");
            return;
        }

        const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
        if (!selectedLayer) {
            alert("没有选择要素！");
            return;
        }

        setIsDrawing(false);

        // call backend to save feature
        const featureService = new FeatureService(language);

        const featureProperty: FeatureProperty = {
            id: selectedLayer.id,
            name: selectedLayer.name,
            type: selectedLayer.type,
            icon: getIconString(selectedLayer.icon),
            symbology: (selectedLayer as LayerItem).symbology,
        };

        console.log("featureProperty", featureProperty);

        featureService.saveFeature(featureProperty, data, (error, result) => {
            if (error) {
                console.error("保存要素失败:", error);
            } else {
                console.log("要素保存成功:", result);
                // update the layer group to "Edited"
                setLayers((prevLayers) => {
                    const updatedLayers = prevLayers.map((layer) => {
                        if (layer.id === selectedLayerId) {
                            return { ...layer, group: "Edited" };
                        }
                        return layer;
                    });
                    return updatedLayers;
                });

                // add layer to map with the resource_path
                addSourceToMap(selectedLayer.id, data);
                addLayerToMap(selectedLayer as LayerItem);
            }
        });

        // after saving, clear the drawing and exit the drawing mode
        draw.deleteAll();
        draw.changeMode("simple_select");
        map.getCanvas().style.cursor = "default";
        setIsDrawing(false);
        setIsEditMode(false);
        setIsEditSwitchAllowed(false);
        setSelectedLayerId(null);
    };

    useEffect(() => {
        const map = window.mapInstance;
        const draw = window.mapboxDrawInstance;
        if (!map || !draw) return;

        const handleCreate = () => {
            requestAnimationFrame(() => {
                draw.changeMode("draw_polygon");
                map.getCanvas().style.cursor = "crosshair";
            });
        };

        map.on("draw.create", handleCreate);

        return () => {
            map.off("draw.create", handleCreate);
        };
    }, []);

    const handleDraw = () => {
        const draw = window.mapboxDrawInstance;
        if (!draw) return;

        if (isDrawing) {
            // Stop to draw
            draw.changeMode("simple_select");
            if (window.mapInstance?.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = "";
            }
        } else {
            // Start to draw
            const selectedLayer = layers.find(
                (layer) => layer.id === selectedLayerId
            );
            if (!selectedLayer) return;
            if (selectedLayer.type === "polygon") {
                draw.changeMode("draw_polygon");
            } else if (selectedLayer.type === "line") {
                draw.changeMode("draw_line_string");
            } else if (selectedLayer.type === "point") {
                draw.changeMode("draw_point");
            }
            if (window.mapInstance?.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = "crosshair";
            }
        }
        setIsDrawing(!isDrawing);
    };

    const handleSelect = () =>
        console.log(language === "zh" ? "点击了选择工具" : "Select tool clicked");
    const handleRotate = () =>
        console.log(language === "zh" ? "点击了旋转工具" : "Rotate tool clicked");
    const handleCut = () =>
        console.log(language === "zh" ? "点击了剪切工具" : "Cut tool clicked");
    const handleCopy = () =>
        console.log(language === "zh" ? "点击了复制工具" : "Copy tool clicked");
    const handlePaste = () =>
        console.log(language === "zh" ? "点击了粘贴工具" : "Paste tool clicked");
    const handleDelete = () =>
        console.log(language === "zh" ? "点击了删除要素" : "Delete tool clicked");

    const fileTools: ToolItem[] = [
        {
            onClick: openCreateNewFeatureDialog,
            title: language === "zh" ? "创建新要素" : "Create New Feature",
            Icon: FilePlus2,
        },
        {
            onClick: openImportFeatureDialog,
            title: language === "zh" ? "导入要素" : "Import Feature",
            Icon: Import,
        },
    ];

    const editSwitch: ToolItem[] = [
        {
            onClick: handleStartEditing,
            title:
                language === "zh"
                    ? isEditMode
                        ? "停止编辑"
                        : "开始编辑"
                    : isEditMode
                        ? "Stop Editing"
                        : "Start Editing",
            Icon: isEditMode ? PencilOff : Pencil,
        },
        {
            onClick: handleSaveFeature,
            title: language === "zh" ? "保存" : "Save",
            Icon: Save,
        },
    ];

    const editTools: ToolItem[] = [
        {
            onClick: handleDraw,
            title:
                language === "zh"
                    ? isDrawing
                        ? "停止绘制"
                        : "开始绘制"
                    : isDrawing
                        ? "Stop Drawing"
                        : "Start Drawing",
            Icon: isDrawing ? PaintbrushVertical : Paintbrush,
            className: isDrawing ? "text-red-500" : "",
        },

        {
            onClick: handleSelect,
            title: language === "zh" ? "选择要素" : "Select Feature",
            Icon: MousePointer2,
        },
        {
            onClick: handleRotate,
            title: language === "zh" ? "旋转要素" : "Rotate Feature",
            Icon: RotateCcw,
        },
        {
            onClick: handleCut,
            title: language === "zh" ? "剪切要素" : "Cut Feature",
            Icon: Scissors,
        },
        {
            onClick: handleCopy,
            title: language === "zh" ? "复制要素" : "Copy Feature",
            Icon: Copy,
        },
        {
            onClick: handlePaste,
            title: language === "zh" ? "粘贴要素" : "Paste Feature",
            Icon: Clipboard,
        },
        {
            onClick: handleDelete,
            title: language === "zh" ? "删除要素" : "Delete Feature",
            Icon: Trash2,
        },
    ];

    return (
        <>
            <Dialog
                open={createNewFeatureDialog}
                onOpenChange={setCreateNewFeatureDialog}
            >
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {language === "zh" ? "创建新要素" : "Create New Feature"}
                        </DialogTitle>
                        <DialogDescription>
                            {language === "zh"
                                ? "填写要素的名称、类型、图标和符号样式以创建新要素"
                                : "Fill in the feature name, type, icon, and symbology to create a new feature."}
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
                                {language === "zh" ? "类型 :" : "Type :"}
                            </Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="flex-1 w-full cursor-pointer">
                                    <SelectValue
                                        placeholder={
                                            language === "zh" ? "选择要素类型" : "Select Feature Type"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-gray-200"
                                            value="point"
                                        >
                                            {language === "zh" ? "点" : "Point"}
                                        </SelectItem>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-gray-200"
                                            value="line"
                                        >
                                            {language === "zh" ? "线" : "Line"}
                                        </SelectItem>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-gray-200"
                                            value="polygon"
                                        >
                                            {language === "zh" ? "面" : "Polygon"}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
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
                        {createNewFeatureError && (
                            <div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                                {createNewFeatureError}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setCreateNewFeatureDialog(false);
                                setCreateNewFeatureError("");
                            }}
                        >
                            {language === "zh" ? "取消" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleCreateNewFeature}
                        >
                            {language === "zh" ? "创建" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={importFeatureDialog} onOpenChange={setImportFeatureDialog}>
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {language === "zh" ? "导入要素" : "Import Feature"}
                        </DialogTitle>
                        <DialogDescription>
                            {language === "zh"
                                ? "请选择数据来源并上传要素数据"
                                : "Please select data source and upload feature data."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="w-full flex flex-col gap-2">
                        <div className="border-2 rounded-md p-3 space-y-2">
                            <Label className="flex items-center text-lg font-bold -mt-2">
                                {language === "zh" ? "数据来源" : "Data Source"}
                            </Label>
                            <RadioGroup
                                value={dataSourceType}
                                onValueChange={setDataSourceType}
                                className="flex flex-row"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="local"
                                        id="local"
                                        className="cursor-pointer"
                                    />
                                    <Label>{language === "zh" ? "本地数据" : "Local Data"}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="registered"
                                        id="registered"
                                        className="cursor-pointer"
                                    />
                                    <Label>
                                        {language === "zh" ? "已注册数据" : "Registered Data"}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="border-2 rounded-md p-3 space-y-2">
                            <Label className="flex items-center text-lg -mt-2 font-bold">
                                {language === "zh" ? "数据上传" : "Data Upload"}
                            </Label>
                            {dataSourceType === "local" ? (
                                <div
                                    className={cn(
                                        "relative flex items-center justify-center w-full h-[200px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer duration-200"
                                    )}
                                    onClick={handleLocalFeatureSelect}
                                >
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <Upload className="h-8 w-8 text-gray-500" />
                                        <span className="text-xs text-gray-600 font-medium">
                                            {language === "zh"
                                                ? "拖放或点击上传 .tif 文件"
                                                : "Drag and drop or click to upload .tif file"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <img src={wbda} alt="wbda" />
                                    <div className="text-3xl font-bold">
                                        我不道咋写啊，后端也妹建立啊
                                    </div>
                                </div>
                            )}
                        </div>
                        {importFeatureError && (
                            <div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                                {importFeatureError}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setImportFeatureDialog(false);
                                setImportFeatureError("");
                            }}
                        >
                            {language === "zh" ? "取消" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleImportFeature}
                        >
                            {language === "zh" ? "导入" : "Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex h-12 shrink-0 items-center border-b border-t-2 border-b-gray-200 px-4 bg-gray-50">
                <div className="flex items-center gap-2">
                    {fileTools.map((tool, index) => (
                        <button
                            key={index}
                            onClick={tool.onClick}
                            className="p-2 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            title={tool.title}
                        >
                            <tool.Icon className="w-6 h-6 text-gray-600" />
                        </button>
                    ))}
                </div>
                <Separator className="h-full ml-2 mr-2" orientation="vertical" />
                <div className="flex items-center gap-2">
                    {editSwitch.map((tool, index) => (
                        <button
                            key={index}
                            onClick={isEditSwitchAllowed ? tool.onClick : undefined}
                            className={cn(
                                "p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
                                isEditSwitchAllowed
                                    ? "hover:bg-gray-200 cursor-pointer"
                                    : "cursor-not-allowed"
                            )}
                            title={tool.title}
                            disabled={!isEditSwitchAllowed}
                        >
                            <tool.Icon
                                className={cn(
                                    "w-6 h-6",
                                    isEditSwitchAllowed ? "text-gray-600" : "text-gray-400"
                                )}
                            />
                        </button>
                    ))}
                </div>
                <Separator className="h-full ml-2 mr-2" orientation="vertical" />
                <div className="flex items-center gap-2">
                    {editTools.map((tool, index) => (
                        <button
                            key={index}
                            onClick={isEditMode ? tool.onClick : undefined}
                            className={cn(
                                "p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
                                isEditMode
                                    ? "hover:bg-gray-200 cursor-pointer"
                                    : "cursor-not-allowed"
                            )}
                            title={tool.title}
                            disabled={!isEditMode}
                        >
                            <tool.Icon
                                className={cn(
                                    "w-6 h-6",
                                    isEditMode ? "text-gray-600" : "text-gray-400",
                                    tool.className // 添加自定义类名
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};
