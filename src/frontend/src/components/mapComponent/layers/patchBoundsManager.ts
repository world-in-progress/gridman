import mapboxgl from 'mapbox-gl';
import { convertCoordinate } from '../../../core/util/coordinateUtils';
import { ProjectService } from '../../projectPanel/utils/ProjectService';

/**
 * Patch Bounds Manager
 * Used to display, hide, and highlight patch bounds on the map
 */
export class PatchBoundsManager {
    private map: mapboxgl.Map;
    private language: string;
    private currentHighlightedInfo: {
        projectName: string;
        patchName: string;
    } | null = null;

    constructor(map: mapboxgl.Map, language: string = 'zh') {
        this.map = map;
        this.language = language;
    }

    /**
     * Display or hide patch bounds
     * @param projectName Project name
     * @param patches Patch data array
     * @param show Whether to show
     */
    public showPatchBounds(
        projectName: string,
        patches: any[],
        show: boolean
    ): void {
        if (!this.map) return;

        try {
            const sourceId = `patch-bounds-${projectName}`;
            const layerId = `patch-fill-${projectName}`;
            const outlineLayerId = `patch-outline-${projectName}`;

            // 如果是隐藏操作,移除所有图层
            if (!show) {
                if (this.map.getLayer(outlineLayerId)) {
                    this.map.removeLayer(outlineLayerId);
                }
                if (this.map.getLayer(layerId)) {
                    this.map.removeLayer(layerId);
                }
                if (this.map.getSource(sourceId)) {
                    this.map.removeSource(sourceId);
                }
                return;
            }

            if (patches.length === 1 && this.map.getSource(sourceId)) {
                const source = this.map.getSource(
                    sourceId
                ) as mapboxgl.GeoJSONSource;
                const currentData = (source as any)._data;
                if (currentData && currentData.features) {
                    const updatedPatch = patches[0];
                    const updatedFeatures = currentData.features.map(
                        (feature: any) => {
                            if (feature.properties.name === updatedPatch.name) {
                                return {
                                    ...feature,
                                    properties: {
                                        ...feature.properties,
                                        starred: updatedPatch.starred,
                                    },
                                };
                            }
                            return feature;
                        }
                    );
                    source.setData({
                        type: 'FeatureCollection',
                        features: updatedFeatures,
                    });
                    return;
                }
            }

            // 准备子项目GeoJSON特性
            const features: GeoJSON.Feature[] = [];

            for (let index = 0; index < patches.length; index++) {
                const patch = patches[index];
                if (!patch.bounds || patch.bounds.length !== 4) continue;

                const sw = convertCoordinate(
                    [patch.bounds[0], patch.bounds[1]],
                    '2326',
                    '4326'
                );
                const ne = convertCoordinate(
                    [patch.bounds[2], patch.bounds[3]],
                    '2326',
                    '4326'
                );

                if (!sw || !ne || sw.length !== 2 || ne.length !== 2) continue;

                // 使用不同颜色区分不同子项目
                const hue = (index * 137.5) % 360; // 使用黄金角生成均匀分布的颜色
                const color = `hsl(${hue}, 70%, 60%)`;

                // 检查此子项目是否应该被高亮显示
                const isHighlighted =
                    this.currentHighlightedInfo &&
                    this.currentHighlightedInfo.projectName === projectName &&
                    this.currentHighlightedInfo.patchName === patch.name;

                // 添加边界多边形特性
                features.push({
                    type: 'Feature',
                    properties: {
                        name: patch.name,
                        color: color,
                        projectName: projectName,
                        starred: patch.starred || false,
                        description: patch.description || '',
                        highlighted: isHighlighted, // 设置高亮状态
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [sw[0], sw[1]], // 左下
                                [sw[0], ne[1]], // 左上
                                [ne[0], ne[1]], // 右上
                                [ne[0], sw[1]], // 右下
                                [sw[0], sw[1]], // 回到左下以闭合多边形
                            ],
                        ],
                    },
                } as GeoJSON.Feature);
            }

