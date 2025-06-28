import { FileNode } from "../framework"

export interface ResourceFolderProps {
    fileTree: FileNode[]
    expandedFolders: Set<string>
    toggleFolder: (path: string, folderName: string) => void
    openFile: (fileName: string, filePath: string) => void
    pinFile: (fileName: string, filePath: string) => void
    handleCreateNewSchema: () => void
}