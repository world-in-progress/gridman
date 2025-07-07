import React, { useState, useRef, useEffect } from "react";
import {
    Star,
    FileType2,
    SquarePen,
    SplinePointer,
    Ellipsis,
    Grid,
    Mountain,
    Workflow,
} from "lucide-react";
import { PatchCardProps } from "../types/types";
import { ProjectService } from "../utils/ProjectService";
import { AnimatedCard, CardBackground, Blob } from "./cardBackground";
import store from "@/store";
import BoundsCard from "./boundsCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SchemaService } from "../../schemaPanel/utils/SchemaService";
import { PatchBoundsManager } from "@/components/mapComponent/layers/patchBoundsManager";
import { FeatureService } from "../../featurePanel/utils/FeatureService";

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
        mapRef?: React.RefObject<any>;
    }
}

export const PatchCard: React.FC<PatchCardProps> = ({
    isHighlighted,
    patch,
    parentProjectTitle,
    language,
    patchDescriptionText,
    onCardClick,
    onStarToggle,
    onSavePatchDescription,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [open, setOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardId = `patch-card-${patch.name.replace(/\s+/g, "-")}`;

    const setActivePanelFromStore = store.get<Function>("activePanelChange")!;
    const isLoading = store.get<{ on: Function; off: Function }>("isLoading")!;
    const updateCapacity = store.get<{ on: Function; off: Function }>(
        "updateCapacity"
    )!;
    const projectService = new ProjectService(language);
    const schemaService = new SchemaService(language);
    const featureService = new FeatureService(language);

    const onMenuOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleGridEditorClick = (e: React.MouseEvent) => {
        updateCapacity.on();
        e.stopPropagation();
        isLoading.on();

        store.set("ProjectName", parentProjectTitle);
        store.set("PatchName", patch.name);
        store.set("PatchBounds", patch.bounds);

        projectService.getProjectByName(parentProjectTitle, (err, result) => {
            store.set("SchemaName", result.project_meta.schema_name);
            if (store.get("SchemaName")) {
                const schemaName = store.get("SchemaName") as string;
                schemaService.getSchemaByName(schemaName, (err, result) => {
                    store.set("SchemaGridInfo", result.grid_schema.grid_info);
                });
            }
        });

        if (window.mapInstance && window.mapRef && window.mapRef.current) {
            const { flyToPatchBounds } = window.mapRef.current;
            if (flyToPatchBounds && typeof flyToPatchBounds === "function") {
                flyToPatchBounds(parentProjectTitle, patch.name).catch((error: any) => {
                    console.error(
                        language === "zh"
                            ? "飞行到补丁边界失败:"
                            : "Failed to fly to patch bounds:",
                        error
                    );
                });
            }
        }

        projectService.setPatch(parentProjectTitle, patch.name, () => {
            setActivePanelFromStore("grid");
        });
    };

    const handleRasterEditorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        isLoading.on();

        store.set("ProjectName", parentProjectTitle);
        store.set("PatchName", patch.name);
        store.set("PatchBounds", patch.bounds);

        projectService.getProjectByName(parentProjectTitle, (err, result) => {
            store.set("SchemaName", result.project_meta.schema_name);
            if (store.get("SchemaName")) {
                const schemaName = store.get("SchemaName") as string;
                schemaService.getSchemaByName(schemaName, (err, result) => {
                    store.set("SchemaGridInfo", result.grid_schema.grid_info);
                    store.set("CurrentPatchEPSG", result.grid_schema.epsg);
                    setActivePanelFromStore("raster");
                    handleDrawEditBounds();
                    isLoading.off();
                });
            }
        });
    };

    const handleFeatureEditorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        isLoading.on();

        store.set("ProjectName", parentProjectTitle);
        store.set("PatchName", patch.name);
        store.set("PatchBounds", patch.bounds);

        projectService.getProjectByName(parentProjectTitle, (err, result) => {
            store.set("SchemaName", result.project_meta.schema_name);
            if (store.get("SchemaName")) {
                const schemaName = store.get("SchemaName") as string;
                schemaService.getSchemaByName(schemaName, (err, result) => {
                    store.set("SchemaGridInfo", result.grid_schema.grid_info);
                    store.set("CurrentPatchEPSG", result.grid_schema.epsg);
                    setActivePanelFromStore("feature");
                    handleDrawEditBounds();
                    isLoading.off();
                });
            }
        });

        featureService.setFeature(parentProjectTitle, patch.name, () => {
            setActivePanelFromStore("feature");
            isLoading.off();
        });
    };

    const handleAggregationWorkflowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        isLoading.on();

        store.set("ProjectName", parentProjectTitle);
        store.set("PatchName", patch.name);

        projectService.getProjectByName(parentProjectTitle, (err, result) => {
            store.set("SchemaName", result.project_meta.schema_name);
            if (store.get("SchemaName")) {
                const schemaName = store.get("SchemaName") as string;
                schemaService.getSchemaByName(schemaName, (err, result) => {
                    store.set("SchemaGridInfo", result.grid_schema.grid_info);
                    store.set("CurrentPatchEPSG", result.grid_schema.epsg);
                    setActivePanelFromStore("aggregation");
                    isLoading.off();
                });
            }
        });
    };

    const handleDrawEditBounds = () => {
        if (!patch.bounds || patch.bounds.length !== 4) {
            return;
        }

        if (window.mapRef && window.mapRef.current) {
            const { showEditBounds, flyToPatchBounds } = window.mapRef.current;
            flyToPatchBounds(parentProjectTitle, patch.name);
            showEditBounds(parentProjectTitle, patch.bounds, true);
        }
    };

    const menuItems = [
        {
            title: language === "zh" ? "网格编辑" : "Grid Editor",
            icon: <Grid className="h-4 w-4 mr-2" />,
            onClick: handleGridEditorClick,
        },
        {
            title: language === "zh" ? "要素资源编辑" : "Feature Resoure Editor",
            icon: <SplinePointer className="h-4 w-4 mr-2" />,
            onClick: handleFeatureEditorClick,
        },
        {
            title: language === "zh" ? "栅格资源编辑" : "Raster Resource Editor",
            icon: <Mountain className="h-4 w-4 mr-2" />,
            onClick: handleRasterEditorClick,
        },
        {
            title: language === "zh" ? "聚合工作流" : "Aggregation Workflow",
            icon: <Workflow className="h-4 w-4 mr-2" />,
            onClick: handleAggregationWorkflowClick,
        },
    ];

    const handleCardClick = (e: React.MouseEvent) => {
        onCardClick();
        e.stopPropagation();
        if (window.mapInstance && window.mapRef && window.mapRef.current) {
            const { flyToPatchBounds } = window.mapRef.current;
            if (flyToPatchBounds && typeof flyToPatchBounds === "function") {
                flyToPatchBounds(parentProjectTitle, patch.name);
            }
        }
    };

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStarToggle) {
            onStarToggle(patch.name, !patch.starred);
            if (window.mapRef && window.mapRef.current) {
                const { showPatchBounds } = window.mapRef.current;
                if (showPatchBounds && typeof showPatchBounds === "function") {
                    const updatedPatch = {
                        ...patch,
                        starred: !patch.starred,
                    };
                    showPatchBounds(parentProjectTitle, [updatedPatch], true);
                }
            }
        }
    };

    const handleUpdateDescription = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!textareaRef.current) return;

        const newDescription = textareaRef.current.value;

        if (onSavePatchDescription) {
            await onSavePatchDescription(patch.name, newDescription);
            if (window.mapRef && window.mapRef.current) {
                const { showPatchBounds } = window.mapRef.current;
                if (showPatchBounds && typeof showPatchBounds === "function") {
                    const updatedPatch = {
                        ...patch,
                        description: newDescription,
                    };
                    showPatchBounds(parentProjectTitle, [updatedPatch], true);
                }
            }
        }

        setIsEditing(false);
    };

    const PatchCardContent = () => (
        <div
            className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex items-center justify-between">
                <div className="font-bold text-black text-md">{patch.name}</div>
                <div className="flex items-center justify-end gap-2">
                    <button
                        className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                        aria-label={language === "zh" ? "标星" : "Star"}
                        title={language === "zh" ? "标星" : "Star"}
                        onClick={handleStarClick}
                    >
                        <Star
                            className={`h-4 w-4 ${patch.starred ? "fill-yellow-400 text-yellow-400" : ""
                                } cursor-pointer`}
                        />
                    </button>
                    <DropdownMenu open={open} onOpenChange={onMenuOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-6 w-6 rounded-md hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                                aria-label={language === "zh" ? "更多" : "More"}
                                title={language === "zh" ? "更多" : "More"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <Ellipsis className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="right"
                            align="start"
                            alignOffset={40}
                            className="w-52"
                            sideOffset={-10}
                        >
                            {menuItems.map((subItem, index) => (
                                <React.Fragment key={subItem.title}>
                                    <DropdownMenuItem asChild>
                                        <a
                                            className="cursor-pointer flex items-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMenuOpenChange(false);
                                                subItem.onClick && subItem.onClick(e);
                                            }}
                                        >
                                            <span className="flex items-center">
                                                {subItem.icon}
                                                {subItem.title}
                                            </span>
                                        </a>
                                    </DropdownMenuItem>
                                    {index < menuItems.length - 1 && <DropdownMenuSeparator />}
                                </React.Fragment>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {patch.bounds && patch.bounds.length === 4 && (
                <div className=" border-gray-200">
                    <BoundsCard bounds={patch.bounds} language={language} />
                </div>
            )}

            <div className="text-gray-600 mt-2 border-t border-gray-200 mb-1">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                        <FileType2 className="h-4 w-4 mr-1" />
                        <h3 className="text-xs font-bold">
                            {language === "zh" ? "描述" : "Description"}
                        </h3>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                        }}
                        className="hover:bg-gray-200 cursor-pointer p-1 rounded"
                        aria-label={language === "zh" ? "编辑描述" : "Edit description"}
                        title={language === "zh" ? "编辑描述" : "Edit description"}
                    >
                        <SquarePen className="h-4 w-4" />
                    </button>
                </div>

                {!isEditing && (
                    <div className="text-xs text-gray-600 mb-2 px-1">
                        {patch.description ? (
                            patch.description
                        ) : (
                            <span className="italic">
                                {language === "zh" ? "无描述" : "No description provided."}
                            </span>
                        )}
                    </div>
                )}

                {isEditing && (
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            id="schema-description"
                            className="w-full px-3 py-2 border border-gray-300  rounded-md min-h-[80px]"
                            aria-label={language === "zh" ? "补丁描述" : "Patch description"}
                            placeholder={
                                language === "zh" ? "输入补丁描述" : "Enter patch description"
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            defaultValue={
                                (patchDescriptionText && patchDescriptionText[patch.name]) ||
                                patch?.description ||
                                ""
                            }
                        />
                        <div className="absolute bottom-3 right-5 flex space-x-2">
                            <button
                                className="px-2 py-0.5 text-xs bg-gray-200  rounded-md hover:bg-gray-300 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel();
                                }}
                            >
                                {language === "zh" ? "取消" : "Cancel"}
                            </button>
                            <button
                                className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateDescription(e);
                                }}
                            >
                                {language === "zh" ? "完成" : "Done"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (isHighlighted) {
        return (
            <AnimatedCard className="p-3 mt-2 mb-4" id={cardId}>
                <CardBackground />
                <Blob />
                <div className="relative z-10 border border-gray-200 rounded-lg">
                    <PatchCardContent />
                </div>
            </AnimatedCard>
        );
    } else {
        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-2 border border-gray-200 relative transition-all duration-300 cursor-pointer"
                onClick={onCardClick}
                id={cardId}
            >
                <PatchCardContent />
            </div>
        );
    }
};

export default PatchCard;
