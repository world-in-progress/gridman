import store from '@/store'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Tab } from '../tabBar/types'
import { convertToWGS84 } from './utils'
import { MapContainerProps } from './types'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { GridSchema } from '../../core/apis/types'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { SceneNode } from '../resourceScene/scene'
import { SchemasPageContext } from '@/resource/scenario/schemas/schemas'
import { enableMapPointSelection } from './utils'

const initialLongitude = 114.051537
const initialLatitude = 22.446937
const initialZoom = 11
const maxZoom = 22

export interface MapContainerHandles {
    showSchemaMarkerOnMap: (schemas: GridSchema[]) => void
    flyToSchema: (schema: GridSchema) => void
    getMap: () => mapboxgl.Map | null
    enableDrawMode: (callback: (lng: number, lat: number) => void) => void
    disableDrawMode: () => void
    clearAllMarkers: () => void
}

// interface ExtendedMapContainerProps extends MapContainerProps {
//     activeTab?: Tab;
// }

declare global {
    interface Window {
        // mapInstance?: mapboxgl.Map
        mapboxDrawInstance?: MapboxDraw;
    }
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            // func.apply(null, args);
        }, delay);
    };
};

const MapContainer = forwardRef<
    MapContainerHandles,
    MapContainerProps
>((props, ref) => {
    const { node } = props;
    // const { activeTab } = props;
    // const { mapContent } = useMapContent();

    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
    const activePopupRef = useRef<mapboxgl.Marker | null>(null);
    const isUnmountedRef = useRef(false);

    const clearAllMarkers = () => {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
        markerMapRef.current.clear()
        console.log('clearAllMarkers')
    }

    const closeActivePopup = () => {
        if (activePopupRef.current) {
            if (activePopupRef.current.getPopup()?.isOpen()) {
                activePopupRef.current.togglePopup()
            }
            activePopupRef.current = null
        }
    }

    const showSchemaMarkerOnMap = (schemas: GridSchema[]) => {
        const map = mapRef.current
        if (!map) return

        clearAllMarkers()

        const newMarkers: mapboxgl.Marker[] = []

        schemas.forEach((schema) => {
            if (schema.base_point && schema.epsg) {
                const coordinates = convertToWGS84(schema.base_point, schema.epsg)

                if (coordinates[0] !== 0 || coordinates[1] !== 0) {
                    const gridInfoHtml = schema.grid_info
                        .map((grid: [number, number], index: number) => `Level ${index + 1}: ${grid[0]} × ${grid[1]}`)
                        .join('<br>');

                    const popupId = `schema-popup-${schema.name.replace(/\s+/g, '-')}`;

                    const popupHtml = `
                        <div id="${popupId}" style="max-width: 300px; color: black; padding: 10px; font-family: sans-serif;">
                          <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #333;">${schema.name}</h3>
                          <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px;"></div>
                          <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>EPSG:</strong> ${schema.epsg}
                          </div>
                          <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>WGS84:</strong> [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]
                          </div>
                          <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>Base:</strong> [${schema.base_point[0].toFixed(2)}, ${schema.base_point[1].toFixed(2)}]
                          </div>
                          <div style="font-size: 12px;">
                            <strong>Grid:</strong><br>${gridInfoHtml}
                          </div>
                          ${schema.starred ? `<div style="margin-top: 6px;"><span style="color: #f59e0b; font-size: 12px;">★ Starred</span></div>` : ''}
                        </div>`;

                    const popup = new mapboxgl.Popup({
                        offset: 25,
                        maxWidth: '320px',
                        className: 'custom-popup',
                    }).setHTML(popupHtml);

                    popup.on('open', () => {
                        setTimeout(() => {
                            const closeButton = document.querySelector('.custom-popup .mapboxgl-popup-close-button');
                            if (closeButton) {
                                const btn = closeButton as HTMLElement;
                                btn.style.fontSize = '24px';
                                btn.style.color = 'red';
                                btn.style.lineHeight = '1';
                                btn.style.padding = '4px 8px';
                                btn.style.height = 'auto';
                                btn.style.width = 'auto';
                            }
                        }, 10);
                    });

                    const marker = new mapboxgl.Marker({ color: schema.starred ? '#f59e0b' : '#00FF00' })
                        .setLngLat(coordinates)
                        .setPopup(popup)
                        .addTo(map);

                    marker.getElement().addEventListener('click', () => {
                        closeActivePopup();
                        activePopupRef.current = marker;
                    });

                    newMarkers.push(marker);
                    if (schema.name) {
                        markerMapRef.current.set(schema.name, marker);
                    }
                }
            }
        });

        markersRef.current = newMarkers;
    }

    const flyToSchema = (schema: GridSchema) => {
        const map = mapRef.current;
        if (!map || !schema.base_point || !schema.epsg) return;

        const coordinates = convertToWGS84(schema.base_point, schema.epsg);
        if (coordinates[0] === 0 && coordinates[1] === 0) return;

        const marker = markerMapRef.current.get(schema.name);

        if (marker) {
            closeActivePopup();
            map.flyTo({
                center: marker.getLngLat(),
                zoom: 16,
                essential: true,
                duration: 1000,
            });
            setTimeout(() => {
                activePopupRef.current = marker;
                marker.togglePopup();
            }, 1200);
        } else {
            showSchemaMarkerOnMap([schema]);
            const newMarker = markerMapRef.current.get(schema.name);
            if (newMarker) {
                map.flyTo({
                    center: newMarker.getLngLat(),
                    zoom: 16,
                    essential: true,
                    duration: 1000,
                });
                setTimeout(() => {
                    activePopupRef.current = newMarker;
                    newMarker.togglePopup();
                }, 1200);
            }
        }
    };

    const enableDrawMode = (callback: (lng: number, lat: number) => void) => {
        const map = mapRef.current;
        if (!map) return;
        
        if (map.getCanvas()) {
            map.getCanvas().style.cursor = 'crosshair';
        }
        
        return enableMapPointSelection(map, callback);
    };
    
    const disableDrawMode = () => {
        const map = mapRef.current;
        if (!map) return;
        
        if (map.getCanvas()) {
            map.getCanvas().style.cursor = '';
        }
    };

    useImperativeHandle(ref, () => ({
        showSchemaMarkerOnMap,
        flyToSchema,
        getMap: () => mapRef.current,
        enableDrawMode,
        disableDrawMode,
        clearAllMarkers,
    }))

    useEffect(() => {
        if (!node) return;
        
        const _node = node as SceneNode;
        const context = _node.pageContext as SchemasPageContext;
        
        if (context && context.mapState.isDrawingPoint) {
            const map = mapRef.current;
            if (map && map.getCanvas()) {
                map.getCanvas().style.cursor = 'crosshair';
            }
        }
    }, [node])

    useEffect(() => {
        isUnmountedRef.current = false
        mapboxgl.accessToken = import.meta.env.VITE_MAP_TOKEN
        let mapInstance: mapboxgl.Map | null = null
        let resizer: ResizeObserver | null = null

        if (mapWrapperRef.current) {
            mapInstance = new mapboxgl.Map({
                container: mapWrapperRef.current,
                style: "mapbox://styles/mapbox/streets-v12",
                projection: 'globe',
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            })
            store.set('map', mapInstance)

            mapRef.current = mapInstance

            if (mapWrapperRef.current) {
                if (mapInstance) {
                    mapInstance.on('style.load', () => {
                        mapInstance!.setFog({})
                    })
                }

                const currentMapInstance = mapInstance;
                resizer = new ResizeObserver(
                    debounce(() => {
                        if (!isUnmountedRef.current) {
                            currentMapInstance?.resize();
                        }
                    }, 100)
                );
                resizer.observe(mapWrapperRef.current);
            }
        }

        return () => {
            isUnmountedRef.current = true;
            if (resizer && mapWrapperRef.current) {
                resizer.unobserve(mapWrapperRef.current)
                resizer.disconnect()
            }
            if (mapInstance) {
                mapInstance.remove()
            }
            mapRef.current = null
        }
    }, [])

    return (
        <div className="relative w-full h-full" ref={mapWrapperRef} />
    )
})

export default MapContainer
