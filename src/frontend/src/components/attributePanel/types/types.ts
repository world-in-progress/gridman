import { Sidebar } from '@/components/ui/sidebar';

export interface AttributePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}


export interface TopologyValidationProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface AttributeEditorProps {
}

export interface LUMDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface TerrainDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}
