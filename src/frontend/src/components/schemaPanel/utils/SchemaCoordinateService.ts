import proj4 from 'proj4';
import mapboxgl from 'mapbox-gl';
import { epsgDefinitions } from '../../operatePanel/utils/coordinateUtils';

/**
 * 将经纬度坐标从一个坐标系转换到另一个坐标系
 */
export const convertCoordinate = (
  lon: string,
  lat: string,
  fromEPSG: string,
  toEPSG: string
): { x: string; y: string } | null => {
  if (!lon || !lat || !fromEPSG || !toEPSG) return null;

  try {
    if (epsgDefinitions[fromEPSG]) {
      proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG]);
    }

    if (epsgDefinitions[toEPSG]) {
      proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG]);
    }

    const result = proj4(`EPSG:${fromEPSG}`, `EPSG:${toEPSG}`, [
      parseFloat(lon),
      parseFloat(lat),
    ]);

    return {
      x: result[0].toFixed(6),
      y: result[1].toFixed(6),
    };
  } catch (e) {
    console.error('坐标转换错误:', e);
    return null;
  }
};

/**
 * 清除地图上的所有标记
 */
export const clearMapMarkers = (): void => {
  const markers = document.getElementsByClassName('mapboxgl-marker');
  if (markers.length > 0) {
    Array.from(markers).forEach((marker) => {
      marker.remove();
    });
  }
};

/**
 * 启用地图点击选点模式
 */
export const enableMapPointSelection = (
  mapInstance: mapboxgl.Map | undefined,
  callback: (lng: number, lat: number) => void
): (() => void) => {
  if (!mapInstance) return () => {};

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    callback(e.lngLat.lng, e.lngLat.lat);
    
    clearMapMarkers();

    new mapboxgl.Marker({
      color: '#FF0000',
    })
      .setLngLat([e.lngLat.lng, e.lngLat.lat])
      .addTo(mapInstance);

    mapInstance.off('click', handleMapClick);

    if (mapInstance.getCanvas()) {
      mapInstance.getCanvas().style.cursor = '';
    }
  };

  if (mapInstance.getCanvas()) {
    mapInstance.getCanvas().style.cursor = 'crosshair';
  }

  mapInstance.once('click', handleMapClick);

  // 返回一个清理函数
  return () => {
    mapInstance.off('click', handleMapClick);
    if (mapInstance.getCanvas()) {
      mapInstance.getCanvas().style.cursor = '';
    }
  };
}; 