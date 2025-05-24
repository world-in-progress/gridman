import { Sidebar } from '@/components/ui/sidebar';

export interface AggregationPanelProps
    extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface TopologyValidationProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface TestProps {}

export interface LUMDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}

export interface TerrainDataNodeProps {
    isClicked?: boolean;
    onNodeClick?: () => void;
}
