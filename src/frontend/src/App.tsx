import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapInit from './components/mapComponent/mapInit';
import OperatePanel, {
  RectangleCoordinates,
} from './components/operatePanel/operatePanel';
import { useRef, useState } from 'react';

function App() {
  const mapRef = useRef<{ startDrawRectangle: (cancel?: boolean) => void }>(
    null
  );
  const [rectangleCoordinates, setRectangleCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDrawRectangle = (currentlyDrawing: boolean) => {
    if (mapRef.current) {
      mapRef.current.startDrawRectangle(currentlyDrawing);
      setIsDrawing(!currentlyDrawing);
    }
  };

  const handleRectangleDrawn = (coordinates: RectangleCoordinates | null) => {
    setRectangleCoordinates(coordinates);
    setIsDrawing(false);
  };

  return (
    <div className="h-screen w-screen flex flex-row">
      <div className="w-1/5">
        <OperatePanel
          onDrawRectangle={handleDrawRectangle}
          rectangleCoordinates={rectangleCoordinates}
          isDrawing={isDrawing}
        />
      </div>
      <div className="w-4/5">
        <MapInit ref={mapRef} onRectangleDrawn={handleRectangleDrawn} />
      </div>
    </div>
  );
}

export default App;
