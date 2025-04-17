import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Page, { SidebarType } from './components/page'
// import Page from './components/sideBar/page'
import { Navbar } from './components/navbar';
import { useState, createContext } from 'react';

export const SidebarContext = createContext<{
  activeSidebar: SidebarType;
  setActiveSidebar: (type: SidebarType) => void;
}>({
  activeSidebar: 'operate',
  setActiveSidebar: () => {},
});

export const LanguageContext = createContext<{
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
}>({
  language: 'en',
  setLanguage: () => {},
});

function App() {

  const [activeSidebar, setActiveSidebar] = useState<SidebarType>('operate');//暂设默认显示方便调整
  const [language, setLanguage] = useState<'zh' | 'en'>('en');

  const handleNavClick = (item: string) => {
    if (item === 'Schema' || item === '模板') {
      setActiveSidebar('schema');
    } else if (item === 'New' || item === '新建') {
      setActiveSidebar('operate');
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <SidebarContext.Provider value={{ activeSidebar, setActiveSidebar }}>
        <div className="flex flex-col h-screen">
          <Navbar className="z-50 relative border-black" onNavItemClick={handleNavClick}></Navbar>
          <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
            <Page />
          </div>
        </div>
      </SidebarContext.Provider>
    </LanguageContext.Provider>
  );
}

export default App;
