import React from "react"
import { cn } from "@/utils/utils"
import { Button } from "@/components/ui/button"
import { IconBarProps } from "./types"

export default function IconBar({ activityBarItems, activeActivity, handleActivityClick }: IconBarProps) {
    return (
        <div className="w-14 bg-slate-900 flex flex-col items-center py-2">
            {activityBarItems.map((item) => (
                <Button
                    id={item.id === "user" ? "user-activity-button" : ""}
                    key={item.id}
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-10 h-10 mb-1 hover:bg-gray-700 cursor-pointer",
                        activeActivity === item.id && "bg-gray-700 border-l-2 border-blue-500",
                        item.id === "user" && "bg-cyan-600 border-l-2 border-blue-500 absolute bottom-2 hover:bg-cyan-500",
                    )}
                    onClick={() => handleActivityClick(item.id)}
                    title={item.label}
                >
                    <item.icon className="w-8 h-8 text-white"/>
                </Button>
            ))}
        </div>
    )
}
