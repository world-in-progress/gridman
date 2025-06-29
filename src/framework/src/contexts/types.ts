import { ReactNode } from 'react';
import { GridSchema } from '../core/apis/types';

export interface MapContentContextType {
    mapContent: { [key: string]: GridSchema[] };
    setMapContentForTab: (tabId: string, schemas: GridSchema[]) => void;
    getContentForTab: (tabId: string) => GridSchema[] | undefined;
}

export interface MapContentProviderProps {
    children: ReactNode;
}