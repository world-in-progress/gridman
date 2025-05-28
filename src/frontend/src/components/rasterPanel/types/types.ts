import { Sidebar } from '@/components/ui/sidebar';

export interface RasterPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export interface LayerList {
    onUpload: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface LayerItem {
    id: string;
    name: string;
    type: 'group' | 'raster' | 'vector' | 'feature';
    visible: boolean;
    children?: LayerItem[];
    icon?: React.ReactNode;
    opacity?: number;
    symbology?: string;
}

export interface LayerItemComponentProps {
    layer: LayerItem;
    level: number;
    onToggleVisibility: (id: string) => void;
    onToggleExpanded: (id: string) => void;
    expandedGroups: Set<string>;
}
