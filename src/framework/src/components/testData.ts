import { Grid3X3, Play, Eye, Map as MapIcon, Settings, User } from "lucide-react"
import { ActivityBarItem } from "./framework"

export const activityBarItems: ActivityBarItem[] = [
    { id: "grid-editor", icon: Grid3X3, label: "Grid Editor", tabName: "Grid Editor", name: "Grid Editor", path: "Grid Editor", isActive: true, activityId: "grid-editor" },
    { id: "simulation", icon: Play, label: "Simulation", tabName: "Simulation", name: "Simulation", path: "Simulation", isActive: true, activityId: "simulation" },
    { id: "viewer", icon: Eye, label: "Viewer", tabName: "Viewer", name: "Viewer", path: "Viewer", isActive: true, activityId: "viewer" },
    { id: "map-editor", icon: MapIcon, label: "Map Editor", tabName: "Map Editor", name: "Map Editor", path: "Map Editor", isActive: true, activityId: "map-editor" },
    { id: "settings", icon: Settings, label: "Settings", tabName: "Settings", name: "Settings", path: "Settings", isActive: true, activityId: "settings" },
    { id: "user", icon: User, label: "User", tabName: "User", name: "User", path: "User", isActive: true, activityId: "user" },
]