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
    public showSubprojectBounds(projectName: string, subprojects: any[], show: boolean): void {
        if (!this.map) return;
        
        try {
            const sourceId = `subproject-bounds-${projectName}`;
            const layerId = `subproject-fill-${projectName}`;
            const outlineLayerId = `subproject-outline-${projectName}`;
            const labelLayerId = `subproject-label-${projectName}`;
            const labelSourceId = `subproject-label-source-${projectName}`;
            
            // Remove existing layers and data sources (if they exist)
            if (this.map.getLayer(labelLayerId)) {
                this.map.removeLayer(labelLayerId);
            }
            
            if (this.map.getLayer(outlineLayerId)) {
                this.map.removeLayer(outlineLayerId);
            }
            
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
            
            if (this.map.getSource(labelSourceId)) {
                this.map.removeSource(labelSourceId);
            }
            
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
            
            // If not needed to show or no subprojects, return directly
            if (!show || !subprojects || subprojects.length === 0) {
                return;
            }
            
            // Prepare subproject GeoJSON features
            const features: GeoJSON.Feature[] = [];
            const labelFeatures: GeoJSON.Feature[] = [];
            
            for (let index = 0; index < subprojects.length; index++) {
                const subproject = subprojects[index];
                if (!subproject.bounds || subproject.bounds.length !== 4) continue;
                
                const sw = convertCoordinate([subproject.bounds[0], subproject.bounds[1]], '2326', '4326');
                const ne = convertCoordinate([subproject.bounds[2], subproject.bounds[3]], '2326', '4326');
                
                if (!sw || !ne || sw.length !== 2 || ne.length !== 2) continue;
                
                // Use different colors to distinguish different subprojects
                const hue = (index * 137.5) % 360; // Use golden angle to generate evenly distributed colors
                const color = `hsl(${hue}, 70%, 60%)`;
                
                // Calculate center point
                const centerLng = (sw[0] + ne[0]) / 2;
                const centerLat = (sw[1] + ne[1]) / 2;
                
                // Add boundary polygon feature
                features.push({
                    type: 'Feature',
                    properties: {
                        name: subproject.name,
                        color: color,
                        projectName: projectName,
                        starred: subproject.starred || false,
                        description: subproject.description || ''
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [sw[0], sw[1]], // Bottom left
                            [sw[0], ne[1]], // Top left
                            [ne[0], ne[1]], // Top right
                            [ne[0], sw[1]], // Bottom right
                            [sw[0], sw[1]]  // Back to bottom left to close the polygon
                        ]]
                    }
                } as GeoJSON.Feature);
                
                // Add center point feature for label
                labelFeatures.push({
                    type: 'Feature',
                    properties: {
                        name: subproject.name,
                        projectName: projectName,
                        starred: subproject.starred || false
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [centerLng, centerLat]
                    }
                } as GeoJSON.Feature);
            }
            
            // Add data source
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });
            
            // Add label data source
            this.map.addSource(labelSourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: labelFeatures
                }
            });
            
            // Add fill layer
            this.map.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.3
                }
            });
            
            // Add outline layer
            this.map.addLayer({
                id: outlineLayerId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': [
                        'case',
                        ['get', 'starred'], '#FFFD00',  // The starred subproject is yellow
                        ['get', 'color']  // The other subproject is the corresponding color
                    ],
                    'line-width': 2,
                    'line-dasharray': [2, 1]  // Use dashed line style to distinguish from project boundary
                }
            });
            
        } catch (error) {
            console.error('显示子项目边界失败:', error);
        }
    }

    /**
     * Highlight a specific subproject
     * @param projectName Project name
     * @param subprojectName Subproject name
     */
    public highlightSubproject(projectName: string, subprojectName: string): void {
        if (!this.map) return;
        
        const sourceId = `subproject-bounds-${projectName}`;
        
        if (!this.map.getSource(sourceId)) return;
        
        try {
            // Get current data
            const source = this.map.getSource(sourceId) as mapboxgl.GeoJSONSource;
            const data = (source as any)._data;
            
            // Update highlighted status
            if (data && data.features) {
                const updatedFeatures = data.features.map((feature: any) => {
                    if (feature.properties.name === subprojectName) {
                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                highlighted: true
                            }
                        };
                    } else {
                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                highlighted: false
                            }
                        };
                    }
                });
                
                // Update data source
                source.setData({
                    type: 'FeatureCollection',
                    features: updatedFeatures
                });
                
                // Update layer style to display highlighted effect
                const outlineLayerId = `subproject-outline-${projectName}`;
                if (this.map.getLayer(outlineLayerId)) {
                    this.map.setPaintProperty(outlineLayerId, 'line-width', [
                        'case',
                        ['get', 'highlighted'], 4,  // The highlighted outline is thicker
                        2  // Default outline
                    ]);
                    
                    this.map.setPaintProperty(outlineLayerId, 'line-color', [
                        'case',
                        ['get', 'highlighted'], '#FFFFFF',  // The highlighted outline is white
                        ['case',
                            ['get', 'starred'], '#FFFD00',  // The starred outline is yellow
                            ['get', 'color']  // The other outline is the corresponding color
                        ]
                    ]);
                }
            }
        } catch (error) {
            console.error('高亮子项目失败:', error);
        }
    }

    /**
     * 飞行到子项目边界
     * @param projectName 项目名称
     * @param subprojectName 子项目名称
     */
    public async flyToSubprojectBounds(projectName: string, subprojectName: string): Promise<void> {
        if (!this.map) return;

        try {
            // 从现有UI状态获取子项目数据
            // 使用已加载的子项目数据，通过名称匹配
            const sourceId = `subproject-bounds-${projectName}`;
            if (this.map.getSource(sourceId)) {
                // 高亮子项目
                this.highlightSubproject(projectName, subprojectName);
                
                // 尝试从地图数据源获取子项目边界
                const source = this.map.getSource(sourceId) as mapboxgl.GeoJSONSource;
                const data = (source as any)._data;
                
                if (data && data.features) {
                    const subprojectFeature = data.features.find(
                        (feature: any) => feature.properties.name === subprojectName
                    );
                    
                    if (subprojectFeature && subprojectFeature.geometry && 
                        subprojectFeature.geometry.coordinates && 
                        subprojectFeature.geometry.coordinates[0] && 
                        subprojectFeature.geometry.coordinates[0].length >= 5) {
                        
                        // 从要素坐标中提取边界
                        const coords = subprojectFeature.geometry.coordinates[0];
                        const sw = coords[0]; // 左下
                        const ne = coords[2]; // 右上
                        
                        // 创建边界
                        const bounds = [
                            [sw[0], sw[1]],
                            [ne[0], ne[1]]
                        ] as [[number, number], [number, number]];
                        
                        // 计算中心点
                        const centerLng = (sw[0] + ne[0]) / 2;
                        const centerLat = (sw[1] + ne[1]) / 2;
                        
                        // 飞到边界
                        this.map.fitBounds(bounds, {
                            padding: 50,
                            maxZoom: 19,
                            duration: 1000
                        });
                        
                        // 在边界中心创建弹窗显示信息
                        setTimeout(() => {
                            this.showSubprojectPopup(
                                subprojectFeature.properties, 
                                [centerLng, centerLat]
                            );
                        }, 1000); // 等飞行动画结束后显示
                        
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
                        if (subproject && Array.isArray(subproject.bounds) && subproject.bounds.length === 4) {
                            // Prepare coordinates
                            const sw: [number, number] = [subproject.bounds[0], subproject.bounds[1]];
                            const ne: [number, number] = [subproject.bounds[2], subproject.bounds[3]];
                            
                            // Convert coordinates
                            const swWGS84 = convertCoordinate(sw, '2326', '4326');
                            const neWGS84 = convertCoordinate(ne, '2326', '4326');
                            
                            if (Array.isArray(swWGS84) && Array.isArray(neWGS84) && 
                                swWGS84.length === 2 && neWGS84.length === 2) {
                                
                                // Create bounds
                                const mapBounds = [
                                    [swWGS84[0], swWGS84[1]],
                                    [neWGS84[0], neWGS84[1]]
                                ] as [[number, number], [number, number]];
                                
                                // Calculate center point
                                const centerLng = (swWGS84[0] + neWGS84[0]) / 2;
                                const centerLat = (swWGS84[1] + neWGS84[1]) / 2;
                                
                                // Fly to bounds
                                this.map.fitBounds(mapBounds, {
                                    padding: 50,
                                    maxZoom: 19,
                                    duration: 1000
                                });
                                
                                // Create popup at center of bounds
                                setTimeout(() => {
                                    this.showSubprojectPopup(
                                        {
                                            name: subproject.name,
                                            description: subproject.description || '',
                                            projectName: projectName,
                                            starred: subproject.starred || false
                                        }, 
                                        [centerLng, centerLat]
                                    );
                                }, 1000); // Display after fly animation
                                
                                // If subproject bounds are displayed at this time, reapply highlight
                                if (this.map.getSource(sourceId)) {
                                    this.highlightSubproject(projectName, subprojectName);
                                }
                                
                                return;
                            }
                        }
                        
                        console.warn('找不到子项目或边界不正确:', subprojectName);
                    }
                });
                
                // if (response && Array.isArray(response.subproject_metas)) {
                //     // Find matching subproject
                //     const subproject = response.subproject_metas.find(
                //         (sp: any) => sp.name === subprojectName
                //     );
                    
                //     if (subproject && Array.isArray(subproject.bounds) && subproject.bounds.length === 4) {
                //         // Prepare coordinates
                //         const sw: [number, number] = [subproject.bounds[0], subproject.bounds[1]];
                //         const ne: [number, number] = [subproject.bounds[2], subproject.bounds[3]];
                        
                //         // Convert coordinates
                //         const swWGS84 = convertCoordinate(sw, '2326', '4326');
                //         const neWGS84 = convertCoordinate(ne, '2326', '4326');
                        
                //         if (Array.isArray(swWGS84) && Array.isArray(neWGS84) && 
                //             swWGS84.length === 2 && neWGS84.length === 2) {
                            
                //             // Create bounds
                //             const mapBounds = [
                //                 [swWGS84[0], swWGS84[1]],
                //                 [neWGS84[0], neWGS84[1]]
                //             ] as [[number, number], [number, number]];
                            
                //             // Calculate center point
                //             const centerLng = (swWGS84[0] + neWGS84[0]) / 2;
                //             const centerLat = (swWGS84[1] + neWGS84[1]) / 2;
                            
                //             // Fly to bounds
                //             this.map.fitBounds(mapBounds, {
                //                 padding: 50,
                //                 maxZoom: 19,
                //                 duration: 1000
                //             });
                            
                //             // Create popup at center of bounds
                //             setTimeout(() => {
                //                 this.showSubprojectPopup(
                //                     {
                //                         name: subproject.name,
                //                         description: subproject.description || '',
                //                         projectName: projectName,
                //                         starred: subproject.starred || false
                //                     }, 
                //                     [centerLng, centerLat]
                //                 );
                //             }, 1000); // Display after fly animation
                            
                //             // If subproject bounds are displayed at this time, reapply highlight
                //             if (this.map.getSource(sourceId)) {
                //                 this.highlightSubproject(projectName, subprojectName);
                //             }
                            
                //             return;
                //         }
                //     }
                // }
                
                // console.warn('找不到子项目或边界不正确:', subprojectName);
            
        } catch (error) {
            console.error('飞行到子项目边界失败:', error);
        }
    }
    
    /**
     * Display the popup information of the subproject
     * @param properties Subproject properties
     * @param center Popup position coordinates
     */
    private showSubprojectPopup(properties: any, center: [number, number]): void {
        if (!this.map) return;
        
        // Remove existing popups
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => popup.remove());
        
        // Create new popup
        new mapboxgl.Popup({ 
            closeOnClick: true,
            maxWidth: '300px'
        })
            .setLngLat(center)
            .setHTML(`
                <div style="font-family: Arial, sans-serif; padding: 10px;">
                    <h3 style="margin: 0 0 8px; font-weight: bold; color: #333;">${properties.name}</h3>
                    ${properties.description ? 
                        `<p style="margin: 0 0 8px; color: #666;">${properties.description}</p>` : 
                        ''}
                    <div style="display: flex; align-items: center; margin-top: 8px;">
                        <span style="font-size: 12px; color: #888;">
                            ${this.language === 'zh' ? '所属项目' : 'Project'}: 
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: #444; margin-left: 4px;">
                            ${properties.projectName}
                        </span>
                        ${properties.starred ? 
                            `<span style="margin-left: 8px; color: #f0c14b;">★</span>` : 
                            ''}
                    </div>
                </div>
            `)
            .addTo(this.map);
    }
} 