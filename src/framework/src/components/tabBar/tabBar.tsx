import React from 'react'
import { FileText, User, X } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/utils/utils"
import { Tab } from "../types"
import { TabBarProps } from "./types"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

export default function TabBar({
    tabs,
    setActiveTab,
    closeTab,
    pinFile,
    onTabDragEnd
}: TabBarProps) {

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
        <DragDropContext onDragEnd={onTabDragEnd}>
            <Droppable droppableId="tabs" direction="horizontal">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-800 border-b border-gray-700 flex h-[37px]"
                    >
                        {tabs.map((tab, index) => (
                            <Draggable key={tab.id} draggableId={tab.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <ContextMenu>
                                            <ContextMenuTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer",
                                                        "hover:bg-gray-700 min-w-0 max-w-48",
                                                        tab.isActive && "bg-gray-900",
                                                        snapshot.isDragging && "bg-gray-600"
                                                    )}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    onDoubleClick={() => {
                                                        pinFile(tab.name, tab.path)
                                                    }}
                                                >
                                                    {tab.id === "user" ? <User className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" /> : <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />}
                                                    <span className={cn("text-sm truncate text-gray-300 px-0.5", tab.isPreview && "italic")}>{tab.name}</span>
                                                    <X className="w-4 h-4 ml-2 text-gray-500 hover:text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            closeTab(tab.id)
                                                        }}
                                                    />
                                                </div>
                                            </ContextMenuTrigger>
                                            {getTabContextMenu(tab)}
                                        </ContextMenu>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}
