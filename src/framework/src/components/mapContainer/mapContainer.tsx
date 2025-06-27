import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import NHMap from '../../../../frontend/src/components/mapComponent/utils/NHMap';
import { MapContainerProps } from './types';


const initialLongitude = 114.051537
const initialLatitude = 22.446937
const initialZoom = 11
const maxZoom = 22

const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const MapContainer: React.FC<MapContainerProps> = ({ activityBarItems, activeActivity }) => {

    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<NHMap | null>(null);

    useEffect(() => {
        mapboxgl.accessToken = "pk.eyJ1IjoieWNzb2t1IiwiYSI6ImNrenozdWdodDAza3EzY3BtdHh4cm5pangifQ.ZigfygDi2bK4HXY1pWh-wg";
        let mapInstance: NHMap | null = null;
        let resizer: ResizeObserver | null = null;

        if (mapWrapperRef.current) {
            mapInstance = new NHMap({
                container: mapWrapperRef.current,
                style: "mapbox://styles/mapbox/navigation-night-v1",
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            });

            setMap(mapInstance);

            if (mapWrapperRef.current) {
                const currentMapInstance = mapInstance; 
                resizer = new ResizeObserver(
                    debounce(() => {
                        currentMapInstance?.resize();
                    }, 100)
                );
                resizer.observe(mapWrapperRef.current);
            }
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
            }
            if (resizer && mapWrapperRef.current) {
                resizer.unobserve(mapWrapperRef.current);
                resizer.disconnect();
            }
            setMap(null);
        };
    }, []);

    return (
        <div className="relative w-full h-full" ref={mapWrapperRef} />
    )
}

export default MapContainer
