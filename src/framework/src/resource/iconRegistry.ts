import { Grid3X3, Settings, User, Languages, Combine } from 'lucide-react'
import { IconEntry } from '../components/iconBar/types'

export const ICON_REGISTRY: IconEntry[] = [
    { id: 'grid-editor', icon: Grid3X3, label: 'Grid Editor' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'simulation', icon: Combine, label: 'Simulation' },
    { id: 'languages', icon: Languages, label: 'Languages', style: 'mt-auto' },
    { id: 'user', icon: User, label: 'User', style: '!border-blue-500' }
]