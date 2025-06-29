import React, { createContext, useState, useContext } from 'react';
import { MapContentContextType, MapContentProviderProps } from './types';
import { GridSchema } from '../core/apis/types';

const MapContentContext = createContext<MapContentContextType | undefined>(undefined);

export const useMapContent = () => {
    const context = useContext(MapContentContext);
    if (!context) {
        throw new Error('useMapContent must be used within a MapContentProvider');
    }
    return context;
};


export const MapContentProvider: React.FC<MapContentProviderProps> = ({ children }) => {
    const [mapContent, setMapContent] = useState<{ [key: string]: GridSchema[] }>({});

    const setMapContentForTab = (tabId: string, schemas: GridSchema[]) => {
        setMapContent(prev => ({
            ...prev,
            [tabId]: schemas,
        }));
    };

    const getContentForTab = (tabId: string) => {
        return mapContent[tabId];
    }

    const value = {
        mapContent,
        setMapContentForTab,
        getContentForTab
    };

    return (
        <MapContentContext.Provider value={value}>
            {children}
        </MapContentContext.Provider>
    );
}; 