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
import { LanguageContext } from '../../App';
import {
  ProjectNameCard,
  ProjectDescriptionCard,
  ProjectSchemaNameCard,
  ProjectErrorMessage,
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
  calculateMinimumBoundingRectangle,
} from '../operatePanel/utils/coordinateUtils';
import { RectangleCoordinates } from '../operatePanel/types/types';
import { ProjectService } from './utils/ProjectService';
import mapboxgl from 'mapbox-gl';
import { SchemaService } from '../schemaPanel/utils/SchemaService';
import { Schema } from '../schemaPanel/types/types';
import { convertToWGS84 } from '../schemaPanel/utils/utils';

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

  if (!data.rectangleCoordinates) {
    generalError =
      language === 'zh'
        ? '请先绘制矩形区域'
        : 'Please draw a rectangle area first';
    errors.coordinates = true;
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

  const [convertedRectangle, setConvertedRectangle] =
    useState<RectangleCoordinates | null>(null);

  const [expandedRectangle, setExpandedRectangle] =
    useState<RectangleCoordinates | null>(null);

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
      schemaService
        .getSchemaByName(initialSchemaName)
        .then((schema: Schema) => {
          if (schema && schema.base_point) {
            setSchemaBasePoint(schema.base_point as [number, number]);

            if (schema.epsg) {
              const wgs84Point = convertToWGS84(schema.base_point, schema.epsg);
              setSchemaBasePointWGS84(wgs84Point);
              showSchemaMarkerOnMap(wgs84Point, schema.name);
            }
          }
        })
        .catch((error) => {
          console.error('获取schema详情失败:', error);
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
      converted: {
        en: `Converted Coordinates (EPSG:${epsg})`,
        zh: `转换后的坐标 (EPSG:${epsg})`,
      },
      aligned: {
        en: `Aligned Coordinates (EPSG:${epsg})`,
        zh: `对齐后的坐标 (EPSG:${epsg})`,
      },
      expanded: {
        en: `Expanded Rectangle (EPSG:${epsg})`,
        zh: `扩展后的矩形 (EPSG:${epsg})`,
      },
    },
  };

  const handleDrawRectangle = useCallback(() => {
    if (onDrawRectangle) {
      onDrawRectangle(isDrawing);
    }
  }, [isDrawing, onDrawRectangle]);

  const showSchemaMarkerOnMap = useCallback(
    (coordinates: [number, number], schemaName: string) => {
      if (!window.mapInstance) return;

      if (schemaMarker) {
        schemaMarker.remove();
      }

      const popupHtml = `
      <div style="padding: 10px;">
        <h4 style="margin: 0 0 5px; font-weight: bold;">${
          language === 'zh' ? '模板基准点' : 'Schema Base Point'
        }</h4>
        <p style="margin: 0; font-size: 12px;">${schemaName}</p>
        <p style="margin: 0; font-size: 12px;">${coordinates[0].toFixed(
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

      setSchemaMarker(marker);

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
      <div style="padding: 10px;">
        <h4 style="margin: 0 0 5px; font-weight: bold; font-size: 18px;">${
          language === 'zh' ? '网格对齐左下角点' : 'Grid-Aligned bottom-left Corner'
        }</h4>
        <p style="margin: 0; font-size: 12px;">${coordinates[0].toFixed(
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

      setCornerMarker(marker);

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
      setGridLine(lineId);
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
      const labelText = `${language === 'zh' ? '宽: ' : 'W: '}${widthCount} × ${
        language === 'zh' ? '高: ' : 'H: '
      }${heightCount}`;
      const el = document.createElement('div');
      el.className = 'grid-count-label';
      el.style.backgroundColor = 'rgba(0, 136, 255, 0.8)';
      el.style.color = 'white';
      el.style.padding = '5px 8px';
      el.style.borderRadius = '4px';
      el.style.fontSize = '11px';
      el.style.fontWeight = 'bold';
      el.style.whiteSpace = 'nowrap';
      el.style.pointerEvents = 'none';
      el.textContent = labelText;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(midPoint)
        .addTo(window.mapInstance);

      setGridLabel(marker);

      return lineId;
    },
    [gridLine, gridLabel, language]
  );

  useEffect(() => {
    if (rectangleCoordinates && epsg && epsg !== '4326') {
      const rectangleKey = JSON.stringify(rectangleCoordinates);

      const convertedNE = convertSingleCoordinate(
        rectangleCoordinates.northEast,
        '4326',
        epsg
      );
      const convertedSE = convertSingleCoordinate(
        rectangleCoordinates.southEast,
        '4326',
        epsg
      );
      const convertedSW = convertSingleCoordinate(
        rectangleCoordinates.southWest,
        '4326',
        epsg
      );
      const convertedNW = convertSingleCoordinate(
        rectangleCoordinates.northWest,
        '4326',
        epsg
      );
      const convertedCenter = convertSingleCoordinate(
        rectangleCoordinates.center,
        '4326',
        epsg
      );

      let convertedRect: RectangleCoordinates = {
        northEast: convertedNE,
        southEast: convertedSE,
        southWest: convertedSW,
        northWest: convertedNW,
        center: convertedCenter,
      };

      if (gridLevel && gridLevel.length >= 2 && schemaBasePoint) {
        const gridWidth = gridLevel[0];
        const gridHeight = gridLevel[1];

        const [swX, swY] = convertedRect.southWest;
        const [baseX, baseY] = schemaBasePoint;

        const diffX = swX - baseX;
        const diffY = swY - baseY;

        const modX = diffX % gridWidth;
        const modY = diffY % gridHeight;

        const gridWidthCount = Math.floor(diffX / gridWidth);
        const gridHeightCount = Math.floor(diffY / gridHeight);

        if (modX !== 0 || modY !== 0) {
          const adjustX = modX > 0 ? gridWidth - modX : -modX;
          const adjustY = modY > 0 ? gridHeight - modY : -modY;

          convertedRect = {
            northEast: [convertedNE[0] + adjustX, convertedNE[1] + adjustY],
            southEast: [convertedSE[0] + adjustX, convertedSE[1] + adjustY],
            southWest: [convertedSW[0] + adjustX, convertedSW[1] + adjustY],
            northWest: [convertedNW[0] + adjustX, convertedNW[1] + adjustY],
            center: [
              convertedCenter[0] + adjustX,
              convertedCenter[1] + adjustY,
            ],
          };

          const adjustedDiffX = convertedRect.southWest[0] - baseX;
          const adjustedDiffY = convertedRect.southWest[1] - baseY;
          const adjustedGridWidthCount = Math.floor(adjustedDiffX / gridWidth);
          const adjustedGridHeightCount = Math.floor(
            adjustedDiffY / gridHeight
          );

          const adjustedSWInWGS84 = convertSingleCoordinate(
            convertedRect.southWest,
            epsg,
            '4326'
          );

          const cornerMarker = showCornerMarkerOnMap(adjustedSWInWGS84);

          if (schemaBasePointWGS84) {
            addLineBetweenPoints(
              schemaBasePointWGS84,
              adjustedSWInWGS84,
              Math.abs(adjustedGridWidthCount),
              Math.abs(adjustedGridHeightCount)
            );
          }
        } else {

          const swInWGS84 = convertSingleCoordinate(
            convertedRect.southWest,
            epsg,
            '4326'
          );
          const cornerMarker = showCornerMarkerOnMap(swInWGS84);

          if (schemaBasePointWGS84) {
            addLineBetweenPoints(
              schemaBasePointWGS84,
              swInWGS84,
              Math.abs(gridWidthCount),
              Math.abs(gridHeightCount)
            );
          }
        }
      }

      setConvertedRectangle(convertedRect);

      const mbr = calculateMinimumBoundingRectangle([
        convertedRect.northEast,
        convertedRect.southEast,
        convertedRect.southWest,
        convertedRect.northWest,
      ]);

      const expandFactor = 0.2;
      const width = Math.abs(mbr.northEast[0] - mbr.northWest[0]);
      const height = Math.abs(mbr.northEast[1] - mbr.southEast[1]);

      const expandedWidth = width * (1 + expandFactor);
      const expandedHeight = height * (1 + expandFactor);

      const widthDiff = (expandedWidth - width) / 2;
      const heightDiff = (expandedHeight - height) / 2;

      const expandedNE: [number, number] = [
        mbr.northEast[0] + widthDiff,
        mbr.northEast[1] + heightDiff,
      ];
      const expandedSE: [number, number] = [
        mbr.southEast[0] + widthDiff,
        mbr.southEast[1] - heightDiff,
      ];
      const expandedSW: [number, number] = [
        mbr.southWest[0] - widthDiff,
        mbr.southWest[1] - heightDiff,
      ];
      const expandedNW: [number, number] = [
        mbr.northWest[0] - widthDiff,
        mbr.northWest[1] + heightDiff,
      ];

      const expandedNE_WGS84 = convertSingleCoordinate(
        expandedNE,
        epsg,
        '4326'
      );
      const expandedSE_WGS84 = convertSingleCoordinate(
        expandedSE,
        epsg,
        '4326'
      );
      const expandedSW_WGS84 = convertSingleCoordinate(
        expandedSW,
        epsg,
        '4326'
      );
      const expandedNW_WGS84 = convertSingleCoordinate(
        expandedNW,
        epsg,
        '4326'
      );
      const expandedCenter_WGS84 = convertSingleCoordinate(
        mbr.center,
        epsg,
        '4326'
      );

      setExpandedRectangle({
        northEast: expandedNE_WGS84,
        southEast: expandedSE_WGS84,
        southWest: expandedSW_WGS84,
        northWest: expandedNW_WGS84,
        center: expandedCenter_WGS84,
      });
    } else {
      setConvertedRectangle(null);
      setExpandedRectangle(null);

      // 清除标记
      if (cornerMarker) {
        cornerMarker.remove();
        setCornerMarker(null);
      }

      // 清除连线
      if (gridLine && window.mapInstance) {
        if (window.mapInstance.getSource(gridLine)) {
          window.mapInstance.removeLayer(gridLine);
          window.mapInstance.removeSource(gridLine);
        }
        setGridLine(null);
      }

      // 清除标签
      if (gridLabel) {
        gridLabel.remove();
        setGridLabel(null);
      }
    }
    // 简化依赖数组，只保留必要的依赖项
  }, [
    rectangleCoordinates,
    epsg,
    gridLevel,
    schemaBasePoint,
    schemaBasePointWGS84,
    // 移除这些回调函数，因为它们会导致不必要的重新执行
    // showCornerMarkerOnMap,
    // addLineBetweenPoints,
  ]);

  // 分离清理逻辑到单独的useEffect
  useEffect(() => {
    // 组件卸载时清理所有地图标记和图层
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

    if (convertedRectangle) {
      const bounds = [
        convertedRectangle.southWest[0],
        convertedRectangle.southWest[1],
        convertedRectangle.northEast[0],
        convertedRectangle.northEast[1],
      ];

      const projectData = {
        name,
        description,
        schema_name: schemaName,
        bounds,
        starred: false,
      };

      setGeneralError(
        language === 'zh' ? '正在提交数据...' : 'Submitting data...'
      );

      const projectService = new ProjectService(language);
      projectService
        .createProject(projectData)
        .then((response) => {
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
        })
        .catch((error: Error) => {
          setGeneralError(error.message);
        });
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

    // 清除左下角点标记
    if (cornerMarker) {
      cornerMarker.remove();
      setCornerMarker(null);
    }

    // 清除schema基准点标记
    if (schemaMarker) {
      schemaMarker.remove();
      setSchemaMarker(null);
    }

    // 清除连线
    if (gridLine && window.mapInstance) {
      if (window.mapInstance.getSource(gridLine)) {
        window.mapInstance.removeLayer(gridLine);
        window.mapInstance.removeSource(gridLine);
      }
      setGridLine(null);
    }

    // 清除标签
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
            {language === 'zh' ? '创建新项目' : 'Create New Project'}
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

                <ProjectSchemaNameCard
                  name={schemaName}
                  language={language}
                  hasError={formErrors.schemaName}
                  onChange={setSchemaName}
                  readOnly={schemaNameFromProps}
                />

                <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'zh'
                      ? '目标坐标系统 (EPSG)'
                      : 'Target Coordinate System (EPSG)'}
                  </h3>
                  <div className="flex items-center">
                    <span className="mr-2">EPSG:</span>
                    <input
                      type="text"
                      value={epsg}
                      onChange={(e) =>
                        !epsgFromProps && setEpsg(e.target.value)
                      }
                      readOnly={epsgFromProps}
                      className={`flex-1 p-2 border rounded-md ${
                        epsgFromProps ? 'bg-gray-100' : ''
                      } ${
                        formErrors.epsg ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={
                        language === 'zh' ? '例如: 3857' : 'e.g. 3857'
                      }
                    />
                  </div>
                  {formErrors.epsg && (
                    <p className="text-red-500 text-sm mt-1">
                      {language === 'zh'
                        ? '请输入有效的EPSG代码'
                        : 'Please enter a valid EPSG code'}
                    </p>
                  )}
                </div>

                <DrawButton
                  isDrawing={isDrawing}
                  rectangleCoordinates={rectangleCoordinates}
                  onClick={handleDrawRectangle}
                />

                {rectangleCoordinates && (
                  <CoordinateBox
                    title={
                      language === 'zh'
                        ? translations.coordinates.wgs84.zh
                        : translations.coordinates.wgs84.en
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
                          ? translations.coordinates.converted.zh
                          : translations.coordinates.converted.en
                      }
                      coordinates={convertedRectangle}
                      formatCoordinate={formatCoordinate}
                    />
                  )}

                {convertedRectangle &&
                  epsg !== '4326' &&
                  rectangleCoordinates && (
                    <CoordinateBox
                      title={
                        language === 'zh'
                          ? translations.coordinates.aligned.zh
                          : translations.coordinates.aligned.en
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
                          ? translations.coordinates.expanded.zh
                          : translations.coordinates.expanded.en
                      }
                      coordinates={expandedRectangle}
                      formatCoordinate={formatCoordinate}
                    />
                  )}

                <ProjectErrorMessage message={generalError} />

                <Button
                  type="submit"
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '创建并返回' : 'Create and Back'}
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
