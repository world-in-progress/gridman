import { useState } from "react"
import { SettingsSidebar } from "./settingsSidebar"
import { SettingsContent } from "./settingsContent"
import { Search, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#1E1E1E] border-b border-gray-700 px-4 py-2 flex items-center">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">设置</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索设置"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <SettingsContent activeCategory={activeCategory} />
      </div>
    </div>
  )
}