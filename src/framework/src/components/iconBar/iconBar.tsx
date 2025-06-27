import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconBarProps } from "./types"

export default function IconBar({ activityBarItems, activeActivity, handleActivityClick }: IconBarProps) {
    return (
        <div className="w-12 bg-gray-600 flex flex-col items-center py-2">
            {activityBarItems.map((item) => (
                <Button
                    key={item.id}
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-10 h-10 mb-1 hover:bg-gray-700",
                        activeActivity === item.id && "bg-gray-700 border-l-2 border-blue-500",
                        item.id === "user" && "bg-red-700 border-l-2 border-blue-500",
                    )}
                    onClick={() => handleActivityClick(item.id)}
                    title={item.label}
                >
                    <item.icon className="w-5 h-5" />
                </Button>
            ))}
        </div>
    )
}
