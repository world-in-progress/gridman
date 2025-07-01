import { LucideProps } from 'lucide-react'

export interface IconBarClickHandlers {
    [iconID: string]: (iconID: string) => void
}

export interface IconBarResourceBinding {
    currentActiveId: string
    clickHandlers: IconBarClickHandlers
}

export interface IconEntry {
    id: string
    label: string
    style?: string
    icon: React.ComponentType<LucideProps>
}