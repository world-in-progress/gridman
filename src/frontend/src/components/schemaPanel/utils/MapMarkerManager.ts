import mapboxgl from 'mapbox-gl';
import { Schema } from '../types/types';
import { convertToWGS84 } from './utils';

export class MapMarkerManager {
  private markers: mapboxgl.Marker[] = [];
  private language: string;
  private onHighlightSchema: (schemaName: string) => void;
  private onNavigateToSchemaPage: (schemaName: string) => void;

  constructor(
    language: string, 
    onHighlightSchema: (schemaName: string) => void,
    onNavigateToSchemaPage: (schemaName: string) => void
  ) {
    this.language = language;
    this.onHighlightSchema = onHighlightSchema;
    this.onNavigateToSchemaPage = onNavigateToSchemaPage;
  }

  public clearAllMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  public showAllSchemasOnMap(schemas: Schema[]): void {
    if (!window.mapInstance) return;

    this.clearAllMarkers();

    const newMarkers: mapboxgl.Marker[] = [];

    schemas.forEach((schema) => {
      if (schema.base_point && schema.epsg) {
        const coordinates = convertToWGS84(schema.base_point, schema.epsg);

        if (coordinates[0] !== 0 || coordinates[1] !== 0) {
          const gridInfoHtml = schema.grid_info
            .map((grid, index) => `Level ${index + 1}: ${grid[0]} × ${grid[1]}`)
            .join('<br>');

          const popupId = `schema-popup-${schema.name.replace(/\s+/g, '-')}`;

          const popupHtml = `
            <div id="${popupId}" style="max-width: 640px;">
              <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: bold; color: #333;">${
                schema.name
              }</h3>
              <div style="border-bottom: 1px solid #C4C4C4; margin-bottom: 4px;"></div>
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>EPSG:</strong> ${schema.epsg}
              </div>
              
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${
                  this.language === 'zh' ? 'WGS84基准点' : 'WGS84 Base Point'
                }:</strong> [${coordinates[0].toFixed(
            6
          )}, ${coordinates[1].toFixed(6)}]
              </div>
              
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${
                  this.language === 'zh' ? '转换后基准点' : 'Transformed Base Point'
                }:</strong> [${schema.base_point[0].toFixed(
            2
          )}, ${schema.base_point[1].toFixed(2)}]
              </div>
              
              <div style="font-size: 12px;">
                <strong>${
                  this.language === 'zh' ? '网格层级' : 'Grid Info'
                }:</strong><br>
                ${gridInfoHtml}
              </div>
              
              ${
                schema.starred
                  ? `<div style="margin-top: 6px;"><span style="color: #f59e0b; font-size: 12px;">★ ${
                      this.language === 'zh' ? '已标星' : 'Starred'
                    }</span></div>`
                  : ''
              }
            </div>
          `;

          const popup = new mapboxgl.Popup({
            offset: 25,
            maxWidth: '300px',
            className: 'custom-popup',
          }).setHTML(popupHtml);

          popup.on('open', () => {
            this.onHighlightSchema(schema.name);
            
            setTimeout(() => {
              const closeButtons = document.getElementsByClassName(
                'mapboxgl-popup-close-button'
              );
              if (closeButtons.length > 0) {
                const closeButton = closeButtons[0] as HTMLElement;
                closeButton.innerHTML = '✕';
                closeButton.style.fontSize = '16px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.padding = '5px 8px';
                closeButton.style.background = 'transparent';
                closeButton.style.border = 'none';
                closeButton.style.cursor = 'pointer';
              }
            }, 10);
          });

          const marker = new mapboxgl.Marker({
            color: schema.starred ? '#f59e0b' : '#00FF00', // 标星的marker使用黄色
          })
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(window.mapInstance as mapboxgl.Map);

          // 添加点击事件，当marker被点击时高亮对应的schema卡片
          const markerElement = marker.getElement();
          markerElement.addEventListener('click', () => {
            this.onHighlightSchema(schema.name);
            
            // 确保schema在当前页面可见
            this.onNavigateToSchemaPage(schema.name);
            
            // 如果对应的卡片不在视图中，可以添加滚动到视图的逻辑
            setTimeout(() => {
              const schemaCard = document.getElementById(`schema-card-${schema.name.replace(/\s+/g, '-')}`);
              if (schemaCard) {
                schemaCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          });

          newMarkers.push(marker);
        }
      }
    });

    this.markers = newMarkers;
  }

  public flyToSchema(schema: Schema): void {
    if (!window.mapInstance || !schema.base_point || !schema.epsg) return;

    this.onHighlightSchema(schema.name);
    
    // 确保schema在当前页面可见
    this.onNavigateToSchemaPage(schema.name);

    const coordinates = convertToWGS84(schema.base_point, schema.epsg);

    if (coordinates[0] === 0 && coordinates[1] === 0) return;

    const existingMarkerIndex = this.markers.findIndex((marker) => {
      const lngLat = marker.getLngLat();
      return (
        Math.abs(lngLat.lng - coordinates[0]) < 0.000001 &&
        Math.abs(lngLat.lat - coordinates[1]) < 0.000001
      );
    });

    if (existingMarkerIndex !== -1) {
      window.mapInstance.flyTo({
        center: coordinates,
        zoom: 16,
        essential: true,
        duration: 1000,
      });

      setTimeout(() => {
        const marker = this.markers[existingMarkerIndex];
        marker.togglePopup();
      }, 1300);
    } else {
      setTimeout(() => {
        // 获取所有schema并显示在地图上
        const allSchemas = [schema]; // 最少展示当前schema
        this.showAllSchemasOnMap(allSchemas);

        setTimeout(() => {
          const newMarkerIndex = this.markers.findIndex((marker) => {
            const lngLat = marker.getLngLat();
            return (
              Math.abs(lngLat.lng - coordinates[0]) < 0.000001 &&
              Math.abs(lngLat.lat - coordinates[1]) < 0.000001
            );
          });

          if (newMarkerIndex !== -1) {
            this.markers[newMarkerIndex].togglePopup();
          }
        }, 100);
      }, 1100);
    }
  }

  // 更新语言
  public setLanguage(language: string): void {
    this.language = language;
  }

  // 获取标记
  public getMarkers(): mapboxgl.Marker[] {
    return this.markers;
  }
} 