import { Tab, ActivityBarItem } from "../framework";

export interface TabBarProps{
    tabs: Tab[]
    setActiveTab: (tabId: string) => void
    closeTab: (tabId: string) => void
    pinFile: (fileName: string, filePath: string) => void
}