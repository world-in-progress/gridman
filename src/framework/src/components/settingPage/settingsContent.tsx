import { SettingItem } from "./settingsItem"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "./settingStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingsContentProps {
    activeCategory: string
}

export function SettingsContent({ activeCategory }: SettingsContentProps) {

    const { highSpeedMode, setHighSpeedMode } = useSettingsStore()

    const handleSettingChange = (settingName: string, value: any) => {

    }

    const renderGeneralSettings = () => (
        <div className="space-y-0">
            <SettingItem title="Grid: High Speed" description="控制是否开启高速操作。">
                <Select
                    value={highSpeedMode ? "on" : "off"}
                    onValueChange={(value) => setHighSpeedMode(value === "on")}
                >
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Off" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="on">On</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Files: Auto Save" description="控制是否自动保存更改的文件。">
                <Select onValueChange={(value) => handleSettingChange("autoSave", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="off" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="off">off</SelectItem>
                        <SelectItem value="afterDelay">afterDelay</SelectItem>
                        <SelectItem value="onFocusChange">onFocusChange</SelectItem>
                        <SelectItem value="onWindowChange">onWindowChange</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Editor: Font Size" description="控制字体大小（像素）。">
                <Input
                    type="number"
                    defaultValue="14"
                    className="w-20 bg-gray-700 border-gray-600 text-white"
                    onChange={(e) => handleSettingChange("fontSize", e.target.value)}
                />
            </SettingItem>

            <SettingItem title="Editor: Font Family" description="控制字体系列。">
                <Input
                    defaultValue="Consolas, 'Courier New', monospace"
                    className="w-64 bg-gray-700 border-gray-600 text-white"
                    onChange={(e) => handleSettingChange("fontFamily", e.target.value)}
                />
            </SettingItem>

            <SettingItem
                title="Editor: Tab Size"
                description="一个制表符等于的空格数。当 Editor: Detect Indentation 打开时，将根据文件内容重写此设置。"
            >
                <Input
                    type="number"
                    defaultValue="4"
                    className="w-20 bg-gray-700 border-gray-600 text-white"
                    onChange={(e) => handleSettingChange("tabSize", e.target.value)}
                />
            </SettingItem>

            <SettingItem title="Editor: Render Whitespace" description="控制编辑器应如何呈现空白字符。">
                <Select onValueChange={(value) => handleSettingChange("renderWhitespace", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="selection" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">none</SelectItem>
                        <SelectItem value="boundary">boundary</SelectItem>
                        <SelectItem value="selection">selection</SelectItem>
                        <SelectItem value="trailing">trailing</SelectItem>
                        <SelectItem value="all">all</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Editor: Cursor Style" description="在插入模式下光标的样式。">
                <Select onValueChange={(value) => handleSettingChange("cursorStyle", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="line" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="line">line</SelectItem>
                        <SelectItem value="block">block</SelectItem>
                        <SelectItem value="underline">underline</SelectItem>
                        <SelectItem value="line-thin">line-thin</SelectItem>
                        <SelectItem value="block-outline">block-outline</SelectItem>
                        <SelectItem value="underline-thin">underline-thin</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem
                title="Editor: Multi Cursor Modifier"
                description="用于添加多个光标的修饰键。转到定义和打开链接手势将适应以避免与多光标修饰符冲突。"
            >
                <Select onValueChange={(value) => handleSettingChange("multiCursorModifier", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="alt" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ctrlCmd">ctrlCmd</SelectItem>
                        <SelectItem value="alt">alt</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Editor: Word Wrap" description="控制折行的方式。">
                <Select onValueChange={(value) => handleSettingChange("wordWrap", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="off" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="off">off</SelectItem>
                        <SelectItem value="on">on</SelectItem>
                        <SelectItem value="wordWrapColumn">wordWrapColumn</SelectItem>
                        <SelectItem value="bounded">bounded</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Editor: Line Numbers" description="控制行号的显示。">
                <Select onValueChange={(value) => handleSettingChange("lineNumbers", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="on" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="off">off</SelectItem>
                        <SelectItem value="on">on</SelectItem>
                        <SelectItem value="relative">relative</SelectItem>
                        <SelectItem value="interval">interval</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>
        </div>
    )

    const renderWorkbenchSettings = () => (
        <div className="space-y-0">
            <SettingItem title="Workbench: Color Theme" description="指定在工作台中使用的颜色主题。">
                <Select onValueChange={(value) => handleSettingChange("colorTheme", value)}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Dark+ (default dark)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dark">Dark+ (default dark)</SelectItem>
                        <SelectItem value="light">Light+ (default light)</SelectItem>
                        <SelectItem value="high-contrast">High Contrast</SelectItem>
                        <SelectItem value="monokai">Monokai</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Workbench: Icon Theme" description="指定在工作台中使用的图标主题。">
                <Select onValueChange={(value) => handleSettingChange("iconTheme", value)}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="vs-seti" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="vs-seti">Seti (Visual Studio Code)</SelectItem>
                        <SelectItem value="vs-minimal">Minimal (Visual Studio Code)</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Workbench: Activity Bar Visible" description="控制活动栏的可见性。">
                <Switch
                    onCheckedChange={(checked) => handleSettingChange("activityBarVisible", checked)}
                    defaultChecked={true}
                />
            </SettingItem>

            <SettingItem title="Workbench: Status Bar Visible" description="控制状态栏的可见性。">
                <Switch onCheckedChange={(checked) => handleSettingChange("statusBarVisible", checked)} defaultChecked={true} />
            </SettingItem>
        </div>
    )

    const renderWindowSettings = () => (
        <div className="space-y-0">
            <SettingItem title="Window: Zoom Level" description="调整窗口的缩放级别。">
                <Input
                    type="number"
                    defaultValue="0"
                    className="w-20 bg-gray-700 border-gray-600 text-white"
                    onChange={(e) => handleSettingChange("zoomLevel", e.target.value)}
                />
            </SettingItem>

            <SettingItem title="Window: Menu Bar Visibility" description="控制菜单栏的可见性。">
                <Select onValueChange={(value) => handleSettingChange("menuBarVisibility", value)}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="classic" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="classic">classic</SelectItem>
                        <SelectItem value="visible">visible</SelectItem>
                        <SelectItem value="toggle">toggle</SelectItem>
                        <SelectItem value="hidden">hidden</SelectItem>
                    </SelectContent>
                </Select>
            </SettingItem>

            <SettingItem title="Window: Auto Detect High Contrast" description="如果启用，将自动更改为高对比度主题。">
                <Switch
                    onCheckedChange={(checked) => handleSettingChange("autoDetectHighContrast", checked)}
                    defaultChecked={true}
                />
            </SettingItem>
        </div>
    )

    const getSettingsContent = () => {
        switch (activeCategory) {
            case "general":
            case "text-editor":
                return renderGeneralSettings()
            case "workbench":
            case "appearance":
                return renderWorkbenchSettings()
            case "window":
                return renderWindowSettings()
            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-gray-400">选择左侧的设置类别以查看相关选项</p>
                    </div>
                )
        }
    }

    return (
        <div className="flex-1 bg-[#1E1E1E]">
            <div className=" px-6 py-4">
                <div className="flex space-x-6">
                    <button className="text-blue-400 border-b-2 border-blue-400 pb-2">用户</button>
                    <button className="text-gray-400 hover:text-white pb-2">工作区</button>
                </div>
            </div>

            <div className="px-6 py-4">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-2">常用设置</h2>
                    <p className="text-sm text-gray-400">这些是最常用的设置。</p>
                </div>

                <div className="max-w-4xl">{getSettingsContent()}</div>
            </div>
        </div>
    )
}
