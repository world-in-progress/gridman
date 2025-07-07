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
    ProjectNameCard,
    ProjectDescriptionCard,
    GridSchemaNameCard,
    ProjectErrorMessage,
    ProjectEpsgCard,
} from './components/ProjectFormComponents';
import { clearMapMarkers } from '../schemaPanel/utils/SchemaCoordinateService';
import {
    CreateProjectProps,
    ExtendedFormErrors,
    ProjectValidationResult,
} from './types/types';
import { ProjectService } from './utils/ProjectService';
import mapboxgl from 'mapbox-gl';
import { SchemaService } from '../schemaPanel/utils/SchemaService';
import { convertToWGS84 } from '../schemaPanel/utils/utils';

const validateProjectForm = (
    data: {
        name: string;
        schemaName: string;
        epsg: string;
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
            language === 'zh' ? '请输入项目名称' : 'Please enter project name';
        errors.name = true;
        return { isValid: false, errors, generalError };
    }

    if (!isSchemaNameFromProps && !data.schemaName.trim()) {
        generalError =
            language === 'zh' ? '请输入模板名称' : 'Please enter schema name';
        errors.schemaName = true;
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

    return { isValid: true, errors, generalError: null };
};

export default function CreateProject({
    onDrawRectangle,
    rectangleCoordinates,
    isDrawing = false,
    onBack,
    initialSchemaName,
    initialEpsg,
    initialSchemaLevel,
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

    const [schemaNameFromProps, setSchemaNameFromProps] =
        useState<boolean>(false);
    const [epsgFromProps, setEpsgFromProps] = useState<boolean>(false);

    const [cornerMarker, setCornerMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [schemaMarker, setSchemaMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [gridLine, setGridLine] = useState<string | null>(null);
    const [gridLabel, setGridLabel] = useState<mapboxgl.Marker | null>(null);
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
                if (result.grid_schema && result.grid_schema.base_point) {
                    setSchemaBasePoint(
                        result.grid_schema.base_point as [number, number]
                    );

                    if (result.grid_schema.epsg) {
                        const wgs84Point = convertToWGS84(
                            result.grid_schema.base_point,
                            result.grid_schema.epsg
                        );
                        setSchemaBasePointWGS84(wgs84Point);
                        showSchemaMarkerOnMap(
                            wgs84Point,
                            result.grid_schema.name
                        );
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

    const showSchemaMarkerOnMap = useCallback(
        (coordinates: [number, number], schemaName: string) => {
            if (!window.mapInstance) return;

            if (schemaMarker) {
                schemaMarker.remove();
            }

            const popupHtml = `
      <div style="padding: 12px; font-family: 'Arial', sans-serif; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 8px; font-weight: 600; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 6px;">${
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
                // .setPopup(popup)
                .addTo(window.mapInstance);

            setSchemaMarker(marker);

            return marker;
        },
        [schemaMarker, language]
    );

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

        const projectData = {
            name,
            description,
            schema_name: schemaName,
            starred: false,
        };

        setGeneralError(
            language === 'zh' ? '正在提交数据...' : 'Submitting data...'
        );

        const projectService = new ProjectService(language);
        projectService.createProject(projectData, (err, result) => {
            if (result.success === false) {
                setGeneralError(
                    language === 'zh'
                        ? '项目名称已存在，请使用不同的名称'
                        : 'Project already exists. Please use a different name.'
                );
                setFormErrors((prev) => ({ ...prev, name: true }));
                return;
            }
            setGeneralError(
                language === 'zh'
                    ? '项目创建成功！'
                    : 'Project created successfully!'
            );

            if (window.mapInstance) {
                if (onDrawRectangle) {
                    onDrawRectangle(false);
                    setTimeout(() => {
                        onDrawRectangle(true);
                    }, 10);
                }
                clearMapMarkers();
            }

            setTimeout(() => {
                if (onBack) {
                    onBack();
                }
            }, 1000);
        });
    };

    const handleBack = () => {
        clearMapMarkers();

        if (cornerMarker) {
            cornerMarker.remove();
            setCornerMarker(null);
        }

        if (schemaMarker) {
            schemaMarker.remove();
            setSchemaMarker(null);
        }

        if (gridLine && window.mapInstance) {
            if (window.mapInstance.getSource(gridLine)) {
                window.mapInstance.removeLayer(gridLine);
                window.mapInstance.removeSource(gridLine);
            }
            setGridLine(null);
        }

        if (gridLabel) {
            gridLabel.remove();
            setGridLabel(null);
        }

        if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            setIsSelectingPoint(false);
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
                            ? '创建新项目'
                            : 'Create New Project'}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-1 pt-0 -mt-3">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="p-1">
                                <ProjectNameCard
                                    name={name}
                                    language={language}
                                    hasError={formErrors.name}
                                    onChange={setName}
                                />

                                <ProjectDescriptionCard
                                    description={description}
                                    language={language}
                                    hasError={formErrors.description}
                                    onChange={setDescription}
                                />

                                <GridSchemaNameCard
                                    name={schemaName}
                                    language={language}
                                    hasError={formErrors.schemaName}
                                    onChange={setSchemaName}
                                    readOnly={schemaNameFromProps}
                                />

                                <ProjectEpsgCard
                                    epsg={epsg}
                                    language={language}
                                    hasError={formErrors.epsg}
                                    onChange={setEpsg}
                                    epsgFromProps={epsgFromProps}
                                    formErrors={formErrors}
                                />

                                <ProjectErrorMessage message={generalError} />

                                <Button
                                    type="submit"
                                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
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
