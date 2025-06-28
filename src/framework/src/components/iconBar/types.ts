import { ActivityBarItem } from "../framework"

export interface IconBarProps {
    activityBarItems: ActivityBarItem[]
    activeActivity: string
    handleActivityClick: (id: string) => void
}