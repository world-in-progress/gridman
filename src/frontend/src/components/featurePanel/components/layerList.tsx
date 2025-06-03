import { useContext, useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    MoreHorizontal,
    Layers,
    MapPin,
    PencilRuler,
    Pencil,
    Trash2,
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
    LayerGroup,
    LayerItemComponentProps,
    LayerListProps,
    LayerNode
} from '../types/types';
import { LanguageContext } from '@/context';

// Define the fixed layer groups
export const layerGroups: LayerGroup[] = [
    {
        id: 'Edited',
        name: 'Edited',
        type: 'group',
        visible: true,
        icon: <PencilRuler className="h-4 w-4" />,
        children: [],
    },
    {
        id: 'Unedited',
        name: 'Unedited',
        type: 'group',
        visible: true,
        icon: <Pencil className="h-4 w-4" />,
        children: [],
    },
];

const groupNameMap: { [key: string]: { zh: string; en: string } } = {
    Edited: { zh: '已编辑', en: 'Edited' },
    Unedited: { zh: '未编辑', en: 'Unedited' }
};

function LayerItemComponent({
    layer,
    layerGroup,
    level,
    onToggleVisibility,
    onToggleExpanded,
    expandedGroups,
    selectedLayerId,
    onSelectLayer,
}: LayerItemComponentProps) {

    const { language } = useContext(LanguageContext);
    const isExpanded = expandedGroups.has(layer.id);
    const isSelected = selectedLayerId === layer.id;
    const hasChildren = layer.type === 'group' && (layer as LayerGroup).children && (layer as LayerGroup).children.length > 0;

    const getSymbologyColor = (symbology?: string) => {
        switch (symbology) {
            case 'red-fill':
                return 'bg-red-500';
            case 'blue-fill':
                return 'bg-blue-500';
            case 'green-fill':
                return 'bg-green-500';
            case 'gray-fill':
                return 'bg-gray-500';
            case 'brown-lines':
                return 'bg-amber-700';
            case 'yellow-fill':
                return 'bg-yellow-500';
            case 'purple-fill':
                return 'bg-purple-500';
            case 'orange-fill':
                return 'bg-orange-500';
            default:
                return 'bg-gray-300';
        }
    };

    const onEditLayerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(language === 'zh' ? '点击了编辑图层' : 'Edit Layer clicked');
        onSelectLayer(layer.id);
    };

    const handleLayerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (layer.type === 'group') {
            onToggleExpanded(layer.id);
        } else {
            if (isSelected) {
                onSelectLayer(null);
            } else {
                onSelectLayer(layer.id);
            }
        }
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    'flex items-center gap-1 rounded-md py-1 px-2 hover:bg-gray-100 group cursor-pointer',
                    level > 0 && 'ml-4',
                    isSelected && 'bg-gray-200 hover:bg-gray-200'
                )}
                style={{ paddingLeft: `${level * 8}px` }}
                onClick={handleLayerClick}
            >
                {/* Expand/Collapse Button */}
                { isExpanded ? (
                        <ChevronDown className="ml-1 h-3 w-3" />
                    ) : (
                        <ChevronRight className="ml-1 h-3 w-3" />
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
                    {layer.type === 'group' ? groupNameMap[layer.id]?.[language] || layer.name : layer.name}
                </span>

                {/* Symbology Preview */}
                {layer.type !== 'group' && (layer as LayerItem).symbology && (
                    <div
                        className={cn(
                            'w-4 h-3 rounded-sm border border-gray-300',
                            getSymbologyColor((layer as LayerItem).symbology)
                        )}
                    />
                )}

                {/* Context Menu */}
                {layer.type !== 'group' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-gray-200"
                                onClick={e => e.stopPropagation()}
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
                            <DropdownMenuItem onClick={onEditLayerClick}>
                                <PencilRuler className="h-4 w-4 mr-2" />
                                {language === 'zh' ? '编辑图层' : 'Edit Layer'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <MapPin className="h-4 w-4 mr-2" />
                                {language === 'zh' ? '缩放到图层' : 'Zoom to Layer'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Layers className="h-4 w-4 mr-2" />
                                {language === 'zh' ? '属性' : 'Properties'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === 'zh' ? '删除图层' : 'Remove Layer'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {(layer as LayerGroup).children.map((child) => (
                        <LayerItemComponent
                            key={child.id}
                            layer={child}
                            layerGroup={layer as LayerGroup}
                            level={level + 1}
                            onToggleVisibility={onToggleVisibility}
                            onToggleExpanded={onToggleExpanded}
                            expandedGroups={expandedGroups}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={onSelectLayer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LayerList({ layers, setLayers, selectedLayerId, onSelectLayer }: LayerListProps) {
    
    const [showAll, setShowAll] = useState(true);
    const { language } = useContext(LanguageContext);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(layerGroups.map(group => group.id)));

    // Assign layers to their respective groups
    const populatedLayerGroups: LayerGroup[] = layerGroups.map(group => {
        const children = layers.filter(node =>
            node.type !== 'group' &&
            (node as LayerItem).group === group.id
        );
        return {
            ...group,
            children: children as LayerNode[]
        };
    });

    const toggleVisibility = (id: string) => {
        const updateNodes = (nodes: LayerNode[]): LayerNode[] => {
            return nodes.map((node) => {
                if (node.id === id) {
                    const newVisible = !node.visible;
                    if (node.type === 'group') {
                        return {
                            ...node,
                            visible: newVisible,
                            children: setAllVisible((node as LayerGroup).children, newVisible)
                        } as LayerGroup;
                    }
                    return { ...node, visible: newVisible };
                }
                if (node.type === 'group' && (node as LayerGroup).children) {
                    return { ...node, children: updateNodes((node as LayerGroup).children) } as LayerGroup;
                }
                return node;
            });
        };
        setLayers(prevLayers => {
            const updatedPopulatedGroups = populatedLayerGroups.map(group => {
                if (group.type === 'group') {
                    const updatedChildren = updateNodes(group.children);
                    return { ...group, children: updatedChildren } as LayerGroup;
                }
                return group;
            });

            const allItems: LayerItem[] = [];
            updatedPopulatedGroups.forEach(node => {
                if (node.type === 'group') {
                    (node as LayerGroup).children.forEach(child => {
                        if (child.type !== 'group') {
                            allItems.push(child as LayerItem);
                        }
                    });
                }
            });
            return allItems;
        });
    };

    const toggleExpanded = (id: string) => {
        setExpandedGroups(prevExpanded => {
            const newExpanded = new Set(prevExpanded);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return newExpanded;
        });
    };

    const setAllVisible = (nodes: LayerNode[], visible: boolean): LayerNode[] => {
        return nodes.map(node => {
            if (node.type === 'group') {
                return {
                    ...node,
                    visible: visible,
                    children: setAllVisible((node as LayerGroup).children, visible)
                } as LayerGroup;
            }
            return { ...node, visible: visible };
        });
    };

    return (
        <div className="w-full min-h-[480px] mb-2 border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b rounded-t-md bg-gray-50">
                <h3 className="font-semibold text-lg">
                    {language === 'zh' ? '要素图层列表' : 'Feature Layer List'}
                </h3>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 cursor-pointer"
                        title={language === 'zh' ? '切换全部显示' : 'Switch all displays'}
                        onClick={() => {
                            setShowAll((prev) => {
                                const newShowAll = !prev;
                                const updatedPopulatedGroups = setAllVisible(populatedLayerGroups, newShowAll);
                                const allItems: LayerItem[] = [];
                                updatedPopulatedGroups.forEach(node => {
                                     if (node.type === 'group') {
                                         (node as LayerGroup).children.forEach(child => {
                                             if (child.type !== 'group') {
                                                allItems.push(child as LayerItem);
                                             }
                                         });
                                     }
                                });
                                setLayers(allItems);
                                return newShowAll;
                            });
                        }}
                    >
                        {showAll ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Layer List */}
            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="p-1">
                    {/* Render top-level nodes from populatedLayerGroups */}
                    {populatedLayerGroups.map((layerNode) => (
                        <LayerItemComponent
                            key={layerNode.id}
                            layer={layerNode}
                            level={0}
                            onToggleVisibility={toggleVisibility}
                            onToggleExpanded={toggleExpanded}
                            expandedGroups={expandedGroups}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={onSelectLayer}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}