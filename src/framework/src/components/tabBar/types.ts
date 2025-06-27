import { Tab, ActivityBarItem } from "../framework";

export interface TabBarProps{
    tabs: Tab[]
    activityBarItems: ActivityBarItem[]
    setActiveTab: (tabId: string) => void
}