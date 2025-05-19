
import { createContext } from 'react';
import { SidebarType } from './components/page';
import GridCore from './core/grid/NHGridCore';

export const SidebarContext = createContext<{
    activeSidebar: SidebarType;
    setActiveSidebar: (type: SidebarType) => void;
}>({
    activeSidebar: 'grid',
    setActiveSidebar: () => {},
});

export const LanguageContext = createContext<{
    language: 'zh' | 'en';
    setLanguage: (lang: 'zh' | 'en') => void;
}>({
    language: 'en',
    setLanguage: () => {},
});

export const AIDialogContext = createContext<{
    aiDialogEnabled: boolean;
    setAIDialogEnabled: (enabled: boolean) => void;
}>({
    aiDialogEnabled: false,
    setAIDialogEnabled: () => {},
});