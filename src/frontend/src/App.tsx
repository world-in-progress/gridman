import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Page, { SidebarType } from './components/page';
import { Navbar } from './components/navbar';
import { useState, createContext, RefObject } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Toaster } from '@/components/ui/sonner';
import { SidebarContext, LanguageContext, AIDialogContext } from './context';
import store from '@/store';
import Loader from './components/ui/loader';
import Home from './components/home';
import Simulation from './components/simulation';

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
        mapRef?: RefObject<any>;
    }
}

function App() {
    const [activeNavbar, setActiveNavbar] = useState<SidebarType>('grid'); // Default to 'grid' for development
    const [language, setLanguage] = useState<'zh' | 'en'>('en');
    const [aiDialogEnabled, setAIDialogEnabled] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    store.set('isLoading', {
        on: () => {
            setIsLoading(true);
        },
        off: () => {
            setIsLoading(false);
        },
    });

    const handleNavClick = (item: string, type?: string) => {
        if (type === 'home' || type === 'grid' || type === 'simulation') {
            setActiveNavbar(type);
        } else if (item === 'Home' || item === '首页') {
            setActiveNavbar('home');
        } else if (item === 'Grid' || item === '网格') {
            setActiveNavbar('grid');
        } else if (item === 'Simulation' || item === '模拟') {
            setActiveNavbar('simulation');
        }
    };

    return (
        <div className="App">
            <LanguageContext.Provider value={{ language, setLanguage }}>
                <SidebarContext.Provider
                    value={{ activeNavbar, setActiveNavbar }}
                >
                    <AIDialogContext.Provider
                        value={{ aiDialogEnabled, setAIDialogEnabled }}
                    >
                        <div className="flex flex-col h-screen">
                            {isLoading && (
                                <>
                                    <div
                                        className="fixed inset-0 pointer-events-auto z-80"
                                        style={{
                                            backgroundColor:
                                                'rgba(33, 33, 33, 0.4)',
                                        }}
                                    />
                                    <Loader />
                                </>
                            )}
                            <Navbar
                                className="z-50 relative border-black"
                                onNavItemClick={handleNavClick}
                            ></Navbar>
                            <div className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
                                {activeNavbar === 'home' && <Home/>}
                                {activeNavbar === 'grid' && <Page />}
                                {activeNavbar === 'simulation' && <Simulation/>}
                            </div>
                            <Toaster
                                position="bottom-right"
                                richColors
                                closeButton
                                style={{
                                    bottom: '5rem',
                                    right: '1.5rem',
                                }}
                            />
                        </div>
                    </AIDialogContext.Provider>
                </SidebarContext.Provider>
            </LanguageContext.Provider>
        </div>
    );
}

export default App;
