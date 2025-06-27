import React from 'react'
import { FileText } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { Tab, ActivityBarItem } from "../framework"
import { TabBarProps } from "./types"

export default function TabBar({ tabs, activityBarItems, setActiveTab }: TabBarProps) {

    const getTabContextMenu = (tab: Tab) => (
        <ContextMenuContent className="bg-white text-gray-900">
            <ContextMenuItem>复制路径</ContextMenuItem>
            <ContextMenuItem>在文件管理器中显示</ContextMenuItem>
            <ContextMenuItem>重命名</ContextMenuItem>
            <ContextMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50">
                删除
            </ContextMenuItem>
        </ContextMenuContent>
    )

    return (
        <div className="bg-gray-800 border-b border-gray-700 flex">
            {tabs.map((tab) => (
                <ContextMenu key={tab.id}>
                    <ContextMenuTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer",
                                "hover:bg-gray-700 min-w-0 max-w-48",
                                tab.isActive && "bg-gray-900",
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {/* 根据tab类型显示对应图标 */}
                            {(() => {
                                const activityItem = activityBarItems.find((item) => item.id === tab.activityId)
                                const IconComponent = activityItem?.icon || FileText
                                return <IconComponent className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                            })()}
                            <span className="text-sm truncate text-gray-300">{tab.name}</span>
                        </div>
                    </ContextMenuTrigger>
                    {getTabContextMenu(tab)}
                </ContextMenu>
            ))}
        </div>
    )
}
