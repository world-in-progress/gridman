import { useContext, useState } from 'react';
import {
    FilePlus2,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    MoreHorizontal,
    Map,
    Layers,
    Mountain,
    Trees,
    Building,
    Waves,
    Route,
    MapPin,
    PencilRuler,
    Pencil,
    Import,
    Trash2
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
    LayerListProps,
} from '../types/types';
import { LanguageContext } from '@/context';

export const mockLayerData: LayerItem[] = [
    {
        id: 'Edited',
        name: 'Edited',
        type: 'group',
        visible: true,
        icon: <PencilRuler className="h-4 w-4" />,
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
        id: 'Unedited',
        name: 'Unedited',
        type: 'group',
        visible: true,
        icon: <Pencil className="h-4 w-4" />,
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
                    'flex items-center gap-1 rounded-md py-1 px-2 hover:bg-gray-100 group cursor-pointer',
                    level > 0 && 'ml-4'
                )}
                style={{ paddingLeft: `${level * 8}px` }}
                onClick={() => onToggleExpanded(layer.id)}
            >
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="ml-1 h-3 w-3" />
                    ) : (
                        <ChevronRight className="ml-1 h-3 w-3" />
                    )
                ) : (
                    <div className="w-4" />
                )}

                {/* Visibility Checkbox */}
                <Checkbox
                    checked={layer.visible}
                    onCheckedChange={() => onToggleVisibility(layer.id)}
                    className="h-4 w-4 cursor-pointer"
                    onClick={e => e.stopPropagation()}
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
                    <DropdownMenuContent
                        side="right"
                        align="start"
                        alignOffset={40}
                        sideOffset={-10}
                        className="w-48"
                    >
                        <DropdownMenuItem>
                            <MapPin className="h-4 w-4" />
                            Zoom to Layer
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Layers className="h-4 w-4" />
                            Properties
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Trash2 className="h-4 w-4" />
                            Remove Layer
                        </DropdownMenuItem>
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

// 定义 LayerList 组件的 props 类型
// 如果 types/types.ts 中已经定义了 LayerListProps，则可以使用导入的类型


// 修改 LayerList 组件定义以接收 layers 和 setLayers prop
// 将 {}: LayerList 修改为 { layers, setLayers }: LayerListProps
export default function LayerList({ layers, setLayers }: LayerListProps) {
    const { language } = useContext(LanguageContext)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Edited', 'Unedited']));
    const [showAll, setShowAll] = useState(true);

    const toggleVisibility = (id: string) => {
        const updateLayer = (items: LayerItem[]): LayerItem[] => {
            return items.map((item) => {
                if (item.id === id) {
                    const newVisible = !item.visible;
                    const setChildrenVisible = (children?: LayerItem[]): LayerItem[] | undefined => {
                        if (!children) return undefined;
                        return children.map(child => ({
                            ...child,
                            visible: newVisible,
                            children: setChildrenVisible(child.children)
                        }));
                    };
                    return {
                        ...item,
                        visible: newVisible,
                        children: setChildrenVisible(item.children)
                    };
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

    const setAllVisible = (items: LayerItem[], visible: boolean): LayerItem[] => {
        return items.map(item => ({
            ...item,
            visible,
            children: item.children ? setAllVisible(item.children, visible) : undefined
        }));
    };

    return (
        <div className="w-full min-h-[480px] mb-2 border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b rounded-t-md bg-gray-50">
                <h3 className="font-semibold text-lg">Feature Layer List</h3>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 cursor-pointer"
                        title={language == 'zh' ? '切换全部显示' : 'Switch all displays'}
                        onClick={() => {
                            setShowAll((prev) => {
                                const newShowAll = !prev;
                                setLayers(layers => setAllVisible(layers, newShowAll));
                                return newShowAll;
                            });
                        }}
                    >
                        {showAll ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Layer List */}
            <ScrollArea>
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
        </div>
    );
}
