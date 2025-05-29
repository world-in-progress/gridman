import { Sidebar } from '@/components/ui/sidebar';
import { LucideIcon } from 'lucide-react';

export interface FeaturePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
    layers: LayerItem[];
    setLayers: React.Dispatch<React.SetStateAction<LayerItem[]>>;
}

export interface LayerList {
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

export interface ToolItem {
    onClick: () => void;
    title: string;
    Icon: LucideIcon;
}

export interface FeatureToolbarProps {
    setLayers: React.Dispatch<React.SetStateAction<LayerItem[]>>;
}

export interface LayerListProps {
    layers: LayerItem[]; // 接收 layers 数组
    setLayers: React.Dispatch<React.SetStateAction<LayerItem[]>>; // 接收 setLayers 函数
    // 如果 LayerList 还有其他 props，也需要在这里添加
}