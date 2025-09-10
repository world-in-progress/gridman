"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/utils"
import '@/App.css'

// 预设渐变色带
const gradientPresets = [
	"bg-gradient-to-r from-purple-900 via-teal-500 to-lime-400",
	"gradient-multicolor",
	"gradient-multicolor2",
	"bg-gradient-to-r from-red-50 via-red-400 to-red-900",
	"bg-gradient-to-r from-purple-950 via-fuchsia-600 via-orange-500 to-yellow-100",
	"bg-gradient-to-r from-blue-50 via-blue-400 to-purple-800",
	"bg-gradient-to-r from-green-50 to-green-800",
	"bg-gradient-to-r from-green-50 via-teal-300 to-blue-600",
	"bg-gradient-to-r from-yellow-100 via-orange-500 to-red-800",
	"bg-gradient-to-r from-white to-black"
]

interface GradientColorSelectProps {
	value?: number
	defaultValue?: number
	onValueChange?: (value: number) => void
	disabled?: boolean
	className?: string
}

export default function GradientColorSelect({
	value,
	defaultValue,
	onValueChange,
	disabled = false,
	className,
}: GradientColorSelectProps) {
	const [selectedIndex, setSelectedIndex] = useState(value ?? defaultValue ?? 0)
	const [isOpen, setIsOpen] = useState(false)

	// 当外部value改变时更新内部状态
	useEffect(() => {
		if (value !== undefined) {
			setSelectedIndex(safeIndex(value))
		}
	}, [value])

	// 确保索引在有效范围内
	const safeIndex = (idx: number) => {
		return Math.max(0, Math.min(idx, gradientPresets.length - 1))
	}

	const handleSelect = (index: number) => {
		const newIndex = safeIndex(index)
		if (value === undefined) {
			// 非受控模式
			setSelectedIndex(newIndex)
		}
		onValueChange?.(newIndex)
		setIsOpen(false)
	}

	const currentGradient = value !== undefined ? value : gradientPresets[selectedIndex]

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-60 h-8 p-1 justify-between bg-transparent",
						disabled && "opacity-50 cursor-not-allowed",
						className,
					)}
				>
					<div className={cn("flex-1 h-6 rounded", currentGradient)} />
					<ChevronDown className="h-3 w-3 ml-1 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-60 min-w-[var(--radix-dropdown-menu-trigger-width)] p-2">
				<div className="space-y-1">
					{gradientPresets.map((gradient, index) => (
						<button
							type="button"
							key={index}
							onClick={() => handleSelect(index)}
							title={`Select gradient preset ${index + 1}`}
							aria-label={`Select gradient preset ${index + 1}`}
							className={cn(
								"w-full h-6 rounded transition-all duration-200 hover:scale-105 cursor-pointer",
								gradient,
								currentGradient === gradient && "ring-2 ring-blue-500 ring-offset-2",
							)}
						/>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
