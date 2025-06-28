import { useContext, useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/utils";
import type {
    LayerItem,
    LayerGroup,
    LayerListProps,
    LayerItemComponentProps,
    LayerNode,
} from "../types/types";
import { LanguageContext } from "@/context";

// Define the fixed layer groups
export const layerGroups: LayerGroup[] = [
    {
        id: "Edited",
        name: "Edited",
        type: "group",
        visible: true,
        icon: <PencilRuler className="h-4 w-4" />,
        children: [],
    },
    {
        id: "Editing",
        name: "Editing",
        type: "group",
        visible: true,
        icon: <Pencil className="h-4 w-4" />,
        children: [],
    },
    {
        id: "Feature",
        name: "Feature",
        type: "group",
        visible: true,
        icon: <Layers className="h-4 w-4" />,
        children: [],
    },
];

const groupNameMap: { [key: string]: { zh: string; en: string } } = {
    Edited: { zh: "已编辑", en: "Edited" },
    Editing: { zh: "未编辑", en: "Editing" },
    Feature: { zh: "要素", en: "Feature" },
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
    onDeleteLayer,
    onPropertiesChange,
}: LayerItemComponentProps) {
    const { language } = useContext(LanguageContext);
    const isExpanded = expandedGroups.has(layer.id);
    const isSelected = selectedLayerId === layer.id;
    const hasChildren =
        layer.type === "group" &&
        (layer as LayerGroup).children &&
        (layer as LayerGroup).children.length > 0;

    const getSymbologyColor = (symbology?: string) => {
        switch (symbology) {
            case "red-fill":
                return "bg-red-500";
            case "blue-fill":
                return "bg-blue-500";
            case "green-fill":
                return "bg-green-500";
            case "gray-fill":
                return "bg-gray-500";
            case "brown-lines":
                return "bg-amber-700";
            case "yellow-fill":
                return "bg-yellow-500";
            case "purple-fill":
                return "bg-purple-500";
            case "orange-fill":
                return "bg-orange-500";
            default:
                return "bg-gray-300";
        }
    };

    const onEditLayerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(language === "zh" ? "点击了编辑图层" : "Edit Layer clicked");
        onSelectLayer(layer.id);
    };

    const handleLayerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (layer.type === "group") {
            onToggleExpanded(layer.id);
        } else {
            if (isSelected) {
                onSelectLayer(null);
            } else {
                onSelectLayer(layer.id);
            }
        }
    };

    const onDeleteLayerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(language === "zh" ? "点击了删除图层" : "Delete Layer clicked");
        onDeleteLayer(layer.id);
    };

    const onPropertiesClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(language === "zh" ? "点击了属性" : "Properties clicked");
        setTimeout(() => {
            onPropertiesChange(layer.id);
        }, 100);
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-1 rounded-md py-1 px-2 hover:bg-gray-100 group cursor-pointer",
                    level > 0 && "ml-4",
                    isSelected && "bg-gray-200 hover:bg-gray-200"
                )}
                style={{ paddingLeft: `${level * 8}px` }}
                onClick={handleLayerClick}
            >
                {/* Expand/Collapse Button */}
                {isExpanded ? (
                    <ChevronDown className="ml-1 h-3 w-3" />
                ) : (
                    <ChevronRight className="ml-1 h-3 w-3" />
                )}

                {/* Visibility Checkbox */}
                <Checkbox
                    checked={layer.visible}
                    onCheckedChange={() => onToggleVisibility(layer.id)}
                    className="h-4 w-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Layer Icon */}
                <div className="flex-shrink-0">{layer.icon}</div>

                {/* Layer Name */}
                <span
                    className={cn(
                        "flex-1 text-sm truncate",
                        layer.type === "group" && "font-medium"
                    )}
                >
                    {layer.type === "group"
                        ? groupNameMap[layer.id]?.[language] || layer.name
                        : layer.name}
                </span>

                {/* Symbology Preview */}
                {layer.type !== "group" && (layer as LayerItem).symbology && (
                    <div
                        className={cn(
                            "w-4 h-3 rounded-sm border border-gray-300",
                            getSymbologyColor((layer as LayerItem).symbology)
                        )}
                    />
                )}

                {/* Context Menu */}
                {layer.type !== "group" && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-gray-200"
                                onClick={(e) => e.stopPropagation()}
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
                                <MapPin className="h-4 w-4 mr-2" />
                                {language === "zh" ? "缩放到图层" : "Zoom to Layer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onPropertiesClick}>
                                <Layers className="h-4 w-4 mr-2" />
                                {language === "zh" ? "属性" : "Properties"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDeleteLayerClick}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === "zh" ? "删除图层" : "Remove Layer"}
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
                            onDeleteLayer={onDeleteLayer}
                            onPropertiesChange={onPropertiesChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LayerList({
    layers,
    setLayers,
    selectedLayerId,
    onSelectLayer,
    onDeleteLayer,
    onPropertiesChange,
    getIconComponent,
}: LayerListProps) {
    const [showAll, setShowAll] = useState(true);
    const { language } = useContext(LanguageContext);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(layerGroups.map((group) => group.id))
    );

    // Assign layers to their respective groups
    // Add state for populatedLayerGroups
    const [populatedLayerGroups, setPopulatedLayerGroups] = useState<
        LayerGroup[]
    >(() => {
        return layerGroups.map((group) => {
            const children = layers.filter(
                (node) =>
                    node.type !== "group" && (node as LayerItem).group === group.id
            );
            return {
                ...group,
                children: children as LayerNode[],
            };
        });
    });

    // Update populatedLayerGroups when layers change
    useEffect(() => {
        setPopulatedLayerGroups((prevGroups) => {
            return prevGroups.map((group) => {
                // Keep the group structure and properties
                const updatedGroup = { ...group };

                // Get all layers that belong to this group
                const groupLayers = layers.filter(
                    (layer) =>
                        layer.type !== "group" && (layer as LayerItem).group === group.id
                );

                // Create a map of existing children by id for quick lookup
                const existingChildrenMap = new Map(
                    group.children.map((child) => [child.id, child])
                );

                // update group and properties
                updatedGroup.children = groupLayers.map((layer) => {
                    const existingChild = existingChildrenMap.get(layer.id);
                    if (existingChild) {
                        // If the layer exists in children, keep it as is
                        return {
                            ...existingChild,
                            name: layer.name,
                            icon: getIconComponent(layer.icon as string),
                            symbology: (layer as LayerItem).symbology,
                        };
                    } else {
                        // If it's a new layer, add it to children
                        return {
                            ...layer,
                            group: group.id,
                            name: layer.name,
                            icon: getIconComponent(layer.icon as string),
                            symbology: (layer as LayerItem).symbology,
                        };
                    }
                });

                return updatedGroup;
            });
        });
    }, [layers]);

    const updateGroupVisibility = (
        group: LayerGroup,
        newVisible: boolean
    ): LayerGroup => {
        if (group.id === "Edited") {
            const map = window.mapInstance;
            if (!map) return group;

            group.children.forEach((child) => {
                const layer = map.getLayer(child.id);
                if (layer) {
                    const visibility = newVisible ? "visible" : "none";
                    map.setLayoutProperty(child.id, "visibility", visibility);
                }
            });
        }

        return {
            ...group,
            visible: newVisible,
            children: group.children.map((child) => {
                child.visible = newVisible;
                return child;
            }),
        };
    };

    // Toggle visibility of a layer group or layer item
    const toggleVisibility = (id: string) => {
        console.log(id);
        const updateNodes = (nodes: LayerItem[]): LayerNode[] => {
            return nodes.map((node) => {
                if (node.id === id) {
                    const newVisible = !node.visible;

                    if (node.group === "Edited") {
                        const map = window.mapInstance;
                        if (!map) return node;
                        const layer = map.getLayer(node.id);
                        if (layer) {
                            const visibility = newVisible ? "visible" : "none";
                            map.setLayoutProperty(node.id, "visibility", visibility);
                        }
                    }

                    return { ...node, visible: newVisible };
                }
                return node;
            });
        };

        setPopulatedLayerGroups((prevLayers) => {
            const updatedPopulatedGroups = populatedLayerGroups.map((group) => {
                if (group.id === id) {
                    return updateGroupVisibility(group, !group.visible);
                }
                const updatedChildren = updateNodes(group.children as LayerItem[]);
                return { ...group, children: updatedChildren } as LayerGroup;
            });
            return updatedPopulatedGroups;
        });
    };

    const toggleExpanded = (id: string) => {
        setExpandedGroups((prevExpanded) => {
            const newExpanded = new Set(prevExpanded);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return newExpanded;
        });
    };

    const setAllVisible = (visible: boolean) => {
        setPopulatedLayerGroups((prevGroups) => {
            return prevGroups.map((group) => updateGroupVisibility(group, visible));
        });

        // Update layers to match the new visibility state
        setLayers((prevLayers) => {
            return prevLayers.map((layer) => ({
                ...layer,
                visible: visible,
            }));
        });
    };

    return (
        <div className="w-full min-h-[480px] mb-2 border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b rounded-t-md bg-gray-50">
                <h3 className="font-semibold text-lg">
                    {language === "zh" ? "要素图层列表" : "Feature Layer List"}
                </h3>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 cursor-pointer"
                        title={language === "zh" ? "切换全部显示" : "Switch all displays"}
                        onClick={() => {
                            setShowAll((prev) => {
                                const newShowAll = !prev;
                                setAllVisible(newShowAll);
                                return newShowAll;
                            });
                        }}
                    >
                        {showAll ? (
                            <Eye className="h-6 w-6" />
                        ) : (
                            <EyeOff className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Layer List */}
            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="p-1">
                    {/* Render top-level nodes from populatedLayerGroups */}
                    {populatedLayerGroups.map((layerGroup) => (
                        <LayerItemComponent
                            key={layerGroup.id}
                            layer={layerGroup}
                            level={0}
                            onToggleVisibility={toggleVisibility}
                            onToggleExpanded={toggleExpanded}
                            expandedGroups={expandedGroups}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={onSelectLayer}
                            onDeleteLayer={onDeleteLayer}
                            onPropertiesChange={onPropertiesChange}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
