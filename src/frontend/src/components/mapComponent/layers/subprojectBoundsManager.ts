import mapboxgl from 'mapbox-gl';
import { convertCoordinate } from '../../../core/util/coordinateUtils';
import { ProjectService } from '../../projectPanel/utils/ProjectService';

/**
 * Subproject Bounds Manager
 * Used to display, hide, and highlight subproject bounds on the map
 */
export class SubprojectBoundsManager {
    private map: mapboxgl.Map;
    private language: string;
    private currentHighlightedInfo: {
        projectName: string;
        subprojectName: string;
    } | null = null;

    constructor(map: mapboxgl.Map, language: string = 'zh') {
        this.map = map;
        this.language = language;
    }

    /**
     * Display or hide subproject bounds
     * @param projectName Project name
     * @param subprojects Subproject data array
     * @param show Whether to show
     */
    public showSubprojectBounds(
        projectName: string,
        subprojects: any[],
        show: boolean
    ): void {
        if (!this.map) return;

        try {
            const sourceId = `subproject-bounds-${projectName}`;
            const layerId = `subproject-fill-${projectName}`;
            const outlineLayerId = `subproject-outline-${projectName}`;

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

            if (subprojects.length === 1 && this.map.getSource(sourceId)) {
                const source = this.map.getSource(
                    sourceId
                ) as mapboxgl.GeoJSONSource;
                const currentData = (source as any)._data;
                if (currentData && currentData.features) {
                    const updatedSubproject = subprojects[0];
                    const updatedFeatures = currentData.features.map(
                        (feature: any) => {
                            if (
                                feature.properties.name ===
                                updatedSubproject.name
                            ) {
                                return {
                                    ...feature,
                                    properties: {
                                        ...feature.properties,
                                        starred: updatedSubproject.starred,
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

            for (let index = 0; index < subprojects.length; index++) {
                const subproject = subprojects[index];
                if (!subproject.bounds || subproject.bounds.length !== 4)
                    continue;

                const sw = convertCoordinate(
                    [subproject.bounds[0], subproject.bounds[1]],
                    '2326',
                    '4326'
                );
                const ne = convertCoordinate(
                    [subproject.bounds[2], subproject.bounds[3]],
                    '2326',
                    '4326'
                );

                if (!sw || !ne || sw.length !== 2 || ne.length !== 2) continue;

                // 使用不同颜色区分不同子项目
                const hue = (index * 137.5) % 360; // 使用黄金角生成均匀分布的颜色
                const color = `hsl(${hue}, 70%, 60%)`;

                // 计算中心点
                const centerLng = (sw[0] + ne[0]) / 2;
                const centerLat = (sw[1] + ne[1]) / 2;

                // 检查此子项目是否应该被高亮显示
                const isHighlighted =
                    this.currentHighlightedInfo &&
                    this.currentHighlightedInfo.projectName === projectName &&
                    this.currentHighlightedInfo.subprojectName ===
                        subproject.name;

                // 添加边界多边形特性
                features.push({
                    type: 'Feature',
                    properties: {
                        name: subproject.name,
                        color: color,
                        projectName: projectName,
                        starred: subproject.starred || false,
                        description: subproject.description || '',
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
                            ['get', 'highlighted'],
                            '#FFFFFF',
                            [
                                'case',
                                ['get', 'starred'],
                                '#FFFD00',
                                ['get', 'color'],
                            ],
                        ],
                        'line-width': ['case', ['get', 'highlighted'], 4, 2],
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
     * @param subprojectName 子项目名称
     */
    public highlightSubproject(
        projectName: string,
        subprojectName: string
    ): void {
        if (!this.map) return;

        // 清除所有高亮状态
        this.clearAllHighlights();

        // 记录当前高亮的子项目信息
        this.currentHighlightedInfo = { projectName, subprojectName };

        const sourceId = `subproject-bounds-${projectName}`;

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
                    const isTarget = feature.properties.name === subprojectName;
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
            if (sourceId.startsWith('subproject-bounds-')) {
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
     * @param subprojectName 子项目名称
     */
    public async flyToSubprojectBounds(
        projectName: string,
        subprojectName: string
    ): Promise<void> {
        if (!this.map) return;

        try {
            // 从现有UI状态获取子项目数据
            // 使用已加载的子项目数据，通过名称匹配
            const sourceId = `subproject-bounds-${projectName}`;
            if (this.map.getSource(sourceId)) {
                // 高亮子项目
                this.highlightSubproject(projectName, subprojectName);

                // 尝试从地图数据源获取子项目边界
                const source = this.map.getSource(
                    sourceId
                ) as mapboxgl.GeoJSONSource;
                const data = (source as any)._data;

                if (data && data.features) {
                    const subprojectFeature = data.features.find(
                        (feature: any) =>
                            feature.properties.name === subprojectName
                    );

                    if (
                        subprojectFeature &&
                        subprojectFeature.geometry &&
                        subprojectFeature.geometry.coordinates &&
                        subprojectFeature.geometry.coordinates[0] &&
                        subprojectFeature.geometry.coordinates[0].length >= 5
                    ) {
                        // 从要素坐标中提取边界
                        const coords =
                            subprojectFeature.geometry.coordinates[0];
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

                        // 在边界中心创建弹窗显示信息
                        setTimeout(() => {
                            this.showSubprojectPopup(
                                subprojectFeature.properties,
                                [centerLng, centerLat]
                            );
                        }, 300);

                        return;
                    }
                }
            }

            // If data retrieval from map fails, try to get subproject data again
            const projectService = new ProjectService(this.language);
            // Get all subprojects under the specified project
            projectService.fetchSubprojects(projectName, (err, result) => {
                if (err) {
                    console.error('获取子项目数据失败:', err);
                } else if (result && Array.isArray(result.subproject_metas)) {
                    const response = result;
                    const subproject = response.subproject_metas.find(
                        (sp: any) => sp.name === subprojectName
                    );
                    if (
                        subproject &&
                        Array.isArray(subproject.bounds) &&
                        subproject.bounds.length === 4
                    ) {
                        // Prepare coordinates
                        const sw: [number, number] = [
                            subproject.bounds[0],
                            subproject.bounds[1],
                        ];
                        const ne: [number, number] = [
                            subproject.bounds[2],
                            subproject.bounds[3],
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

                            // Create popup at center of bounds
                            setTimeout(() => {
                                this.showSubprojectPopup(
                                    {
                                        name: subproject.name,
                                        projectName: projectName,
                                        starred: subproject.starred || false,
                                    },
                                    [centerLng, centerLat]
                                );
                            }, 1000); // Display after fly animation

                            // If subproject bounds are displayed at this time, reapply highlight
                            if (this.map.getSource(sourceId)) {
                                this.highlightSubproject(
                                    projectName,
                                    subprojectName
                                );
                            }

                            return;
                        }
                    }

                    console.warn('找不到子项目或边界不正确:', subprojectName);
                }
            });
        } catch (error) {
            console.error('飞行到子项目边界失败:', error);
        }
    }

    /**
     * Display the popup information of the subproject
     * @param properties Subproject properties
     * @param center Popup position coordinates
     */
    private showSubprojectPopup(
        properties: any,
        center: [number, number]
    ): void {
        if (!this.map) return;

        // Remove existing popups
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach((popup) => popup.remove());

        // Create new popup
        new mapboxgl.Popup({
            closeOnClick: true,
            maxWidth: '300px',
        })
            .setLngLat(center)
            .setHTML(
                `
                <div style="font-family: Arial, sans-serif; padding: 10px;">
                    <h3 style="margin: 0 0 8px; font-weight: bold; color: #333;">${
                        properties.name
                    }</h3>

                    <div style="display: flex flex-column; align-items: center; margin-top: 8px;">
                        <span style="font-size: 12px; color: #888;">
                            ${this.language === 'zh' ? '所属项目' : 'Project'}: 
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: #444; margin-left: 4px;">
                            ${properties.projectName}
                        </span>
                        ${
                            properties.starred
                                ? `<span style="margin-left: 8px; color: #f0c14b;">★</span>`
                                : ''
                        }
                    </div>
                </div>
            `
            )
            .addTo(this.map);
    }
}
