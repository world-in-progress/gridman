"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/utils"
import type { FileNode } from "./file-explorer"

interface ResourceUploadAreaProps {
  selectedResources: FileNode[]
  onResourceRemove: (index: number) => void
  onReset: () => void
  onMerge: () => void
  onDrop: (node: FileNode) => void
}

export function ResourceUploadArea({
  selectedResources,
  onResourceRemove,
  onReset,
  onMerge,
  onDrop,
}: ResourceUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const nodeData = e.dataTransfer.getData("application/json")
    if (nodeData) {
      try {
        const node = JSON.parse(nodeData) as FileNode
        onDrop(node)
      } catch (error) {
        console.error("Failed to parse dropped data:", error)
      }
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Create New Grid <span className="text-red-500 text-sm">测试一下</span>
          </h1>
          <div className="text-gray-300 space-y-1 text-sm">
            <p>• Fill in the name of the Schema and the EPSG code.</p>
            <p>• Description is optional.</p>
            <p>• Click the button to draw and obtain or manually fill in the coordinates of the reference point.</p>
            <p>• Set the grid size for each level.</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium text-white mb-4">资源上传栏位</h2>
          <div
            className={cn(
              "border-2 border-dashed border-gray-600 rounded-lg p-8 min-h-[200px] bg-gray-900 transition-colors",
              isDragOver && "border-blue-400 bg-gray-800",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedResources.length === 0 ? (
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">拖拽资源到此处</p>
                <p className="text-sm">从左侧资源管理器拖拽文件到这里</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedResources.map((resource, index) => (
                  <div
                    key={`${resource.path}-${index}`}
                    className="bg-gray-800 border border-gray-600 rounded-lg p-3 flex items-center justify-between group hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{resource.name}</p>
                      <p className="text-gray-400 text-xs truncate">{resource.path}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      onClick={() => onResourceRemove(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="secondary" onClick={onReset} className="bg-gray-600 hover:bg-gray-500 text-white">
            Reset
          </Button>
          <Button
            onClick={onMerge}
            className="bg-green-600 hover:bg-green-500 text-white"
            disabled={selectedResources.length === 0}
          >
            Merge
          </Button>
        </div>
      </div>
    </div>
  )
}
