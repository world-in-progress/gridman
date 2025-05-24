import { Sidebar } from '@/components/ui/sidebar';

export interface TopologyPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface TopologyEditorProps {
    pickingTab: 'picking' | 'unpicking'| undefined;
    setPickingTab: (tab: 'picking' | 'unpicking') => void;
    activeSelectTab: 'brush' | 'box' | 'feature' | undefined;
    setActiveSelectTab: (tab: 'brush' | 'box' | 'feature') => 'brush' | 'box' | 'feature';
}

export interface AttributePanelProps {
}

export interface LUMDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface TerrainDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface TopologyValidationProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}
