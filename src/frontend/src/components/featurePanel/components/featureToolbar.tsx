import React, { useContext, useState } from 'react';
import { Pencil, MousePointer2, Move, RotateCcw, Scissors, Copy, Clipboard, Trash2, FilePlus2, Import, MapPin, Waves, Building, Route, LucideIcon, Upload } from 'lucide-react';
import { LayerItem, FeatureToolbarProps, ToolItem } from '../types/types';
import { LanguageContext } from '@/context';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectGroup,
    SelectLabel,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import wbda from '../../../assets/wbda.jpg'

const FeatureToolbar: React.FC<FeatureToolbarProps> = ({ setLayers }) => {

    const { language } = useContext(LanguageContext);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('');
    const [createNewFeatureError, setCreateNewFeatureError] = useState('');
    const [importFeatureError, setImportFeatureError] = useState('')
    const [createNewFeatureDialog, setCreateNewFeatureDialog] = useState(false);
    const [importFeatureDialog, setImportFeatureDialog] = useState(false)
    const [dataSourceType, setDataSourceType] = useState('local');

    let icon = <MapPin className="h-4 w-4" />;
    let symbology = 'green-fill';
    let localFeaturePath: string | null = ''

    const openCreateNewFeatureDialog = () => {
        setCreateNewFeatureDialog(true)
    }

    const handleCreateNewFeature = () => {
        console.log(language === 'zh' ? '点击了创建新要素' : 'Create New Feature clicked')
        if (!newName.trim() || !newType.trim()) {
            setCreateNewFeatureError('名称和类型不能为空');
            return;
        }
        if (newType === 'river') {
            icon = <Waves className="h-4 w-4" />;
            symbology = 'blue-fill';
        } else if (newType === 'building') {
            icon = <Building className="h-4 w-4" />;
            symbology = 'gray-fill';
        } else if (newType === 'road') {
            icon = <Route className="h-4 w-4" />;
            symbology = 'brown-lines';
        }

        const newLayer: LayerItem = {
            id: newName.toLowerCase().replace(/\s+/g, '-'),
            name: newName,
            type: 'feature',
            visible: true,
            icon,
            symbology,
        };
        setLayers(prevLayers =>
            prevLayers.map(layer =>
                layer.id === 'Unedited'
                    ? {
                        ...layer,
                        children: [...(layer.children || []), newLayer],
                    }
                    : layer
            )
        );
        setCreateNewFeatureDialog(false);
        setNewName('');
        setNewType('');
        setCreateNewFeatureError('');
    }

    const openImportFeatureDialog = () => {
        setImportFeatureDialog(true)
    }

    const handleLocalFeatureSelect = async () => {
        if (window.electronAPI && typeof window.electronAPI.openFileDialog === 'function') {
            try {
                localFeaturePath = await window.electronAPI.openFileDialog()
                if (localFeaturePath) {
                    console.log('Select local feature path: ', localFeaturePath)
                    console.log('对应的本地要素处理逻辑触发')
                } else {
                    console.log('No local feature selected')
                }
            } catch (error) {
                console.log('Error opening file dialog:', error)
            }
        } else {
            console.error('Electron API not available')
        }
    }

    const handleImportFeature = () => {
        console.log(language === 'zh' ? '点击了导入要素' : 'Import Feature clicked')
        setImportFeatureDialog(false)
    }

    const handleDraw = () => console.log(language === 'zh' ? '点击了绘制工具' : 'Draw tool clicked');
    const handleSelect = () => console.log(language === 'zh' ? '点击了选择工具' : 'Select tool clicked');
    const handleRotate = () => console.log(language === 'zh' ? '点击了旋转工具' : 'Rotate tool clicked');
    const handleCut = () => console.log(language === 'zh' ? '点击了剪切工具' : 'Cut tool clicked');
    const handleCopy = () => console.log(language === 'zh' ? '点击了复制工具' : 'Copy tool clicked');
    const handlePaste = () => console.log(language === 'zh' ? '点击了粘贴工具' : 'Paste tool clicked');
    const handleDelete = () => console.log(language === 'zh' ? '点击了删除工具' : 'Delete tool clicked');

    const fileTools: ToolItem[] = [
        { onClick: openCreateNewFeatureDialog, title: language === 'zh' ? '创建新要素' : 'Create New Feature', Icon: FilePlus2 },
        { onClick: openImportFeatureDialog, title: language === 'zh' ? '导入要素' : 'Import Feature', Icon: Import }
    ]

    const editTools: ToolItem[] = [
        { onClick: handleDraw, title: language === 'zh' ? '绘制要素' : 'Draw Feature', Icon: Pencil },
        { onClick: handleSelect, title: language === 'zh' ? '选择要素' : 'Select Feature', Icon: MousePointer2 },
        { onClick: handleRotate, title: language === 'zh' ? '旋转要素' : 'Rotate Feature', Icon: RotateCcw },
        { onClick: handleCut, title: language === 'zh' ? '剪切要素' : 'Cut Feature', Icon: Scissors },
        { onClick: handleCopy, title: language === 'zh' ? '复制要素' : 'Copy Feature', Icon: Copy },
        { onClick: handlePaste, title: language === 'zh' ? '粘贴要素' : 'Paste Feature', Icon: Clipboard },
        { onClick: handleDelete, title: language === 'zh' ? '删除要素' : 'Delete Feature', Icon: Trash2 },
    ];

    return (
        <>
            <Dialog open={createNewFeatureDialog} onOpenChange={setCreateNewFeatureDialog}>
                {/* Create New Feature button dialog */}
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={e => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Create New Feature</DialogTitle>
                        <DialogDescription>
                            {language === 'zh'
                                ? '填写要素名称和类型以创建新要素'
                                : 'Fill in the feature name and type to create a new feature.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-16 text-right flex-shrink-0">
                                Name :
                            </Label>
                            <Input
                                className="flex-1"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16 text-right flex-shrink-0">
                                Type :
                            </Label>
                            <Select
                                value={newType}
                                onValueChange={setNewType}
                            >
                                <SelectTrigger className="flex-1 w-full cursor-pointer">
                                    <SelectValue placeholder="Select Feature Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem className='cursor-pointer hover:bg-gray-200' value="river">River</SelectItem>
                                        <SelectItem className='cursor-pointer hover:bg-gray-200' value="building">Building</SelectItem>
                                        <SelectItem className='cursor-pointer hover:bg-gray-200' value="road">Road</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        {createNewFeatureError && (<div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                            {createNewFeatureError}
                        </div>)}
                    </div>

                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setCreateNewFeatureDialog(false);
                                setCreateNewFeatureError('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleCreateNewFeature}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={importFeatureDialog} onOpenChange={setImportFeatureDialog}>
                {/* Create New Feature button dialog */}
                <DialogContent
                    className="sm:max-w-[30%]"
                    onInteractOutside={e => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className='text-2xl'>Import Feature</DialogTitle>
                        <DialogDescription>
                            {language === 'zh'
                                ? '请选择数据来源并上传要素数据'
                                : 'Please select data source and upload feature data.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* 本地数据上传 */}
                    <div className="w-full flex flex-col  gap-2">
                        <div className='border-2 rounded-md p-3 space-y-2'>
                            <Label
                                className="flex items-center text-lg font-bold -mt-2"
                            >
                                {language === 'zh'
                                    ? '数据来源'
                                    : 'Data Source'}
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
                                        className='cursor-pointer'
                                    />
                                    <Label>
                                        {language === 'zh'
                                            ? '本地数据'
                                            : 'Local Data'}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="registered"
                                        id="registered"
                                        className='cursor-pointer'
                                    />
                                    <Label>
                                        {language === 'zh'
                                            ? '已注册数据'
                                            : 'Registered Data'}
                                    </Label>
                                </div>

                            </RadioGroup>
                        </div>

                        <div className='border-2 rounded-md p-3 space-y-2'>
                            <Label
                                className="flex items-center text-lg -mt-2 font-bold"
                            >
                                {language === 'zh'
                                    ? '数据上传'
                                    : 'Data Upload'}
                            </Label>
                            {dataSourceType === 'local' ? (
                                // 本地数据上传
                                <div
                                    className={cn(
                                        'relative flex items-center justify-center w-full h-[200px] rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100 transition-all  cursor-pointer  duration-200'
                                    )}
                                    onClick={handleLocalFeatureSelect}
                                >
                                    <div
                                        className="flex flex-col items-center gap-2 text-center"

                                    >
                                        <Upload className="h-8 w-8 text-gray-500" />
                                        <span className="text-xs text-gray-600 font-medium">
                                            {language === 'zh'
                                                ? '拖放或点击上传 .tif 文件'
                                                : 'Drag and drop or click to upload .tif file'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                // 已注册数据
                                <div className='flex flex-col items-center text-center space-y-2'>
                                    <img src={wbda} alt="wbda" />
                                    <div className='text-3xl font-bold'>
                                        我不道咋写啊，后端也妹建立啊
                                    </div>
                                </div>
                            )}
                        </div>
                        {importFeatureError && (<div className="text-red-500 text-sm text-center flex items-center -mb-2 justify-center w-full">
                            {importFeatureError}
                        </div>)}
                    </div>

                    <DialogFooter className="gap-4">
                        <Button
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                            onClick={() => {
                                setImportFeatureDialog(false);
                                setImportFeatureError('');
                            }}
                        >
                            {language == 'zh' ? '取消' : 'Cancel'}
                        </Button>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
                            onClick={handleImportFeature}
                        >
                            {language == 'zh' ? '导入' : 'Import'}
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
                <Separator className='h-full ml-2 mr-2' orientation='vertical' />
                <div className="flex items-center gap-2">
                    {editTools.map((tool, index) => (
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
            </div>
        </>
    );
};

export default FeatureToolbar;