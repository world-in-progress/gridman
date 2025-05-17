import { Sidebar } from '@/components/ui/sidebar';

export interface BrushCardProps {
    
}

export interface EditorPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface TopologyPanelProps {
    pickingTab: 'picking' | 'unpicking' | 'delete'| undefined;
    setPickingTab: (tab: 'picking' | 'unpicking' | 'delete') => void;
    activeSelectTab: 'brush' | 'box' | 'feature' | undefined;
    setActiveSelectTab: (tab: 'brush' | 'box' | 'feature') => void;
}

export interface AttributePanelProps {
    
}