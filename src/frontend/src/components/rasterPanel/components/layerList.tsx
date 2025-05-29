
import type React from 'react';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Eye,
    MoreHorizontal,
    Map,
    Layers,
    Mountain,
    Trees,
    Building,
    Waves,
    Route,
    MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/utils';
import type {
    LayerItem,
    LayerList,
    LayerItemComponentProps,
} from '../types/types';

const mockLayerData: LayerItem[] = [
    {
        id: 'terrain-group',
        name: 'Terrain Layers',
        type: 'group',
        visible: true,
        icon: <Mountain className="h-4 w-4" />,
        children: [
            {
                id: 'dem',
                name: 'Digital Elevation Model',
                type: 'raster',
                visible: true,
                icon: <Map className="h-4 w-4" />,
                opacity: 80,
                symbology: 'elevation',
            },
            {
                id: 'hillshade',
                name: 'Hillshade',
                type: 'raster',
                visible: true,
                icon: <Mountain className="h-4 w-4" />,
                opacity: 60,
                symbology: 'grayscale',
            },
            {
                id: 'contours',
                name: 'Contour Lines',
                type: 'vector',
                visible: false,
                icon: <Route className="h-4 w-4" />,
                symbology: 'brown-lines',
            },
        ],
    },
    {
        id: 'landuse-group',
        name: 'Land Use',
        type: 'group',
        visible: true,
        icon: <Trees className="h-4 w-4" />,
        children: [
            {
                id: 'forest',
                name: 'Forest Areas',
                type: 'feature',
                visible: true,
                icon: <Trees className="h-4 w-4" />,
                symbology: 'green-fill',
            },
            {
                id: 'urban',
                name: 'Urban Areas',
                type: 'feature',
                visible: true,
                icon: <Building className="h-4 w-4" />,
                symbology: 'gray-fill',
            },
            {
                id: 'water',
                name: 'Water Bodies',
                type: 'feature',
                visible: true,
                icon: <Waves className="h-4 w-4" />,
                symbology: 'blue-fill',
            },
        ],
    }
];

function LayerItemComponent({
    layer,
    level,
    onToggleVisibility,
    onToggleExpanded,
    expandedGroups,
}: LayerItemComponentProps) {
    const isExpanded = expandedGroups.has(layer.id);
    const hasChildren = layer.children && layer.children.length > 0;

    const getSymbologyColor = (symbology?: string) => {
        switch (symbology) {
            case 'elevation':
                return 'bg-gradient-to-r from-green-500 to-red-500';
            case 'grayscale':
                return 'bg-gradient-to-r from-black to-white';
            case 'green-fill':
                return 'bg-green-500';
            case 'gray-fill':
                return 'bg-gray-500';
            case 'blue-fill':
                return 'bg-blue-500';
            case 'brown-lines':
                return 'bg-amber-700';
            case 'black-lines':
                return 'bg-black';
            case 'red-lines':
                return 'bg-red-500';
            default:
                return 'bg-gray-300';
        }
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    'flex items-center gap-1 py-1 px-2 hover:bg-gray-100 group',
                    level > 0 && 'ml-4'
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-gray-200"
                        onClick={() => onToggleExpanded(layer.id)}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                    </Button>
                ) : (
                    <div className="w-4" />
                )}

                {/* Visibility Checkbox */}
                <Checkbox
                    checked={layer.visible}
                    onCheckedChange={() => onToggleVisibility(layer.id)}
                    className="h-4 w-4"
                />

                {/* Layer Icon */}
                <div className="flex-shrink-0">{layer.icon}</div>

                {/* Layer Name */}
                <span
                    className={cn(
                        'flex-1 text-sm truncate',
                        layer.type === 'group' && 'font-medium'
                    )}
                >
                    {layer.name}
                </span>

                {/* Symbology Preview */}
                {layer.symbology && (
                    <div
                        className={cn(
                            'w-4 h-3 rounded-sm border border-gray-300',
                            getSymbologyColor(layer.symbology)
                        )}
                    />
                )}

                {/* Context Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                        >
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Zoom to Layer
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Layers className="h-4 w-4 mr-2" />
                            Properties
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Remove Layer</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {layer.children!.map((child) => (
                        <LayerItemComponent
                            key={child.id}
                            layer={child}
                            level={level + 1}
                            onToggleVisibility={onToggleVisibility}
                            onToggleExpanded={onToggleExpanded}
                            expandedGroups={expandedGroups}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LayerList({ onUpload }: LayerList) {
    const [layers, setLayers] = useState<LayerItem[]>(mockLayerData);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(['terrain-group', 'landuse-group'])
    );

    const toggleVisibility = (id: string) => {
        const updateLayer = (items: LayerItem[]): LayerItem[] => {
            return items.map((item) => {
                if (item.id === id) {
                    return { ...item, visible: !item.visible };
                }
                if (item.children) {
                    return { ...item, children: updateLayer(item.children) };
                }
                return item;
            });
        };
        setLayers(updateLayer(layers));
    };

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedGroups(newExpanded);
    };

    return (
        <div className="w-full border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b rounded-t-md bg-gray-50">
                <h3 className="font-semibold text-sm">Layers</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Layer List */}
            <ScrollArea className="h-80">
                <div className="p-1">
                    {layers.map((layer) => (
                        <LayerItemComponent
                            key={layer.id}
                            layer={layer}
                            level={0}
                            onToggleVisibility={toggleVisibility}
                            onToggleExpanded={toggleExpanded}
                            expandedGroups={expandedGroups}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-2 border-t rounded-b-md bg-gray-50">
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-gray-600 text-white text-xs cursor-pointer"
                        onClick={() => onUpload(true)}
                    >
                        Add Layer
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-gray-600 text-white text-xs cursor-pointer"
                    >
                        Add Group
                    </Button>
                </div>
            </div>
        </div>
    );
}
