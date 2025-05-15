import { Sidebar } from '@/components/ui/sidebar';

export interface BrushCardProps {
    
}

export interface EditorPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface TopologyPanelProps {
    pickingTab: 'picking' | 'unpicking' | 'delete';
    setPickingTab: (tab: 'picking' | 'unpicking' | 'delete') => void;
    activeSelectTab: 'brush' | 'box' | 'feature';
    setActiveSelectTab: (tab: 'brush' | 'box' | 'feature') => void;
}