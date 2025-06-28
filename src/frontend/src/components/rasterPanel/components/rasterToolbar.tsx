import { LanguageContext } from "@/context"
import { useContext, useState } from 'react'
import { Building, ImagePlus, Import, LandPlot, LucideIcon, Map, MapPin, Mountain, Pencil, Route, Save, Trees, Upload, Warehouse, Waves } from 'lucide-react'
import { RasterToolBarProps, ToolItem } from '../types/types'
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RasterToolBar({ }: RasterToolBarProps) {

    let localMaskPath: string | null = "";

    const { language } = useContext(LanguageContext);
    const [newType, setNewType] = useState("");
    const [newIcon, setNewIcon] = useState("MapPin");
    const [newSymbology, setNewSymbology] = useState("");
    const [importMaskError, setImportMaskError] = useState("");
    const [createNewRasterError, setCreateNewRasterError] = useState("");
    const [dataSourceType, setDataSourceType] = useState("local");
    const [importMaskDialog, setImportMaskDialog] = useState(false);
    const [createNewRasterDialog, setCreateNewRasterDialog] = useState(false);

    const openCreateNewRasterDialog = () => {
        setCreateNewRasterDialog(true);
    };

    const openImportMaskDialog = () => {
        setImportMaskDialog(true);
    };

    const handleStartEditing = () => {
        console.log(
            language === "zh" ? "点击了开始编辑工具" : "Start Editing tool clicked"
        );
    }

    const handleSaveRaster = () => {
        console.log(
            language === "zh" ? "点击了保存栅格" : "Save Raster clicked"
        );
    };

    const handleCreateNewRaster = () => {
        console.log(
            language === "zh" ? "点击了添加新栅格" : "Add New Raster clicked"
        );
    };

    const handleImportRaster = () => {
        console.log(
            language === "zh" ? "点击了导入掩膜" : "Import Mask clicked"
        );
        setImportMaskDialog(false);
    };


    const handleLocalMaskSelect = async () => {
        if (
            window.electronAPI &&
            typeof window.electronAPI.openFileDialog === "function"
        ) {
            try {
                localMaskPath = await window.electronAPI.openFileDialog();
                if (localMaskPath) {
                    console.log("Selected local mask path: ", localMaskPath);
                    console.log("对应的本地掩膜处理逻辑触发");
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

    const fileTools: ToolItem[] = [
        {
            onClick: openCreateNewRasterDialog,
            title: language === "zh" ? "创建新栅格" : "Add New Raster",
            Icon: ImagePlus,
        },
        {
            onClick: openImportMaskDialog,
            title: language === "zh" ? "导入掩膜" : "Import Mask",
            Icon: Import,
        },
    ];

    const editSwitch: ToolItem[] = [
        {
            onClick: handleStartEditing,
            title:
                language === "zh" ? "开始编辑" : "Start Editing",
            Icon: Pencil,
        },
        {
            onClick: handleSaveRaster,
            title: language === "zh" ? "保存" : "Save",
            Icon: Save,
        },
    ];

    const iconOptions: { value: string; Icon: LucideIcon }[] = [
        { value: "MapPin", Icon: MapPin },
        { value: "Waves", Icon: Waves },
        { value: "Building", Icon: Building },
        { value: "Route", Icon: Route },
        { value: "Map", Icon: Map },
        { value: "Mountain", Icon: Mountain },
        { value: "Trees", Icon: Trees },
        { value: "LandPlot", Icon: LandPlot },
        { value: "Warehouse", Icon: Warehouse },
    ];

    const symbologyOptions: { value: string; color: string }[] = [
        { value: "red-fill", color: "bg-red-500" },
        { value: "blue-fill", color: "bg-blue-500" },
        { value: "green-fill", color: "bg-green-500" },
        { value: "gray-fill", color: "bg-gray-500" },
        { value: "yellow-fill", color: "bg-yellow-500" },
        { value: "purple-fill", color: "bg-purple-500" },
        { value: "orange-fill", color: "bg-orange-500" },
    ];

    return (
        <>
            <Dialog
                open={createNewRasterDialog}
                onOpenChange={setCreateNewRasterDialog}
            >
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {language === "zh" ? "添加新栅格" : "Add New Raster"}
                        </DialogTitle>
                        <DialogDescription>
                            {language === "zh"
                                ? "请选择栅格数据来源并上传栅格数据"
                                : "Please select data source and upload raster data."}
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
                                    onClick={handleLocalMaskSelect}
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
                                    {/* <img src={wbda} alt="wbda" /> */}
                                    <div className="text-3xl font-bold">
                                        我不道咋写啊，后端也妹建立啊
                                    </div>
                                </div>
                            )}
                        </div>
                        {importMaskError && (
                            <div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                                {importMaskError}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setImportMaskDialog(false);
                                setImportMaskError("");
                            }}
                        >
                            {language === "zh" ? "取消" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleImportRaster}
                        >
                            {language === "zh" ? "导入" : "Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={importMaskDialog} onOpenChange={setImportMaskDialog}>
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
                                    onClick={handleLocalMaskSelect}
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
                                    {/* <img src={wbda} alt="wbda" /> */}
                                    <div className="text-3xl font-bold">
                                        我不道咋写啊，后端也妹建立啊
                                    </div>
                                </div>
                            )}
                        </div>
                        {importMaskError && (
                            <div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                                {importMaskError}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setImportMaskDialog(false);
                                setImportMaskError("");
                            }}
                        >
                            {language === "zh" ? "取消" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleImportRaster}
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
                            onClick={tool.onClick}
                            className={cn(
                                "p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
                                "hover:bg-gray-200 cursor-pointer"
                            )}
                            title={tool.title}
                        >
                            <tool.Icon
                                className={cn(
                                    "w-6 h-6",
                                    "text-gray-600"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}
