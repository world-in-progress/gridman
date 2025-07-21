"use client"

import { useState } from "react"
import { FileExplorer, type FileNode } from "./file-explorer"
import { ResourceUploadArea } from "./resource-upload-area"

export default function VSCodeInterface() {
  const [selectedResources, setSelectedResources] = useState<FileNode[]>([])

  const handleDrop = (node: FileNode) => {
    // 检查资源是否已经被选择
    const isAlreadySelected = selectedResources.some((resource) => resource.path === node.path)

    if (!isAlreadySelected) {
      setSelectedResources((prev) => [...prev, node])
    }
  }

  const handleResourceRemove = (index: number) => {
    setSelectedResources((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setSelectedResources([])
  }

  const handleMerge = () => {
    if (selectedResources.length > 0) {
      alert(`合并 ${selectedResources.length} 个资源: ${selectedResources.map((r) => r.name).join(", ")}`)
    }
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      <FileExplorer onDragStart={() => {}} />
      <ResourceUploadArea
        selectedResources={selectedResources}
        onResourceRemove={handleResourceRemove}
        onReset={handleReset}
        onMerge={handleMerge}
        onDrop={handleDrop}
      />
    </div>
  )
}
