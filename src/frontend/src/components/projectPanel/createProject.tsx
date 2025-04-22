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
import {
  convertCoordinate,
  clearMapMarkers,
} from '../schemaPanel/utils/SchemaCoordinateService';
import {
  GridLayer,
  FormErrors,
} from '../schemaPanel/utils/SchemaFormValidation';
import DrawButton from '../operatePanel/components/DrawButton';
import { CreateProjectProps } from './types/types';
import CoordinateBox from '../operatePanel/components/CoordinateBox';
import {
  formatCoordinate,
  convertCoordinate as convertSingleCoordinate,
  calculateMinimumBoundingRectangle,
} from '../operatePanel/utils/coordinateUtils';
import { RectangleCoordinates } from '../operatePanel/types/types';
import { ProjectService } from './utils/ProjectService';

interface ExtendedFormErrors extends FormErrors {
  schemaName: boolean;
}

// 项目表单验证
interface ProjectValidationResult {
  isValid: boolean;
  errors: ExtendedFormErrors;
  generalError: string | null;
}

const validateProjectForm = (
  data: {
    name: string;
    schemaName: string;
    epsg: string;
    rectangleCoordinates: RectangleCoordinates | null;
  },
  language: string
): ProjectValidationResult => {
  const errors: ExtendedFormErrors = {
    name: false,
    description: false,
    coordinates: false,
    epsg: false,
    schemaName: false,
  };

  let generalError: string | null = null;

  // 验证项目名称
  if (!data.name.trim()) {
    generalError = language === 'zh' ? '请输入项目名称' : 'Please enter project name';
    errors.name = true;
    return { isValid: false, errors, generalError };
  }

  // 验证Schema名称
  if (!data.schemaName.trim()) {
    generalError = language === 'zh' ? '请输入模板名称' : 'Please enter schema name';
    errors.schemaName = true;
    return { isValid: false, errors, generalError };
  }

  // 验证EPSG
  if (!data.epsg.trim() || isNaN(Number(data.epsg))) {
    generalError = language === 'zh'
      ? '请输入有效的EPSG代码'
      : 'Please enter a valid EPSG code';
    errors.epsg = true;
    return { isValid: false, errors, generalError };
  }

  // 验证矩形坐标
  if (!data.rectangleCoordinates) {
    generalError = language === 'zh' ? '请先绘制矩形区域' : 'Please draw a rectangle area first';
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
  ...props
}: CreateProjectProps) {
  const { language } = useContext(LanguageContext);
  const [name, setName] = useState('');
  const [schemaName, setSchemaName] = useState('');
  const [description, setDescription] = useState('');
  const [lon, setLon] = useState('');
  const [lat, setLat] = useState('');
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);
  const [gridLayers, setGridLayers] = useState<GridLayer[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [epsg, setEpsg] = useState('');
  const [convertedCoord, setConvertedCoord] = useState<{
    x: string;
    y: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<ExtendedFormErrors>({
    name: false,
    schemaName: false,
    description: false,
    coordinates: false,
    epsg: false,
  });

  const [convertedRectangle, setConvertedRectangle] =
    useState<RectangleCoordinates | null>(null);

  const [expandedRectangle, setExpandedRectangle] =
    useState<RectangleCoordinates | null>(null);

  useEffect(() => {
    if (initialSchemaName) {
      setSchemaName(initialSchemaName);
    }

    if (initialEpsg) {
      setEpsg(initialEpsg);
    }
  }, [initialSchemaName, initialEpsg]);

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
      expanded: {
        en: 'Expanded Rectangle (EPSG:4326)',
        zh: '扩展后的矩形 (EPSG:4326)',
      },
    },
  };

  const handleDrawRectangle = useCallback(() => {
    if (onDrawRectangle) {
      onDrawRectangle(isDrawing);
    }
  }, [isDrawing, onDrawRectangle]);

  useEffect(() => {
    if (lon && lat && epsg) {
      const result = convertCoordinate(lon, lat, '4326', epsg);
      setConvertedCoord(result);
    } else {
      setConvertedCoord(null);
    }
  }, [lon, lat, epsg]);

  useEffect(() => {
    if (rectangleCoordinates && epsg && epsg !== '4326') {
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

      const convertedRect: RectangleCoordinates = {
        northEast: convertedNE,
        southEast: convertedSE,
        southWest: convertedSW,
        northWest: convertedNW,
        center: convertedCenter,
      };
      setConvertedRectangle(convertedRect);

      const mbr = calculateMinimumBoundingRectangle([
        convertedNE,
        convertedSE,
        convertedSW,
        convertedNW,
      ]);

      const expandFactor = 0.2; // Expansion factor, enlarge by 20%
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
    }
  }, [rectangleCoordinates, epsg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const validation = validateProjectForm(
      { 
        name, 
        schemaName, 
        epsg, 
        rectangleCoordinates: rectangleCoordinates || null 
      },
      language
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setGeneralError(validation.generalError);
      return;
    }

    // 如果有转换后的矩形坐标
    if (convertedRectangle) {
      const bounds = [
        convertedRectangle.southWest[0], // minx
        convertedRectangle.southWest[1], // miny
        convertedRectangle.northEast[0], // maxx
        convertedRectangle.northEast[1], // maxy
      ];

      const projectData = {
        name,
        description,
        schema_name: schemaName,
        bounds,
        starred: false
      };

      setGeneralError(
        language === 'zh' ? '正在提交数据...' : 'Submitting data...'
      );

      const projectService = new ProjectService(language);
      projectService.createProject(projectData)
        .then((response) => {
          setGeneralError(
            language === 'zh' ? '项目创建成功！' : 'Project created successfully!'
          );
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
      // 如果没有绘制矩形，显示错误信息
      setGeneralError(
        language === 'zh'
          ? '请先绘制一个矩形区域'
          : 'Please draw a rectangle area first'
      );
    }
  };

  const handleBack = () => {
    clearMapMarkers();

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
                {/* Name Card */}
                <ProjectNameCard
                  name={name}
                  language={language}
                  hasError={formErrors.name}
                  onChange={setName}
                />

                {/* Description Card */}
                <ProjectDescriptionCard
                  description={description}
                  language={language}
                  hasError={formErrors.description}
                  onChange={setDescription}
                />

                {/* Project Name Card */}
                <ProjectSchemaNameCard
                  name={schemaName}
                  language={language}
                  hasError={formErrors.schemaName}
                  onChange={setSchemaName}
                />

                {/* EPSG Input */}
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
                      onChange={(e) => setEpsg(e.target.value)}
                      className={`flex-1 p-2 border rounded-md ${
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

                {/* Draw button */}
                <DrawButton
                  isDrawing={isDrawing}
                  rectangleCoordinates={rectangleCoordinates}
                  onClick={handleDrawRectangle}
                />

                {/* Rectangle WGS84 coordinate box */}
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

                {/* Converted rectangle coordinate box */}
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

                {/* Expanded rectangle WGS84 coordinate box */}
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

                {/* Error Messages */}
                <ProjectErrorMessage message={generalError} />

                {/* Submit Button */}
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