            // 添加数据源
            if (!this.map.getSource(sourceId)) {
                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features,
                    },
                });
            } else {
                const source = this.map.getSource(
                    sourceId
                ) as mapboxgl.GeoJSONSource;
                source.setData({
                    type: 'FeatureCollection',
                    features: features,
                });
            }

            // 确保按正确顺序添加图层
            // 1. 首先添加填充图层
            if (!this.map.getLayer(layerId)) {
                this.map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.3,
                    },
                });
            }

            // 2. 然后添加轮廓图层
            if (!this.map.getLayer(outlineLayerId)) {
                this.map.addLayer({
                    id: outlineLayerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': [
                            'case',
                            ['coalesce', ['get', 'highlighted'], false],
                            '#FFFFFF',
                            [
                                'case',
                                ['coalesce', ['get', 'starred'], false],
                                '#FFFD00',
                                ['get', 'color'],
                            ],
                        ],
                        'line-width': [
                            'case',
                            ['coalesce', ['get', 'highlighted'], false],
                            4,
                            2,
                        ],
                        'line-dasharray': [2, 1],
                    },
                });
            }
        } catch (error) {
            console.error('显示子项目边界失败:', error);
        }
    }

    /**
     * 高亮特定子项目
     * @param projectName 项目名称
     * @param patchName 子项目名称
     */
    public highlightPatch(projectName: string, patchName: string): void {
        if (!this.map) return;

        // 清除所有高亮状态
        this.clearAllHighlights();

        // 记录当前高亮的子项目信息
        this.currentHighlightedInfo = { projectName, patchName };

        const sourceId = `patch-bounds-${projectName}`;

        if (!this.map.getSource(sourceId)) return;

        try {
            // 获取当前数据
            const source = this.map.getSource(
                sourceId
            ) as mapboxgl.GeoJSONSource;
            const data = (source as any)._data;

            // 更新高亮状态
            if (data && data.features) {
                const updatedFeatures = data.features.map((feature: any) => {
                    const isTarget = feature.properties.name === patchName;
                    return {
                        ...feature,
                        properties: {
                            ...feature.properties,
                            highlighted: isTarget,
                        },
                    };
                });

                // 更新数据源
                source.setData({
                    type: 'FeatureCollection',
                    features: updatedFeatures,
                });
            }
        } catch (error) {
            console.error('高亮子项目失败:', error);
        }
    }

    /**
     * 清除所有高亮状态
     */
    private clearAllHighlights(): void {
        if (!this.map) return;

        // 重置当前高亮信息
        this.currentHighlightedInfo = null;

        // 获取所有的子项目边界数据源
        const style = this.map.getStyle();
        if (!style || !style.sources) return;

        for (const sourceId in style.sources) {
            if (sourceId.startsWith('patch-bounds-')) {
                try {
                    const source = this.map.getSource(
                        sourceId
                    ) as mapboxgl.GeoJSONSource;
                    if (!source) continue;

                    const data = (source as any)._data;
                    if (data && data.features && data.features.length > 0) {
                        // 清除所有特性的高亮状态
                        const updatedFeatures = data.features.map(
                            (feature: any) => ({
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    highlighted: false,
                                },
                            })
                        );

                        // 更新数据源
                        source.setData({
                            type: 'FeatureCollection',
                            features: updatedFeatures,
                        });
                    }
                } catch (error) {
                    console.error(`清除高亮状态失败: ${sourceId}`, error);
                }
            }
        }
    }

    /**
     * 飞行到子项目边界
     * @param projectName 项目名称
     * @param patchName 子项目名称
     */
    public async flyToPatchBounds(
        projectName: string,
        patchName: string
    ): Promise<void> {
        if (!this.map) return;

        try {
            // 从现有UI状态获取子项目数据
            // 使用已加载的子项目数据，通过名称匹配
            const sourceId = `patch-bounds-${projectName}`;
            if (this.map.getSource(sourceId)) {
                // 高亮子项目
                this.highlightPatch(projectName, patchName);

                // 尝试从地图数据源获取子项目边界
                const source = this.map.getSource(
                    sourceId
                ) as mapboxgl.GeoJSONSource;
                const data = (source as any)._data;

                if (data && data.features) {
                    const patchFeature = data.features.find(
                        (feature: any) => feature.properties.name === patchName
                    );

                    if (
                        patchFeature &&
                        patchFeature.geometry &&
                        patchFeature.geometry.coordinates &&
                        patchFeature.geometry.coordinates[0] &&
                        patchFeature.geometry.coordinates[0].length >= 5
                    ) {
                        // 从要素坐标中提取边界
                        const coords = patchFeature.geometry.coordinates[0];
                        const sw = coords[0]; // 左下
                        const ne = coords[2]; // 右上

                        // 创建边界
                        const bounds = [
                            [sw[0], sw[1]],
                            [ne[0], ne[1]],
                        ] as [[number, number], [number, number]];

                        // 计算中心点
                        const centerLng = (sw[0] + ne[0]) / 2;
                        const centerLat = (sw[1] + ne[1]) / 2;

                        // 飞到边界
                        this.map.fitBounds(bounds, {
                            padding: 50,
                            maxZoom: 19,
                            duration: 1000,
                        });

                        return;
                    }
                }
            }

            // If data retrieval from map fails, try to get patch data again
            const projectService = new ProjectService(this.language);
            // Get all patches under the specified project
            projectService.fetchPatches(projectName, (err, result) => {
                if (err) {
                    console.error('获取子项目数据失败:', err);
                } else if (result && Array.isArray(result.patch_metas)) {
                    const response = result;
                    const patch = response.patch_metas.find(
                        (sp: any) => sp.name === patchName
                    );
                    if (
                        patch &&
                        Array.isArray(patch.bounds) &&
                        patch.bounds.length === 4
                    ) {
                        // Prepare coordinates
                        const sw: [number, number] = [
                            patch.bounds[0],
                            patch.bounds[1],
                        ];
                        const ne: [number, number] = [
                            patch.bounds[2],
                            patch.bounds[3],
                        ];

                        // Convert coordinates
                        const swWGS84 = convertCoordinate(sw, '2326', '4326');
                        const neWGS84 = convertCoordinate(ne, '2326', '4326');

                        if (
                            Array.isArray(swWGS84) &&
                            Array.isArray(neWGS84) &&
                            swWGS84.length === 2 &&
                            neWGS84.length === 2
                        ) {
                            // Create bounds
                            const mapBounds = [
                                [swWGS84[0], swWGS84[1]],
                                [neWGS84[0], neWGS84[1]],
                            ] as [[number, number], [number, number]];

                            // Calculate center point
                            const centerLng = (swWGS84[0] + neWGS84[0]) / 2;
                            const centerLat = (swWGS84[1] + neWGS84[1]) / 2;

                            // Fly to bounds
                            this.map.fitBounds(mapBounds, {
                                padding: 50,
                                maxZoom: 19,
                                duration: 1000,
                            });

                            // If patch bounds are displayed at this time, reapply highlight
                            if (this.map.getSource(sourceId)) {
                                this.highlightPatch(projectName, patchName);
                            }

                            return;
                        }
                    }

                    console.warn('找不到子项目或边界不正确:', patchName);
                }
            });
        } catch (error) {
            console.error('飞行到子项目边界失败:', error);
        }
    }

    /**
     * 显示编辑边界
     * @param projectName 项目名称
     * @param patchName 子项目名称
     */
    public showEditBounds(
        projectName: string,
        patchBounds: number[],
        show: boolean
    ): void {
        if (!this.map) return;

        const sourceId = `patch-bounds-edit`;
        const outlineLayerId = `patch-outline-edit`;

        if (!show) {
            if (this.map.getLayer(outlineLayerId)) {
                this.map.removeLayer(outlineLayerId);
            }
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
            return;
        }

        const editBounds: GeoJSON.Feature[] = [];

        const sw = convertCoordinate(
            [patchBounds[0], patchBounds[1]],
            '2326',
            '4326'
        );
        const ne = convertCoordinate(
            [patchBounds[2], patchBounds[3]],
            '2326',
            '4326'
        );

        if (!sw || !ne || sw.length !== 2 || ne.length !== 2) return;
        
        editBounds.push({
            type: 'Feature',
            properties: {
                name: 'editBounds',
                projectName: projectName,
            },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [sw[0], sw[1]], 
                        [sw[0], ne[1]], 
                        [ne[0], ne[1]], 
                        [ne[0], sw[1]], 
                        [sw[0], sw[1]], 
                    ],
                ],
            },
        } as GeoJSON.Feature);


        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: editBounds,
                },
            });
        } else {
            const source = this.map.getSource(
                sourceId
            ) as mapboxgl.GeoJSONSource;
            source.setData({
                type: 'FeatureCollection',
                features: editBounds,
            });
        }

        if (!this.map.getLayer(outlineLayerId)) {
            this.map.addLayer({
                id: outlineLayerId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#FFFFFF',
                    'line-width': 4,
                    'line-dasharray': [2, 1],
                },
            })
        }
    }
}
