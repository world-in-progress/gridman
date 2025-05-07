import { FormErrors, MenuItem, SubNavItem } from '../../schemaPanel/types/types';
import { Sidebar } from '@/components/ui/sidebar';

export interface RectangleCoordinates {
    northEast: [number, number];
    southEast: [number, number];
    southWest: [number, number];
    northWest: [number, number];
    center: [number, number];
}

export interface CreateProjectProps {
    onBack?: () => void;
    onDrawRectangle?: (isCurrentlyDrawing: boolean) => void;
    rectangleCoordinates?: RectangleCoordinates | null;
    isDrawing?: boolean;
    initialSchemaName?: string;
    initialEpsg?: string;
    initialSchemaLevel?: string;
    parentProject?: Project;
}

export interface ProjectValidationResult {
    isValid: boolean;
    errors: ExtendedFormErrors;
    generalError: string | null;
}
export interface ExtendedFormErrors extends FormErrors {
    schemaName: boolean;
}

export interface ProjectErrorMessageProps {
    message: string | null;
}

export interface SubProjectErrorMessageProps {
    message: string | null;
}

export interface ProjectNameCardProps {
    name: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
}
export interface SubProjectNameCardProps {
    name: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
}

export interface Project {
    name: string;
    description?: string;
    starred?: boolean;
    schema_name: string;
    bounds: number[];
}

export interface ProjectCardProps {
    project: Project;
    title: string;
    isHighlighted: boolean;
    language: string;
    starredItems: Record<string, boolean>;
    openMenuId: string | null;
    menuItems: MenuItem[];
    onCardClick: () => void;
    onStarToggle: (name: string, project: Project) => void;
    onMenuOpenChange: (open: boolean) => void;
    editingDescription?: string | null;
    descriptionText?: Record<string, string>;
    onEditDescription?: (name: string) => void;
    onSaveDescription?: (name: string, project: Project) => Promise<void>;
    onAddSubproject?: (
        project: Project, 
        schemaName?: string, 
        epsg?: string, 
        gridInfo?: string
    ) => void;
}

export interface ProjectSubNavPanelProps {
    items?: SubNavItem[];
    currentPage: number;
    itemsPerPage: number;
    onTotalItemsChange: (total: number) => void;
    onNavigateToPage: (page: number) => void;
    searchQuery?: string;
    onCreateSubProject?: (
        parentProject: Project, 
        schemaName?: string, 
        epsg?: string, 
        gridInfo?: string
    ) => void;
}

export interface ProjectPanelProps extends React.ComponentProps<typeof Sidebar> {
  onCreateNew?: () => void;
  onCreateSubProject?: (
    parentProject: Project, 
    schemaName?: string, 
    epsg?: string, 
    gridInfo?: string
  ) => void;
}

export interface SubProjectCardProps{
    project: Project;
    title: string;
    isHighlighted: boolean;
    language: string;
    starredItems: Record<string, boolean>;
    openMenuId: string | null;
    menuItems: MenuItem[];
    onCardClick: () => void;
    onStarToggle: (name: string, project: Project) => void;
    onMenuOpenChange: (open: boolean) => void;
    editingDescription?: string | null;
    descriptionText?: Record<string, string>;
    onEditDescription?: (name: string) => void;
    onSaveDescription?: (name: string, project: Project) => Promise<void>;
    onAddSubproject?: (project: Project) => void;
}

export interface ProjectDescriptionCardProps {
    description: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
}
export interface SubProjectDescriptionCardProps {
    description: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
}

export interface ProjectSchemaNameCardProps {
    name: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

export interface ProjectEpsgCardProps {
    epsg: string;
    language: string;
    hasError: boolean;
    onChange: (value: string) => void;
    epsgFromProps?: boolean;
    formErrors?: {
        epsg?: boolean;
    };
}

export interface BelongToProjectCardProps {
    projectName: string;
    language: string;
}

export interface ProjectConvertedCoordCardProps {
    convertedCoord: { x: string; y: string } | null;
    epsg: string;
    language: string;
}