import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContainerProps } from './types';
import MapboxDraw from "@mapbox/mapbox-gl-draw";


const initialLongitude = 114.051537
const initialLatitude = 22.446937
const initialZoom = 11
const maxZoom = 22

interface ExtendedMapContainerProps extends MapContainerProps {
    onMapLoad?: (map: mapboxgl.Map) => void;
}

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
            func.apply(null, args);
        }, delay);
    };
};

const MapContainer: React.FC<ExtendedMapContainerProps> = ({ onMapLoad }) => {

    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const isUnmountedRef = useRef(false);

    useEffect(() => {
        isUnmountedRef.current = false;
        mapboxgl.accessToken = "pk.eyJ1IjoieWNzb2t1IiwiYSI6ImNrenozdWdodDAza3EzY3BtdHh4cm5pangifQ.ZigfygDi2bK4HXY1pWh-wg";
        let mapInstance: mapboxgl.Map | null = null;
        let resizer: ResizeObserver | null = null;
        let drawInstance: MapboxDraw | null = null;

        if (mapWrapperRef.current) {
            mapInstance = new mapboxgl.Map({
                container: mapWrapperRef.current,
                // style: "mapbox://styles/mapbox/navigation-night-v1",
                style: "mapbox://styles/mapbox/streets-v12",
                projection: 'globe',
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            });

            setMap(mapInstance);
            if (onMapLoad) {
                onMapLoad(mapInstance);
            }

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
                resizer.unobserve(mapWrapperRef.current);
                resizer.disconnect();
            }
            if (mapInstance) {
                mapInstance.remove();
            }
            setMap(null);
        };
    }, []);

    return (
        <div className="relative w-full h-full" ref={mapWrapperRef} />
    )
}

export default MapContainer
