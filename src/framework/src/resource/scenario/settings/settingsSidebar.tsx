"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"

interface SettingsCategory {
	id: string
	name: string
	icon?: string
	subcategories?: SettingsCategory[]
}

const settingsCategories: SettingsCategory[] = [
	{
		id: "grid-editor",
		name: "网格编辑器",
		subcategories: [
			{ id: "general", name: "常规" },
			{ id: "font", name: "字体" },
			{ id: "formatting", name: "格式化" },
			{ id: "suggestions", name: "建议" },
		],
	},
	{
		id: "workbench",
		name: "工作台",
		subcategories: [
			{ id: "appearance", name: "外观" },
			{ id: "editor-management", name: "编辑器管理" },
			{ id: "settings", name: "设置" },
		],
	},
	{
		id: "window",
		name: "窗口",
	},
	{
		id: "features",
		name: "功能",
		subcategories: [
			{ id: "explorer", name: "资源管理器" },
			{ id: "search", name: "搜索" },
			{ id: "debug", name: "调试" },
		],
	},
	{
		id: "application",
		name: "应用程序",
	},
	{
		id: "security",
		name: "安全性",
	},
	{
		id: "extensions",
		name: "扩展",
	},
]

interface SettingsSidebarProps {
	activeCategory: string
	onCategoryChange: (categoryId: string) => void
}

export function SettingsSidebar({ activeCategory, onCategoryChange }: SettingsSidebarProps) {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["text-editor"]))

	const toggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories)
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId)
		} else {
			newExpanded.add(categoryId)
		}
		setExpandedCategories(newExpanded)
	}

	const renderCategory = (category: SettingsCategory, level = 0) => {
		const isExpanded = expandedCategories.has(category.id)
		const isActive = activeCategory === category.id
		const hasSubcategories = category.subcategories && category.subcategories.length > 0

		return (
			<div key={category.id}>
				<div
					className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${isActive ? "bg-[#2A2C33] text-white" : "text-gray-300"
						}`}
					style={{ paddingLeft: `${8 + level * 16}px` }}
					onClick={() => {
						if (hasSubcategories) {
							toggleCategory(category.id)
						} else {
							onCategoryChange(category.id)
						}
					}}
				>
					{hasSubcategories && (
						<div className="mr-1">
							{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
						</div>
					)}
					<span className={hasSubcategories ? "" : "ml-5"}>{category.name}</span>
				</div>
				{hasSubcategories && isExpanded && (
					<div>{category.subcategories!.map((subcategory) => renderCategory(subcategory, level + 1))}</div>
				)}
			</div>
		)
	}

	return (
		<div className="w-64 bg-[#1E1E1E] border-r border-gray-700 overflow-y-auto">
			<div className="p-4">
				<h3 className="text-sm font-medium text-gray-400 mb-2">设置</h3>
				<div className="space-y-1">{settingsCategories.map((category) => renderCategory(category))}</div>
			</div>
		</div>
	)
}
