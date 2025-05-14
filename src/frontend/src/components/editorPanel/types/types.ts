import { Sidebar } from '@/components/ui/sidebar';

export interface BrushCardProps {
    
}

export interface EditorPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}