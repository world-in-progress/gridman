import { FileNode } from "../types"

export interface ResourceFolderProps {
    localFileTree: FileNode[]
    remoteFileTree: FileNode[]
    expandedFolders: Set<string>
    openFile: (fileName: string, filePath: string) => void
    pinFile: (fileName: string, filePath: string) => void
    handleDropDownMenuOpen: (node: FileNode) => void
    handleFolderClick: (node: FileNode) => void
}