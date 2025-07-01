import { Tab } from '../types'
import { DropResult } from '@hello-pangea/dnd'

export interface TabBarProps{
    tabs: Tab[]
    setActiveTab: (tabId: string) => void
    closeTab: (tabId: string) => void
    pinFile: (fileName: string, filePath: string) => void
    onTabDragEnd: (result: DropResult) => void
}