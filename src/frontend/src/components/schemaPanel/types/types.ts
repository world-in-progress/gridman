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
  onClick?: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
}

export interface SubNavItem {
  title: string;
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
  onNavigateToPage: (page: number) => void;
  onCreateProject?: (schemaName: string, epsg: string, level: string) => void;
  searchQuery?: string;
} 

export interface CreateFromDialogProps {
  schema: Schema;
  isOpen: boolean;
  language: string;
  onClose: () => void;
  onClone: (newSchema: Schema) => Promise<void>;
}

export interface SchemaCardProps {
  schema: Schema;
  title: string;
  isHighlighted: boolean;
  language: string;
  starredItems: Record<string, boolean>;
  openMenuId: string | null;
  menuItems: MenuItem[];
  onCardClick: () => void;
  onStarToggle: (name: string, schema: Schema) => void;
  onMenuOpenChange: (open: boolean) => void;
  editingDescription?: string | null;
  descriptionText?: Record<string, string>;
  onEditDescription?: (name: string) => void;
  onSaveDescription?: (name: string, schema: Schema) => Promise<void>;
  updateSchema?: (schema: Schema) => Promise<void>;
  onShowDetails?: (schema: Schema) => void;
}

export interface SchemaNameCardProps {
  name: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export interface SchemaDescriptionCardProps {
  description: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export interface SchemaEpsgCardProps {
  epsg: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export interface SchemaCoordinateCardProps {
  lon: string;
  lat: string;
  language: string;
  hasError: boolean;
  isSelectingPoint: boolean;
  onLonChange: (value: string) => void;
  onLatChange: (value: string) => void;
  onDrawClick: () => void;
}

export interface SchemaConvertedCoordCardProps {
  convertedCoord: { x: string; y: string } | null;
  epsg: string;
  language: string;
}

export interface SchemaErrorMessageProps {
  message: string | null;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}

export interface TopologyLayer {
  id: number;
  width: string;
  height: string;
}

export interface FormErrors {
  name: boolean;
  description: boolean;
  coordinates: boolean;
  epsg: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
  generalError: string | null;
}

export interface PaginationHandlers {
  handleFirstPage: () => void;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  handleLastPage: () => void;
  handleNavigateToPage: (page: number) => void;
}