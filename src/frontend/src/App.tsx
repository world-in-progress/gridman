import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Page, { SidebarType } from './components/page'
// import Page from './components/sideBar/page'
import { Navbar } from './components/navbar';
import { useState, createContext } from 'react';
import ChatPanel from './components/chatPanel/chatPanel';

// eslint-disable-next-line react-refresh/only-export-components
export const SidebarContext = createContext<{
    activeSidebar: SidebarType;
    setActiveSidebar: (type: SidebarType) => void;
}>({
    activeSidebar: 'operate',
    setActiveSidebar: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext<{
    language: 'zh' | 'en';
    setLanguage: (lang: 'zh' | 'en') => void;
}>({
    language: 'en',
    setLanguage: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const AIDialogContext = createContext<{
    aiDialogEnabled: boolean;
    setAIDialogEnabled: (enabled: boolean) => void;
}>({
    aiDialogEnabled: false,
    setAIDialogEnabled: () => { },
});

function App() {

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeSidebar, setActiveSidebar] = useState<SidebarType>('operate'); // Default to 'operate' for development
    const [language, setLanguage] = useState<'zh' | 'en'>('en');
    const [aiDialogEnabled, setAIDialogEnabled] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    }

    const handleNavClick = (item: string, type?: string) => {
        if (type === 'schema' || type === 'operate') {
            setActiveSidebar(type);
        } else if (item === 'Schema' || item === '模板') {
            setActiveSidebar('schema');
        } else if (item === 'New' || item === '新建') {
            setActiveSidebar('operate');
        }
    };

    return (
        <div className='App'>

            <LanguageContext.Provider value={{ language, setLanguage }}>
                <SidebarContext.Provider value={{ activeSidebar, setActiveSidebar }}>
                    <AIDialogContext.Provider value={{ aiDialogEnabled, setAIDialogEnabled }}>
                        <div className="flex flex-col h-screen">
                            <Navbar className="z-50 relative border-black" onNavItemClick={handleNavClick}></Navbar>
                            <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
                                <Page />
                            </div>
                        </div>
                    </AIDialogContext.Provider>
                </SidebarContext.Provider>
            </LanguageContext.Provider>


            <button 
                className="chat-toggle-button" 
                onClick={toggleChat}
            >
                {isChatOpen ? 'Close Chat' : 'Open AI Chat'}
            </button>
            
            <ChatPanel 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </div>
    );
}

export default App;
