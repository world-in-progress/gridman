import { Sidebar } from '@/components/ui/sidebar';

export interface GridPanelProps
    extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface GridEditorProps {
    pickingTab: 'picking' | 'unpicking' | undefined;
    setPickingTab: (tab: 'picking' | 'unpicking') => void;
    activeSelectTab: 'brush' | 'box' | 'feature' | undefined;
    setActiveSelectTab: (
        tab: 'brush' | 'box' | 'feature'
    ) => 'brush' | 'box' | 'feature';
}
