import { LucideIcon } from 'lucide-react';

export interface Schema {
  name: string;
  description?: string;
  starred?: boolean;
  epsg: number;
  base_point: number[];
  grid_info: number[][];
}

export interface MenuItem {
  title: string;
  url: string;
  onClick?: (e: React.MouseEvent) => void;
}

export interface SubNavItem {
  title: string;
  url: string;
  schema?: Schema;
  items?: MenuItem[];
  icon?: LucideIcon;
  isActive?: boolean;
}

export interface SubNavPanelProps {
  items?: SubNavItem[];
  currentPage: number;
  itemsPerPage: number;
  onTotalItemsChange: (total: number) => void;
  onNavigateToPage?: (page: number) => void;
} 