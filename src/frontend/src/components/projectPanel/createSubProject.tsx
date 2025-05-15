import React, { useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import {
    ProjectErrorMessage,
    SubProjectNameCard,
    SubProjectDescriptionCard,
    BelongToProjectCard,
    ProjectEpsgCard,
} from './components/ProjectFormComponents';
import { clearMapMarkers } from '../schemaPanel/utils/SchemaCoordinateService';
import DrawButton from '../operatePanel/components/DrawButton';
import {
    CreateProjectProps,
    ExtendedFormErrors,
    ProjectValidationResult,
} from './types/types';
import CoordinateBox from '../operatePanel/components/CoordinateBox';
import {
    formatCoordinate,
    convertCoordinate as convertSingleCoordinate,
} from '../../core/util/coordinateUtils';
import { RectangleCoordinates } from '../operatePanel/types/types';
import { ProjectService } from './utils/ProjectService';
import mapboxgl from 'mapbox-gl';
import { SchemaService } from '../schemaPanel/utils/SchemaService';
import { Schema } from '../schemaPanel/types/types';
import { convertToWGS84 } from '../schemaPanel/utils/utils';
import {
    adjustAndExpandRectangle,
    calculateGridCounts,
} from './utils/ProjectCoordinateService';

const validateProjectForm = (
    data: {
        name: string;
        schemaName: string;
        epsg: string;
        rectangleCoordinates: RectangleCoordinates | null;
    },
    language: string,
    isSchemaNameFromProps: boolean,
    isEpsgFromProps: boolean
): ProjectValidationResult => {
    const errors: ExtendedFormErrors = {
        name: false,
        description: false,
        coordinates: false,
        epsg: false,
        schemaName: false,
    };

    let generalError: string | null = null;

    if (!data.name.trim()) {
        generalError =
            language === 'zh'
                ? '请输入子项目名称'
                : 'Please enter subproject name';
        errors.name = true;
        return { isValid: false, errors, generalError };
    }

    if (!isEpsgFromProps && (!data.epsg.trim() || isNaN(Number(data.epsg)))) {
        generalError =
            language === 'zh'
                ? '请输入有效的EPSG代码'
                : 'Please enter a valid EPSG code';
        errors.epsg = true;
        return { isValid: false, errors, generalError };
    }

    if (!data.rectangleCoordinates) {
        generalError =
            language === 'zh'
                ? '请先绘制矩形区域'
                : 'Please draw a rectangle area';
        errors.coordinates = true;
        return { isValid: false, errors, generalError };
    }

    return { isValid: true, errors, generalError: null };
};

export default function CreateSubProject({
    onDrawRectangle,
    rectangleCoordinates,
    isDrawing = false,
    onBack,
    initialSchemaName,
    initialEpsg,
    initialSchemaLevel,
    parentProject,
    cornerMarker,
    setCornerMarker,
    schemaMarker,
    setSchemaMarker,
    gridLine,
    setGridLine,
    gridLabel,
    setGridLabel,
    ...props
}: CreateProjectProps) {
    const { language } = useContext(LanguageContext);
    const [name, setName] = useState('');
    const [schemaName, setSchemaName] = useState('');
    const [description, setDescription] = useState('');
    const [isSelectingPoint, setIsSelectingPoint] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [epsg, setEpsg] = useState('');
    const [formErrors, setFormErrors] = useState<ExtendedFormErrors>({
        name: false,
        schemaName: false,
        description: false,
        coordinates: false,
        epsg: false,
    });
    const [gridLevel, setGridLevel] = useState<number[] | null>(null);

    const [convertedRectangle, setConvertedRectangle] =
        useState<RectangleCoordinates | null>(null);

    const [expandedRectangle, setExpandedRectangle] =
        useState<RectangleCoordinates | null>(null);

    const [schemaNameFromProps, setSchemaNameFromProps] =
        useState<boolean>(false);
    const [epsgFromProps, setEpsgFromProps] = useState<boolean>(false);

    const [schemaBasePoint, setSchemaBasePoint] = useState<
        [number, number] | null
    >(null);
    const [schemaBasePointWGS84, setSchemaBasePointWGS84] = useState<
        [number, number] | null
    >(null);

    useEffect(() => {
        if (initialSchemaName) {
            setSchemaName(initialSchemaName);
            setSchemaNameFromProps(true);
            const schemaService = new SchemaService(language);
            schemaService.getSchemaByName(initialSchemaName, (err, result) => {
                if (err) {
                    console.error('获取schema详情失败:', err);
                    return;
                }
                if (result.project_schema && result.project_schema.base_point) {
                    setSchemaBasePoint(
                        result.project_schema.base_point as [number, number]
                    );

                    if (result.project_schema.epsg) {
                        const wgs84Point = convertToWGS84(
                            result.project_schema.base_point,
                            result.project_schema.epsg
                        );
                        setSchemaBasePointWGS84(wgs84Point);
                        showSchemaMarkerOnMap(wgs84Point, result.project_schema.name);

                        if (!initialEpsg) {
                            setEpsg(result.project_schema.epsg.toString());
                            setEpsgFromProps(true);
                        }
                    }
                }
            });
        }

        if (initialEpsg) {
            setEpsg(initialEpsg);
            setEpsgFromProps(true);
        }

        if (initialSchemaLevel) {
            try {
                const levelData = JSON.parse(initialSchemaLevel);
                setGridLevel(Array.isArray(levelData) ? levelData : null);
            } catch (error) {
                console.error('解析网格层级数据失败:', error);
                setGridLevel(null);
            }
        }
    }, [initialSchemaName, initialEpsg, initialSchemaLevel, language]);

    const translations = {
        drawButton: {
            start: {
                en: 'Draw Rectangle',
                zh: '绘制矩形',
            },
            cancel: {
                en: 'Cancel Drawing',
                zh: '取消绘制',
            },
        },
        coordinates: {
            wgs84: {
                en: 'Rectangle Coordinates (EPSG:4326)',
                zh: '矩形坐标 (EPSG:4326)',
            },
            aligned: {
                en: `Aligned Coordinates (EPSG:${epsg})`,
                zh: `对齐后的坐标 (EPSG:${epsg})`,
            },
            expanded: {
                en: `Expanded Coordinates (EPSG:${epsg})`,
                zh: `扩展后的坐标 (EPSG:${epsg})`,
            },
        },
    };

    const handleDrawRectangle = useCallback(() => {
        if (onDrawRectangle) {
            if (rectangleCoordinates) {
                if (cornerMarker) {
                    cornerMarker.remove();
                    setCornerMarker && setCornerMarker(null);
                }
                if (gridLine && window.mapInstance) {
                    if (window.mapInstance.getSource(gridLine)) {
                        window.mapInstance.removeLayer(gridLine);
                        window.mapInstance.removeSource(gridLine);
                    }
                    setGridLine && setGridLine(null);
                }
                if (gridLabel) {
                    gridLabel.remove();
                    setGridLabel && setGridLabel(null);
                }
            }
            onDrawRectangle(isDrawing);
        }
    }, [isDrawing, onDrawRectangle, rectangleCoordinates, cornerMarker, gridLine, gridLabel]);

    const showSchemaMarkerOnMap = useCallback(
        (coordinates: [number, number], schemaName: string) => {
            if (!window.mapInstance) return;

            if (schemaMarker) {
                schemaMarker.remove();
            }

            const popupHtml = `
      <div style="padding: 12px; font-family: 'Arial', sans-serif; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 8px; font-weight: 600; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 6px; text-align: center;">${
            language === 'zh' ? '模板基准点' : 'Schema Base Point'
        }</h4>
        <p style="margin: 0 0 4px; font-size: 13px; color: #555; font-weight: 500;">${schemaName}</p>
        <p style="margin: 0; font-size: 13px; background-color: #f5f8ff; padding: 4px 6px; border-radius: 4px; color: #FF7700; font-family: monospace;">${coordinates[0].toFixed(
            6
        )}, ${coordinates[1].toFixed(6)}</p>
      </div>
    `;

            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
            }).setHTML(popupHtml);

            const marker = new mapboxgl.Marker({
                color: '#00FF00',
            })
                .setLngLat(coordinates)
                .setPopup(popup)
                .addTo(window.mapInstance);

                setSchemaMarker && setSchemaMarker(marker);

            return marker;
        },
        [schemaMarker, language]
    );

    const showCornerMarkerOnMap = useCallback(
        (coordinates: [number, number]) => {
            if (!window.mapInstance) return;

            if (cornerMarker) {
                cornerMarker.remove();
            }

            const popupHtml = `
      <div style="padding: 12px; font-family: 'Arial', sans-serif; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 8px; font-weight: 600; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 6px; text-align: center;">${
            language === 'zh' ? '对齐后左下角点' : 'Aligned LB Corner'
        }</h4>
        <p style="margin: 0; font-size: 13px; background-color: #f5f8ff; padding: 4px 6px; border-radius: 4px; color: #FF7700; font-family: monospace;">${coordinates[0].toFixed(
            6
        )}, ${coordinates[1].toFixed(6)}</p>
      </div>
    `;

            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
            }).setHTML(popupHtml);

            const marker = new mapboxgl.Marker({
                color: '#FF0000',
            })
                .setLngLat(coordinates)
                .setPopup(popup)
                .addTo(window.mapInstance);

                setCornerMarker && setCornerMarker(marker);

            marker.togglePopup();

            return marker;
        },
        [cornerMarker, language]
    );

    const addLineBetweenPoints = useCallback(
        (
            start: [number, number],
            end: [number, number],
            widthCount: number,
            heightCount: number
        ) => {
            if (!window.mapInstance) return;
            if (gridLine) {
                if (window.mapInstance.getSource(gridLine)) {
                    window.mapInstance.removeLayer(gridLine);
                    window.mapInstance.removeSource(gridLine);
                }
            }
            if (gridLabel) {
                gridLabel.remove();
            }
            const lineId = `grid-line-${Date.now()}`;
            setGridLine && setGridLine(lineId);
            window.mapInstance.addSource(lineId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [start, end],
                    },
                },
            });

            window.mapInstance.addLayer({
                id: lineId,
                type: 'line',
                source: lineId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#0088FF',
                    'line-width': 2,
                    'line-dasharray': [2, 1],
                },
            });
            const midPoint: [number, number] = [
                (start[0] + end[0]) / 2,
                (start[1] + end[1]) / 2,
            ];
            const labelText = `${
                language === 'zh' ? '宽: ' : 'W: '
            }${widthCount} × ${
                language === 'zh' ? '高: ' : 'H: '
            }${heightCount}`;
            const el = document.createElement('div');
            el.className = 'grid-count-label';
            el.style.backgroundColor = 'rgba(0, 136, 255, 0.85)';
            el.style.color = 'white';
            el.style.padding = '6px 10px';
            el.style.borderRadius = '6px';
            el.style.fontSize = '12px';
            el.style.fontWeight = 'bold';
            el.style.whiteSpace = 'nowrap';
            el.style.pointerEvents = 'none';
            el.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
            el.style.fontFamily = 'Arial, sans-serif';
            el.style.letterSpacing = '0.5px';
            el.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            el.textContent = labelText;

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'center',
            })
                .setLngLat(midPoint)
                .addTo(window.mapInstance);

            setGridLabel && setGridLabel(marker);

            return lineId;
        },
        [gridLine, gridLabel, language]
    );

    useEffect(() => {
        if (rectangleCoordinates && epsg && gridLevel && schemaBasePoint) {
            const { alignedRectangle, expandedRectangle } =
                adjustAndExpandRectangle({
                    rectangleCoordinates,
                    epsg,
                    gridLevel,
                    schemaBasePoint,
                    convertSingleCoordinate,
                    expandFactor: 0.2,
                });

            setConvertedRectangle(alignedRectangle);
            setExpandedRectangle(expandedRectangle);

            if (alignedRectangle && schemaBasePointWGS84) {
                const alignedSWInWGS84 = convertSingleCoordinate(
                    alignedRectangle.southWest,
                    epsg,
                    '4326'
                );

                const { widthCount, heightCount } = calculateGridCounts(
                    alignedRectangle.southWest,
                    schemaBasePoint,
                    gridLevel
                );

                showCornerMarkerOnMap(alignedSWInWGS84);

                addLineBetweenPoints(
                    schemaBasePointWGS84,
                    alignedSWInWGS84,
                    widthCount,
                    heightCount
                );
            }
        } else {
            setConvertedRectangle(null);
            setExpandedRectangle(null);
        }
    }, [
        rectangleCoordinates,
        epsg,
        gridLevel,
        schemaBasePoint,
        schemaBasePointWGS84,
        convertSingleCoordinate,
    ]);

    useEffect(() => {
        return () => {
            if (cornerMarker) {
                cornerMarker.remove();
            }
            if (schemaMarker) {
                schemaMarker.remove();
            }
            if (gridLine && window.mapInstance) {
                if (window.mapInstance.getSource(gridLine)) {
                    window.mapInstance.removeLayer(gridLine);
                    window.mapInstance.removeSource(gridLine);
                }
            }
            if (gridLabel) {
                gridLabel.remove();
            }
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        const validation = validateProjectForm(
            {
                name,
                schemaName,
                epsg,
                rectangleCoordinates: rectangleCoordinates || null,
            },
            language,
            !!initialSchemaName,
            !!initialEpsg
        );

        if (!validation.isValid) {
            setFormErrors(validation.errors);
            setGeneralError(validation.generalError);
            return;
        }

        if (expandedRectangle) {
            const bounds = [
                expandedRectangle.southWest[0],
                expandedRectangle.southWest[1],
                expandedRectangle.northEast[0],
                expandedRectangle.northEast[1],
            ] as [number, number, number, number];

            const subProjectData = {
                name,
                description,
                bounds,
                starred: false,
            };

            setGeneralError(
                language === 'zh' ? '正在提交数据...' : 'Submitting data...'
            );

            const projectName = parentProject?.name || '';

            const projectService = new ProjectService(language);
            projectService.createSubproject(projectName, subProjectData,
                (err, result) => {
                    if (result.success === false) {
                        setGeneralError(
                            language === 'zh'
                                ? '子项目名称已存在，请使用不同的名称'
                                : 'SubProject already exists. Please use a different name.'
                        );
                        setFormErrors((prev) => ({ ...prev, name: true }));
                        return
                    }

                    setGeneralError(
                        language === 'zh'
                            ? '子项目创建成功！'
                            : 'SubProject created successfully!'
                    );

                    if (window.mapInstance) {
                        if (cornerMarker) {
                            cornerMarker.remove();
                            setCornerMarker && setCornerMarker(null);
                        }
                        if (schemaMarker) {
                            schemaMarker.remove();
                            setSchemaMarker && setSchemaMarker(null);
                        }
                        if (
                            gridLine &&
                            window.mapInstance.getSource(gridLine)
                        ) {
                            window.mapInstance.removeLayer(gridLine);
                            window.mapInstance.removeSource(gridLine);
                            setGridLine && setGridLine(null);
                        }
                        if (gridLabel) {
                            gridLabel.remove();
                            setGridLabel && setGridLabel(null);
                        }
                        clearMapMarkers();

                        if (onDrawRectangle) {
                            onDrawRectangle(false);
                            setTimeout(() => {
                                onDrawRectangle(true);
                            }, 10);
                        }
                    }

                    setTimeout(() => {
                        if (onBack) {
                            onBack();
                        }
                    }, 500);
                })
                
        } else {
            setGeneralError(
                language === 'zh'
                    ? '请先绘制一个矩形区域'
                    : 'Please draw a rectangle area first'
            );
        }
    };

    const handleBack = () => {
        clearMapMarkers();

        if (cornerMarker) {
            cornerMarker.remove();
            setCornerMarker && setCornerMarker(null);
        }

        if (schemaMarker) {
            schemaMarker.remove();
            setSchemaMarker && setSchemaMarker(null);
        }

        if (gridLine && window.mapInstance) {
            if (window.mapInstance.getSource(gridLine)) {
                window.mapInstance.removeLayer(gridLine);
                window.mapInstance.removeSource(gridLine);
            }
            setGridLine && setGridLine(null);
        }

        if (gridLabel) {
            gridLabel.remove();
            setGridLabel && setGridLabel(null);
        }

        if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            setIsSelectingPoint(false);
        }

        if (onDrawRectangle) {
            onDrawRectangle(false);
            setTimeout(() => {
                onDrawRectangle(true);
            }, 10);
            if (window.mapboxDrawInstance) {
                window.mapboxDrawInstance.deleteAll();
            }
        }

        if (onBack) {
            onBack();
        }
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <div className="flex items-center p-3 mb-0">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh'
                            ? '创建新子项目'
                            : 'Create New SubProject'}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-1 pt-0 -mt-3">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="p-1">
                                <SubProjectNameCard
                                    name={name}
                                    language={language}
                                    hasError={formErrors.name}
                                    onChange={setName}
                                />

                                <SubProjectDescriptionCard
                                    description={description}
                                    language={language}
                                    hasError={formErrors.description}
                                    onChange={setDescription}
                                />

                                <BelongToProjectCard
                                    projectName={parentProject?.name || ''}
                                    language={language}
                                />

                                <ProjectEpsgCard
                                    epsg={epsg}
                                    language={language}
                                    hasError={formErrors.epsg}
                                    onChange={setEpsg}
                                    epsgFromProps={epsgFromProps}
                                    formErrors={formErrors}
                                />

                                <DrawButton
                                    isDrawing={isDrawing}
                                    rectangleCoordinates={rectangleCoordinates}
                                    onClick={handleDrawRectangle}
                                />

                                {rectangleCoordinates && (
                                    <CoordinateBox
                                        title={
                                            language === 'zh'
                                                ? translations.coordinates.wgs84
                                                      .zh
                                                : translations.coordinates.wgs84
                                                      .en
                                        }
                                        coordinates={rectangleCoordinates}
                                        formatCoordinate={formatCoordinate}
                                    />
                                )}

                                {convertedRectangle &&
                                    epsg !== '4326' &&
                                    rectangleCoordinates && (
                                        <CoordinateBox
                                            title={
                                                language === 'zh'
                                                    ? translations.coordinates
                                                          .aligned.zh
                                                    : translations.coordinates
                                                          .aligned.en
                                            }
                                            coordinates={convertedRectangle}
                                            formatCoordinate={formatCoordinate}
                                        />
                                    )}

                                {expandedRectangle &&
                                    epsg !== '4326' &&
                                    rectangleCoordinates && (
                                        <CoordinateBox
                                            title={
                                                language === 'zh'
                                                    ? translations.coordinates
                                                          .expanded.zh
                                                    : translations.coordinates
                                                          .expanded.en
                                            }
                                            coordinates={expandedRectangle}
                                            formatCoordinate={formatCoordinate}
                                        />
                                    )}

                                <ProjectErrorMessage message={generalError} />

                                <Button
                                    type="submit"
                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {language === 'zh'
                                        ? '创建并返回'
                                        : 'Create and Back'}
                                </Button>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </form>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
