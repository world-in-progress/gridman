import { Sidebar } from '@/components/ui/sidebar';

export interface TopologyPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface TopologyEditorProps {
    pickingTab: 'picking' | 'unpicking'| undefined;
    setPickingTab: (tab: 'picking' | 'unpicking') => void;
    activeSelectTab: 'brush' | 'box' | 'feature' | undefined;
    setActiveSelectTab: (tab: 'brush' | 'box' | 'feature') => void;
}