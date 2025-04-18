import * as React from 'react';
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
import GridLevel from '../operatePanel/components/GridLevel';
import { 
  SchemaNameCard, 
  SchemaDescriptionCard, 
  SchemaEpsgCard, 
  SchemaCoordinateCard, 
  SchemaConvertedCoordCard,
  SchemaErrorMessage
} from './components/SchemaFormComponents';
import { convertCoordinate, clearMapMarkers, enableMapPointSelection } from './utils/SchemaCoordinateService';
import { GridLayer, validateGridLayers, validateSchemaForm, createSchemaData } from './utils/SchemaFormValidation';
import { downloadSchemaAsJson, submitSchemaData } from './utils/SchemaSubmissionService';

interface CreateSchemaProps extends React.ComponentProps<typeof Sidebar> {
  onBack?: () => void;
}

export default function CreateSchema({ onBack, ...props }: CreateSchemaProps) {
  const { language } = useContext(LanguageContext);

  // 状态管理
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lon, setLon] = useState('');
  const [lat, setLat] = useState('');
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);
  const [gridLayers, setGridLayers] = useState<GridLayer[]>([]);
  const [layerErrors, setLayerErrors] = useState<Record<number, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [epsg, setEpsg] = useState('');
  const [convertedCoord, setConvertedCoord] = useState<{
    x: string;
    y: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name: boolean;
    description: boolean;
    coordinates: boolean;
    epsg: boolean;
  }>({
    name: false,
    description: false,
    coordinates: false,
    epsg: false,
  });

  // 当经纬度或EPSG改变时，计算转换后的坐标
  useEffect(() => {
    if (lon && lat && epsg) {
      const result = convertCoordinate(lon, lat, '4326', epsg);
      setConvertedCoord(result);
    } else {
      setConvertedCoord(null);
    }
  }, [lon, lat, epsg]);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // 验证表单
    const validation = validateSchemaForm(
      { name, epsg, lon, lat, gridLayers, convertedCoord },
      language
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setGeneralError(validation.generalError);
      return;
    }

    // 创建Schema数据
    const schemaData = createSchemaData(
      name,
      description,
      epsg,
      convertedCoord,
      gridLayers
    );

    if (!schemaData) {
      setGeneralError(
        language === 'zh'
          ? '无法创建Schema数据'
          : 'Unable to create Schema data'
      );
      return;
    }

    // 下载JSON文件
    downloadSchemaAsJson(schemaData, `${name}.json`);

    // 提交数据
    setGeneralError(
      language === 'zh' ? '正在提交数据...' : 'Submitting data...'
    );

    submitSchemaData(
      schemaData,
      language,
      // 成功回调
      () => {
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 1000);
      },
      // 错误回调
      (error) => {
        setGeneralError(error);
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 3000);
      },
      isSelectingPoint
    );
  };

  // 处理返回按钮
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

  // 处理绘制按钮
  const handleDraw = () => {
    if (isSelectingPoint && window.mapInstance) {
      if (window.mapInstance.getCanvas()) {
        window.mapInstance.getCanvas().style.cursor = '';
      }

      setIsSelectingPoint(false);
      return;
    }

    setIsSelectingPoint(true);

    if (window.mapInstance) {
      enableMapPointSelection(window.mapInstance, (lng, lat) => {
        setLon(lng.toFixed(6));
        setLat(lat.toFixed(6));
        setIsSelectingPoint(false);
      });
    }
  };

  // 网格层级相关操作
  const handleAddLayer = () => {
    const nextId =
      gridLayers.length > 0
        ? Math.max(...gridLayers.map((layer) => layer.id)) + 1
        : 0;

    setGridLayers([...gridLayers, { id: nextId, width: '', height: '' }]);
  };

  const handleUpdateWidth = (id: number, width: string) => {
    setGridLayers(
      gridLayers.map((layer) => (layer.id === id ? { ...layer, width } : layer))
    );
    validateAndUpdateLayerErrors();
  };

  const handleUpdateHeight = (id: number, height: string) => {
    setGridLayers(
      gridLayers.map((layer) =>
        layer.id === id ? { ...layer, height } : layer
      )
    );
    validateAndUpdateLayerErrors();
  };

  const handleRemoveLayer = (id: number) => {
    setGridLayers(gridLayers.filter((layer) => layer.id !== id));

    // 移除相关错误
    const newErrors = { ...layerErrors };
    delete newErrors[id];
    setLayerErrors(newErrors);
  };

  const validateAndUpdateLayerErrors = () => {
    const { errors } = validateGridLayers(gridLayers, language);
    setLayerErrors(errors);
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
            {language === 'zh' ? '创建新模式' : 'Create New Schema'}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="p-1 pt-0 -mt-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-1">
                {/* 名称卡片 */}
                <SchemaNameCard
                  name={name}
                  language={language}
                  hasError={formErrors.name}
                  onChange={setName}
                />

                {/* 描述卡片 */}
                <SchemaDescriptionCard
                  description={description}
                  language={language}
                  hasError={formErrors.description}
                  onChange={setDescription}
                />

                {/* EPSG卡片 */}
                <SchemaEpsgCard
                  epsg={epsg}
                  language={language}
                  hasError={formErrors.epsg}
                  onChange={setEpsg}
                />

                {/* 坐标卡片 */}
                <SchemaCoordinateCard
                  lon={lon}
                  lat={lat}
                  language={language}
                  hasError={formErrors.coordinates}
                  isSelectingPoint={isSelectingPoint}
                  onLonChange={setLon}
                  onLatChange={setLat}
                  onDrawClick={handleDraw}
                />

                {/* 转换后坐标卡片 */}
                <SchemaConvertedCoordCard
                  convertedCoord={convertedCoord}
                  epsg={epsg}
                  language={language}
                />

                {/* 网格层级组件 */}
                <GridLevel
                  layers={gridLayers}
                  layerErrors={layerErrors}
                  onAddLayer={handleAddLayer}
                  onUpdateWidth={handleUpdateWidth}
                  onUpdateHeight={handleUpdateHeight}
                  onRemoveLayer={handleRemoveLayer}
                />

                {/* 错误信息 */}
                <SchemaErrorMessage message={generalError} />

                {/* 提交按钮 */}
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
