import { Sidebar } from '@/components/ui/sidebar';
import { LucideIcon } from 'lucide-react';

export type LayerNode = LayerGroup | LayerItem;

export interface LayerGroup {
    id: string,
    name: string,
    type: 'group'
    visible: boolean,
    icon: React.ReactNode,
    children: LayerNode[]
}

export interface LayerItem {
    id: string;
    name: string;
    type: string,
    visible: boolean;
    icon: React.ReactNode;
    group: string
    symbology: string;
    isEditing: boolean,
    opacity?: number;
}

export interface FeaturePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
    layers: LayerNode[];
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
}

export interface LayerList {
}

export interface LayerItemComponentProps {
    layer: LayerNode;
    layerGroup?: LayerGroup;
    level: number;
    onToggleVisibility: (id: string) => void;
    onToggleExpanded: (id: string) => void;
    expandedGroups: Set<string>;
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
}

export interface ToolItem {
    onClick: () => void;
    title: string;
    Icon: LucideIcon;
}

export interface FeatureToolbarProps {
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    // onStartDrawPolygon: (cancel?: boolean) => void;
    // isPolygonDrawing: boolean;
}

export interface LayerListProps {
    layers: LayerNode[];
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
}