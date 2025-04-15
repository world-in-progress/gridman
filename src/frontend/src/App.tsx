import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
// import MapInit from './components/mapComponent/mapInit';
// import OperatePanel, {
//   RectangleCoordinates,
// } from './components/operatePanel/operatePanel';
// import { useRef, useState } from 'react';
import Page, { SidebarType } from './components/page'
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

  const [activeSidebar, setActiveSidebar] = useState<SidebarType>('operate');
  const [language, setLanguage] = useState<'zh' | 'en'>('en');

  const handleNavClick = (item: string) => {
    if (item === 'Schema' || item === '模板') {
      setActiveSidebar('schema');
    } else if (item === 'New' || item === '新建') {
      setActiveSidebar('operate');
    }
  };

  // const mapRef = useRef<{ startDrawRectangle: (cancel?: boolean) => void }>(
  //   null
  // );
  // const [rectangleCoordinates, setRectangleCoordinates] =
  //   useState<RectangleCoordinates | null>(null);
  // const [isDrawing, setIsDrawing] = useState(false);

  // const handleDrawRectangle = (currentlyDrawing: boolean) => {
  //   if (mapRef.current) {
  //     mapRef.current.startDrawRectangle(currentlyDrawing);
  //     setIsDrawing(!currentlyDrawing);
  //   }
  // };

  // const handleRectangleDrawn = (coordinates: RectangleCoordinates | null) => {
  //   setRectangleCoordinates(coordinates);
  //   setIsDrawing(false);
  // };

  return (
    // <div className="h-screen w-screen flex flex-row">
    //   <div className="w-1/5">
    //     <OperatePanel
    //       onDrawRectangle={handleDrawRectangle}
    //       rectangleCoordinates={rectangleCoordinates}
    //       isDrawing={isDrawing}
    //     />
    //   </div>
    //   <div className="w-4/5">
    //     <MapInit ref={mapRef} onRectangleDrawn={handleRectangleDrawn} />
    //   </div>
    // </div>
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
