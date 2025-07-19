import { useState } from "react"
import { SettingsSidebar } from "./settingsSidebar"
import { SettingsContent } from "./settingsContent"
import { Search, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
	const [activeCategory, setActiveCategory] = useState("general")
	const [searchQuery, setSearchQuery] = useState("")

	return (
		<div className="h-full w-full bg-gray-900 text-white flex flex-col">
			{/* Header */}
			<div className="flex overflow-hidden border-b border-gray-700 ">
				<div className="w-64 bg-[#1E1E1E] px-4 py-4 flex items-center">
					<div className="flex items-center space-x-2">
						<Settings className="w-8 h-8" />
						<span className="text-2xl font-bold">设置</span>
					</div>
				</div>
				<div className="flex-1 bg-[#1E1E1E] px-4 py-4 flex items-center">
					<div className="flex items-center space-x-4">
						<div className="relative">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="搜索设置"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 w-96 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				<SettingsSidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
				<SettingsContent activeCategory={activeCategory} />
			</div>
		</div >
	)
}