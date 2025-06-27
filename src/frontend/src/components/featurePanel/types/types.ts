import { Sidebar } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";

export type LayerNode = LayerGroup | LayerItem;

export interface LayerGroup {
    id: string;
    name: string;
    type: "group";
    visible: boolean;
    icon: React.ReactNode;
    children: LayerNode[];
}

export interface LayerItem {
    id: string;
    name: string;
    visible: boolean;
    icon: React.ReactNode;
    group: string;
    symbology: string;
    isEditing: boolean;
    opacity?: number;
    type: string;
}

export interface FeaturePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
    layers: LayerNode[];
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    setSelectedLayerId: (id: string | null) => void;
    isEditMode: boolean;
    setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    iconOptions: { value: string; Icon: LucideIcon }[];
    symbologyOptions: { value: string; color: string }[];
    getIconString: (icon: React.ReactNode) => string;
    getIconComponent: (iconValue: string) => React.ReactNode;
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
    onDeleteLayer: (id: string) => void;
    onPropertiesChange: (id: string) => void;
}

export interface ToolItem {
    onClick: () => void;
    title: string;
    Icon: LucideIcon;
    className?: string; // 添加可选的 className 属性
}

export interface FeatureToolbarProps {
    layers: LayerNode[];
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    setSelectedLayerId: (id: string | null) => void;
    iconOptions: { value: string; Icon: LucideIcon }[];
    getIconComponent: (iconValue: string) => React.ReactNode;
    getIconString: (icon: React.ReactNode) => string;
    symbologyOptions: { value: string; color: string }[];
    isEditMode: boolean;
    setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    // onStartDrawPolygon: (cancel?: boolean) => void;
    // isPolygonDrawing: boolean;
}

export interface LayerListProps {
    layers: LayerNode[];
    setLayers: React.Dispatch<React.SetStateAction<LayerNode[]>>;
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
    onDeleteLayer: (id: string) => void;
    onPropertiesChange: (id: string) => void;
    getIconComponent: (iconValue: string) => React.ReactNode;
}
