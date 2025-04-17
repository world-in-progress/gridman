import * as React from 'react';
import { ArrowLeft, Save, MapPin, X } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../App';
import mapboxgl from 'mapbox-gl';
import GridLevel from '../operatePanel/components/GridLevel';
import proj4 from 'proj4';
import Actor from '../../core/message/actor';
import { Callback } from '../../core/types';

declare global {
  interface Window {
    mapInstance?: mapboxgl.Map;
  }
}

interface CreateSchemaProps extends React.ComponentProps<typeof Sidebar> {
  onBack?: () => void;
}

export default function CreateSchema({ onBack, ...props }: CreateSchemaProps) {
  const { language } = useContext(LanguageContext);

  const [name, setName] = useState('');
  const [lon, setLon] = useState('');
  const [lat, setLat] = useState('');
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);
  const [gridLayers, setGridLayers] = useState<
    { id: number; width: string; height: string }[]
  >([]);
  const [layerErrors, setLayerErrors] = useState<Record<number, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [epsg, setEpsg] = useState('');
  const [convertedCoord, setConvertedCoord] = useState<{ x: string; y: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name: boolean;
    coordinates: boolean;
    epsg: boolean;
  }>({
    name: false,
    coordinates: false,
    epsg: false,
  });

  // EPSG定义
  const epsgDefinitions: Record<string, string> = {
    '4326': '+proj=longlat +datum=WGS84 +no_defs', // WGS84
    '3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs', // Web Mercator
    '2326': '+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs', // Hong Kong 1980 Grid System
    '2433': '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs' // Hong Kong 1980 Grid System
  };

  // 坐标转换函数
  const convertCoordinate = (lon: string, lat: string, fromEPSG: string, toEPSG: string): { x: string; y: string } | null => {
    if (!lon || !lat || !fromEPSG || !toEPSG) return null;
    
    try {
      // 注册坐标系
      if (epsgDefinitions[fromEPSG]) {
        proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG]);
      }
      
      if (epsgDefinitions[toEPSG]) {
        proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG]);
      }
      
      // 转换坐标
      const result = proj4(`EPSG:${fromEPSG}`, `EPSG:${toEPSG}`, [parseFloat(lon), parseFloat(lat)]);
      
      // 返回结果
      return {
        x: result[0].toFixed(6),
        y: result[1].toFixed(6)
      };
    } catch (e) {
      console.error('坐标转换错误:', e);
      return null;
    }
  };

  // 当经纬度或EPSG代码变化时更新转换后的坐标
  useEffect(() => {
    if (lon && lat && epsg) {
      const result = convertCoordinate(lon, lat, '4326', epsg);
      setConvertedCoord(result);
    } else {
      setConvertedCoord(null);
    }
  }, [lon, lat, epsg]);

  const clearMapMarkers = () => {
    const markers = document.getElementsByClassName('mapboxgl-marker');
    if (markers.length > 0) {
      Array.from(markers).forEach((marker) => {
        marker.remove();
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError(null);

    const errors = {
      name: false,
      coordinates: false,
      epsg: false,
    };

    if (!name.trim()) {
      setGeneralError(
        language === 'zh' ? '请输入模板名称' : 'Please enter schema name'
      );
      errors.name = true;
      setFormErrors(errors);
      return;
    }

    if (!epsg.trim() || isNaN(Number(epsg))) {
      setGeneralError(
        language === 'zh'
          ? '请输入有效的EPSG代码'
          : 'Please enter a valid EPSG code'
      );
      errors.epsg = true;
      setFormErrors({ ...errors, epsg: true });
      return;
    }

    if (!lon.trim() || !lat.trim()) {
      setGeneralError(
        language === 'zh' ? '请输入经纬度坐标' : 'Please enter coordinates'
      );
      errors.coordinates = true;
      setFormErrors(errors);
      return;
    }

    if (gridLayers.length === 0) {
      setGeneralError(
        language === 'zh'
          ? '请至少添加一级网格'
          : 'Please add at least one grid level'
      );
      setFormErrors(errors);
      return;
    }

    validateGridLayers();

    for (let i = 0; i < gridLayers.length; i++) {
      const layer = gridLayers[i];
      if (
        !layer.width.trim() ||
        !layer.height.trim() ||
        isNaN(parseInt(layer.width)) ||
        isNaN(parseInt(layer.height))
      ) {
        setGeneralError(
          language === 'zh'
            ? `请为第${i + 1}级网格填写有效的宽度和高度`
            : `Please enter valid width and height for grid level ${i + 1}`
        );
        setFormErrors(errors);
        return;
      }
    }

    if (Object.keys(layerErrors).length > 0) {
      setGeneralError(
        language === 'zh'
          ? '请修正网格层级中的错误'
          : 'Please fix errors in grid levels'
      );
      setFormErrors(errors);
      return;
    }

    setFormErrors(errors);

    // 获取转换后的坐标
    if (!convertedCoord) {
      setGeneralError(
        language === 'zh'
          ? '无法获取转换后的坐标'
          : 'Unable to get converted coordinates'
      );
      return;
    }

    // 组织数据成需要的格式
    const schemaData = {
      name: name,
      epsg: parseInt(epsg),
      base_point: [
        parseFloat(convertedCoord.x),
        parseFloat(convertedCoord.y)
      ],
      grid_info: gridLayers.map(layer => [
        parseInt(layer.width),
        parseInt(layer.height)
      ])
    };

    console.log('提交数据:', schemaData);

    // 将JSON数据下载为本地文件
    const downloadJsonFile = (data: any, filename: string) => {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };

    // 先下载JSON文件
    downloadJsonFile(schemaData, `${name}.json`);

    // 使用worker调用createSchema函数
    setGeneralError(
      language === 'zh'
        ? '正在提交数据...'
        : 'Submitting data...'
    );

    try {
      // 创建Worker
      const worker = new Worker(new URL('../../core/worker/base.worker.ts', import.meta.url), { type: 'module' });
      
      // 创建Actor用于和Worker通信
      const actor = new Actor(worker, {});
      
      // 发送任务到Worker
      actor.send('createSchema', schemaData, ((error, result) => {
        if (error) {
          console.error('Worker错误:', error);
          setGeneralError(
            language === 'zh'
              ? `提交失败: ${error.message}`
              : `Submission failed: ${error.message}`
          );
          
          // 即使出错，也清理地图标记
          clearMapMarkers();

          if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
              window.mapInstance.getCanvas().style.cursor = '';
            }
            setIsSelectingPoint(false);
          }
          
          // 即使出错，延迟后也返回上一页
          setTimeout(() => {
            if (onBack) {
              onBack();
            }
          }, 3000);
        } else {
          console.log('提交成功:', result);
          setGeneralError(
            language === 'zh'
              ? '提交成功!'
              : 'Submission successful!'
          );
          
          // 成功后清理地图标记
          clearMapMarkers();

          if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
              window.mapInstance.getCanvas().style.cursor = '';
            }
            setIsSelectingPoint(false);
          }
          
          // 成功后重定向到第一页（确保显示新创建的模板）
          window.location.hash = '#/schemas?page=1';
          
          // 成功后延迟返回，这将触发页面重新渲染，地图也会刷新
          setTimeout(() => {
            if (onBack) {
              onBack();
            }
          }, 1000);
        }
        
        // 任务完成后终止worker
        setTimeout(() => {
          actor.remove();
          worker.terminate();
        }, 100);
      }) as Callback<any>);
    } catch (error) {
      console.error('创建Worker出错:', error);
      setGeneralError(
        language === 'zh'
          ? `创建Worker出错: ${error instanceof Error ? error.message : String(error)}`
          : `Error creating worker: ${error instanceof Error ? error.message : String(error)}`
      );
      
      // 即使出错，也清理地图标记
      clearMapMarkers();

      if (isSelectingPoint && window.mapInstance) {
        if (window.mapInstance.getCanvas()) {
          window.mapInstance.getCanvas().style.cursor = '';
        }
        setIsSelectingPoint(false);
      }
      
      // 即使出错，也重定向到第一页并返回上一页
      window.location.hash = '#/schemas?page=1';
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 3000);
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
      const mapInstance = window.mapInstance;

      const handleTempClick = (e: mapboxgl.MapMouseEvent) => {
        setLon(e.lngLat.lng.toFixed(6));
        setLat(e.lngLat.lat.toFixed(6));

        clearMapMarkers();

        new mapboxgl.Marker({
          color: '#FF0000',
        })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(mapInstance);

        mapInstance.off('click', handleTempClick);

        if (mapInstance.getCanvas()) {
          mapInstance.getCanvas().style.cursor = '';
        }

        setIsSelectingPoint(false);
      };

      if (mapInstance.getCanvas()) {
        mapInstance.getCanvas().style.cursor = 'crosshair';
      }

      mapInstance.once('click', handleTempClick);
    }
  };

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
    validateGridLayers();
  };

  const handleUpdateHeight = (id: number, height: string) => {
    setGridLayers(
      gridLayers.map((layer) =>
        layer.id === id ? { ...layer, height } : layer
      )
    );
    validateGridLayers();
  };

  const handleRemoveLayer = (id: number) => {
    setGridLayers(gridLayers.filter((layer) => layer.id !== id));

    // 移除相关错误
    const newErrors = { ...layerErrors };
    delete newErrors[id];
    setLayerErrors(newErrors);
  };

  const validateGridLayers = () => {
    const errors: Record<number, string> = {};

    gridLayers.forEach((layer, index) => {
      // 检查宽高是否有值
      if (!layer.width.trim() || !layer.height.trim()) {
        errors[layer.id] =
          language === 'zh'
            ? '宽度和高度不能为空'
            : 'Width and height cannot be empty';
        return;
      }

      const currentWidth = parseInt(layer.width);
      const currentHeight = parseInt(layer.height);

      // 检查宽高是否为有效数字
      if (
        isNaN(currentWidth) ||
        isNaN(currentHeight) ||
        currentWidth <= 0 ||
        currentHeight <= 0
      ) {
        errors[layer.id] =
          language === 'zh'
            ? '宽度和高度必须是大于0的数字'
            : 'Width and height must be positive numbers';
        return;
      }

      if (index > 0) {
        const prevLayer = gridLayers[index - 1];
        const prevWidth = parseInt(prevLayer.width);
        const prevHeight = parseInt(prevLayer.height);

        if (currentWidth >= prevWidth || currentHeight >= prevHeight) {
          errors[layer.id] =
            language === 'zh'
              ? '单元格尺寸应小于前一层级'
              : 'Cell dimensions should be smaller than previous level';
        }

        if (
          prevWidth % currentWidth !== 0 ||
          prevHeight % currentHeight !== 0
        ) {
          errors[layer.id] =
            language === 'zh'
              ? '前一层级的宽度/高度必须是当前层级的倍数'
              : "Previous level's dimensions must be multiples of current level's";
        }
      }
    });

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
        <form onSubmit={handleSubmit} className="p-2 pt-0 -mt-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-3">
                {/* 名称卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold mb-2">
                    {language === 'zh' ? '新模板名称' : 'New Schema Name'}
                  </h2>
                  <div className="space-y-2">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        language === 'zh'
                          ? '输入新模式名称'
                          : 'Enter new schema name'
                      }
                      className={`w-full ${
                        formErrors.name
                          ? 'border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                    />
                  </div>
                </div>

                {/* EPSG卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                  <h2 className="text-lg font-semibold mb-2">
                    {language === 'zh' ? 'EPSG代码' : 'EPSG Code'}
                  </h2>
                  <div className="space-y-2">
                    <Input
                      id="epsg"
                      placeholder={
                        language === 'zh'
                          ? '输入EPSG代码 (例如: 4326)'
                          : 'Enter EPSG code (e.g. 4326)'
                      }
                      className={`w-full ${
                        formErrors.epsg
                          ? 'border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                      value={epsg}
                      onChange={(e) => setEpsg(e.target.value)}
                    />
                  </div>
                </div>

                {/* 坐标卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                  <h2 className="text-lg font-semibold mb-2">
                    {language === 'zh' ? '坐标' : 'Coordinate'} (EPSG:4326)
                  </h2>
                  <div className="flex items-stretch gap-4">
                    {/* 左侧经纬度输入 */}
                    <div className="flex-1 flex flex-col justify-between">
                      {/* 经度输入框 */}
                      <div className="flex items-center gap-2 mb-2">
                        <Label
                          htmlFor="lon"
                          className="text-sm font-medium w-1/4"
                        >
                          {language === 'zh' ? '经度' : 'Longitude'}
                        </Label>
                        <Input
                          id="lon"
                          type="number"
                          step="0.000001"
                          value={lon}
                          onChange={(e) => setLon(e.target.value)}
                          placeholder={
                            language === 'zh' ? '输入经度' : 'Enter longitude'
                          }
                          className={`w-3/4 ${
                            formErrors.coordinates
                              ? 'border-red-500 focus:ring-red-500'
                              : ''
                          }`}
                        />
                      </div>

                      {/* 纬度输入框 */}
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="lat"
                          className="text-sm font-medium w-1/4"
                        >
                          {language === 'zh' ? '纬度' : 'Latitude'}
                        </Label>
                        <Input
                          id="lat"
                          type="number"
                          step="0.000001"
                          value={lat}
                          onChange={(e) => setLat(e.target.value)}
                          placeholder={
                            language === 'zh' ? '输入纬度' : 'Enter latitude'
                          }
                          className={`w-3/4 ${
                            formErrors.coordinates
                              ? 'border-red-500 focus:ring-red-500'
                              : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* 右侧Draw按钮 */}
                    <Button
                      type="button"
                      onClick={handleDraw}
                      className={`w-[80px] h-[84px] ${
                        isSelectingPoint
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white cursor-pointer`}
                    >
                      <div className="flex flex-col items-center">
                        {isSelectingPoint ? (
                          <X className="h-8 w-8 mb-1 font-bold stroke-6" />
                        ) : (
                          <MapPin className="h-8 w-8 mb-1 stroke-2" />
                        )}
                        <span>
                          {isSelectingPoint
                            ? language === 'zh'
                              ? '取消'
                              : 'Cancel'
                            : language === 'zh'
                            ? '绘制'
                            : 'Draw'}
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* 转换后坐标卡片 */}
                {convertedCoord && epsg && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
                    <h2 className="text-lg font-semibold mb-2">
                      {language === 'zh' ? '转换后坐标' : 'Converted Coordinate'} (EPSG:{epsg})
                    </h2>
                    <div className="flex-1 flex flex-col justify-between">
                      {/* X坐标显示 */}
                      <div className="flex items-center gap-2 mb-2">
                        <Label
                          className="text-sm font-medium w-1/4"
                        >
                          X
                        </Label>
                        <div className="w-3/4 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                          {convertedCoord.x}
                        </div>
                      </div>

                      {/* Y坐标显示 */}
                      <div className="flex items-center gap-2">
                        <Label
                          className="text-sm font-medium w-1/4"
                        >
                          Y
                        </Label>
                        <div className="w-3/4 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                          {convertedCoord.y}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 网格层级组件 */}
                <GridLevel
                  layers={gridLayers}
                  layerErrors={layerErrors}
                  onAddLayer={handleAddLayer}
                  onUpdateWidth={handleUpdateWidth}
                  onUpdateHeight={handleUpdateHeight}
                  onRemoveLayer={handleRemoveLayer}
                />

                {/* 提交按钮 */}
                {generalError && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {generalError}
                  </div>
                )}

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
