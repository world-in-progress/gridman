import { FileNode } from "../types"
import { SceneNode, ResourceTree } from "@/core/tree/scene"

export interface ResourceFolderProps {
    localFileTree: ResourceTree
    remoteFileTree: ResourceTree
    localExpandedFolders: Set<string>
    remoteExpandedFolders: Set<string>
    getLocalTree: boolean,
    openFile: (fileName: string, filePath: string) => void
    pinFile: (fileName: string, filePath: string) => void
    handleDropDownMenuOpen: (node: SceneNode, isRemote: boolean) => void
    handleFolderClick: (tree: ResourceTree, node: SceneNode) => Promise<void>
}