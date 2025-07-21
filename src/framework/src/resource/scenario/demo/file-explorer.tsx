"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/utils/utils"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  path: string
}

const fileStructure: FileNode[] = [
  {
    name: "Private",
    type: "folder",
    path: "Private",
    children: [
      {
        name: "root",
        type: "folder",
        path: "Private/root",
        children: [
          { name: "dems", type: "file", path: "Private/root/dems" },
          { name: "instances", type: "file", path: "Private/root/instances" },
          { name: "lums", type: "file", path: "Private/root/lums" },
          { name: "rainfalls", type: "file", path: "Private/root/rainfalls" },
          { name: "solutions", type: "file", path: "Private/root/solutions" },
          {
            name: "topo",
            type: "folder",
            path: "Private/root/topo",
            children: [
              { name: "schemas", type: "file", path: "Private/root/topo/schemas" },
              {
                name: "测试一下",
                type: "folder",
                path: "Private/root/topo/测试一下",
                children: [
                  { name: "grids", type: "file", path: "Private/root/topo/测试一下/grids" },
                  { name: "patches", type: "file", path: "Private/root/topo/测试一下/patches" },
                  { name: "测试一下", type: "file", path: "Private/root/topo/测试一下/测试一下" },
                ],
              },
            ],
          },
          { name: "vectors", type: "file", path: "Private/root/vectors" },
        ],
      },
    ],
  },
  {
    name: "Public",
    type: "folder",
    path: "Public",
    children: [
      {
        name: "root",
        type: "folder",
        path: "Public/root",
        children: [
          { name: "dems", type: "file", path: "Public/root/dems" },
          { name: "instances", type: "file", path: "Public/root/instances" },
          { name: "lums", type: "file", path: "Public/root/lums" },
          { name: "rainfalls", type: "file", path: "Public/root/rainfalls" },
          { name: "solutions", type: "file", path: "Public/root/solutions" },
          { name: "topo", type: "folder", path: "Public/root/topo" },
          { name: "vectors", type: "folder", path: "Public/root/vectors" },
        ],
      },
    ],
  },
]

interface FileTreeNodeProps {
  node: FileNode
  level: number
  onDragStart: (node: FileNode) => void
}

function FileTreeNode({ node, level, onDragStart }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)

  const handleDragStart = (e: React.DragEvent) => {
    if (node.type === "file") {
      // 设置拖拽数据
      e.dataTransfer.setData("application/json", JSON.stringify(node))
      e.dataTransfer.effectAllowed = "copy"
      onDragStart(node)
    } else {
      e.preventDefault()
    }
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer select-none",
          node.type === "file" && "cursor-grab active:cursor-grabbing",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => node.type === "folder" && setIsExpanded(!isExpanded)}
        draggable={node.type === "file"}
        onDragStart={handleDragStart}
      >
        {node.type === "folder" && (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />
            )}
          </>
        )}
        {node.type === "file" && <File className="w-4 h-4 flex-shrink-0 text-gray-400 ml-5" />}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={`${child.path}-${index}`} node={child} level={level + 1} onDragStart={onDragStart} />
          ))}
        </div>
      )}
    </div>
  )
}

interface FileExplorerProps {
  onDragStart: (node: FileNode) => void
}

export function FileExplorer({ onDragStart }: FileExplorerProps) {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">EXPLORER</h2>
      </div>
      <div className="py-2">
        {fileStructure.map((node, index) => (
          <FileTreeNode key={`${node.path}-${index}`} node={node} level={0} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

export type { FileNode }
