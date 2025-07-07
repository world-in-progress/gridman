import mapboxgl from 'mapbox-gl';
import { Schema } from '../types/types';
import { convertToWGS84 } from './utils';

export class MapMarkerManager {
	private markers: mapboxgl.Marker[] = [];
	private markerMap: Map<string, mapboxgl.Marker> = new Map();
	private language: string;
	private onHighlightSchema: (schemaName: string) => void;
	private activePopup: mapboxgl.Marker | null = null;

	constructor(
		language: string,
		onHighlightSchema: (schemaName: string) => void
	) {
		this.language = language;
		this.onHighlightSchema = onHighlightSchema;
	}

	public clearAllMarkers(): void {
		this.markers.forEach((marker) => marker.remove());
		this.markers = [];
		this.markerMap.clear();
		this.activePopup = null;
	}

	private closeActivePopup(): void {
		try {
			if (this.activePopup) {
				const popup = this.activePopup.getPopup();
				if (popup && popup.isOpen && popup.isOpen()) {
					this.activePopup.togglePopup();
				}
			}
		} catch (e) {
			console.error('Error closing popup:', e);
		}
		this.activePopup = null;
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
              <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: bold; color: #333;">${schema.name
						}</h3>
              <div style="border-bottom: 1px solid #C4C4C4; margin-bottom: 4px;"></div>
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>EPSG:</strong> ${schema.epsg}
              </div>
              
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${this.language === 'zh' ? 'WGS84基准点' : 'WGS84 Base Point'
						}:</strong> [${coordinates[0].toFixed(
							6
						)}, ${coordinates[1].toFixed(6)}]
              </div>
              
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${this.language === 'zh'
							? '转换后基准点'
							: 'Transformed Base Point'
						}:</strong> [${schema.base_point[0].toFixed(
							2
						)}, ${schema.base_point[1].toFixed(2)}]
              </div>
              
              <div style="font-size: 12px;">
                <strong>${this.language === 'zh' ? '网格层级' : 'Grid Info'
						}:</strong><br>
                ${gridInfoHtml}
              </div>
              
              ${schema.starred
							? `<div style="margin-top: 6px;"><span style="color: #f59e0b; font-size: 12px;">★ ${this.language === 'zh' ? '已标星' : 'Starred'
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
						color: schema.starred ? '#f59e0b' : '#00FF00',
					})
						.setLngLat(coordinates)
						.setPopup(popup)
						.addTo(window.mapInstance as mapboxgl.Map);
					const markerElement = marker.getElement();
					markerElement.addEventListener('click', () => {
						this.closeActivePopup();
						this.activePopup = marker;

						this.onHighlightSchema(schema.name);
						setTimeout(() => {
							const schemaCard = document.getElementById(
								`schema-card-${schema.name.replace(/\s+/g, '-')}`
							);
							if (schemaCard) {
								schemaCard.scrollIntoView({
									behavior: 'smooth',
									block: 'nearest',
								});
							}
						}, 100);
					});

					newMarkers.push(marker);

					if (schema.name) {
						this.markerMap.set(schema.name, marker);
					}
				}
			}
		});

		this.markers = newMarkers;
	}

	public flyToSchema(schema: Schema): void {
		if (!window.mapInstance || !schema.base_point || !schema.epsg) {
			return;
		}

		this.onHighlightSchema(schema.name);

		const coordinates = convertToWGS84(schema.base_point, schema.epsg);

		if (coordinates[0] === 0 && coordinates[1] === 0) {
			return;
		}

		const marker = this.markerMap.get(schema.name);

		if (marker) {
			this.closeActivePopup();

			window.mapInstance.flyTo({
				center: marker.getLngLat(),
				zoom: 16,
				essential: true,
				duration: 1000,
			});

			setTimeout(() => {
				this.activePopup = marker;
				marker.togglePopup();
			}, 1200);
		} else {
			setTimeout(() => {
				const allSchemas = [schema];
				this.showAllSchemasOnMap(allSchemas);

				const newMarker = this.markerMap.get(schema.name);

				if (newMarker) {
					this.closeActivePopup();

					this.activePopup = newMarker;
					newMarker.togglePopup();
				}
			}, 1100);
		}
	}

	public setLanguage(language: string): void {
		this.language = language;
	}

	public getMarkers(): mapboxgl.Marker[] {
		return this.markers;
	}

	public getMarkerByName(name: string): mapboxgl.Marker | undefined {
		return this.markerMap.get(name);
	}
}
