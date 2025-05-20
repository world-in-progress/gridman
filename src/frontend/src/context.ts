
import { createContext } from 'react';
import { SidebarType } from './components/page';

export const SidebarContext = createContext<{
    activeNavbar: SidebarType;
    setActiveNavbar: (type: SidebarType) => void;
}>({
    activeNavbar: 'grid',
    setActiveNavbar: () => {},
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