import { LayerSize, SubdivideRule, RectangleCoordinates } from '../types/types';

// Generate JSON data
export const generateJSONData = (
  targetEPSG: string,
  layers: LayerSize[],
  subdivideRules: SubdivideRule[],
  rectangleCoordinates: RectangleCoordinates | null,
  convertedCoordinates: RectangleCoordinates | null
) => {
  // Sort layers and rules to maintain hierarchy
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
  const sortedRules = [...subdivideRules].sort((a, b) => a.id - b.id);

  // Use actual coordinates (original or converted)
  const coords = targetEPSG !== '4326' && convertedCoordinates ? convertedCoordinates : rectangleCoordinates;
  if (!coords) return null;
  
  // Get bounds from coordinates
  const adjustedBounds = [coords.southWest[0], coords.southWest[1], coords.northEast[0], coords.northEast[1]];
  
  // Build subdivide_rules array
  const subdivideRulesArray = [];
  
  // First rule is basic grid division
  const firstRule = sortedRules[0];
  if (firstRule && firstRule.cols > 0 && firstRule.rows > 0) {
    subdivideRulesArray.push([
      firstRule.cols,
      firstRule.rows
    ]);
    
    // Add ratio relationship between adjacent layers
    for (let i = 1; i < sortedLayers.length; i++) {
      if (i < sortedRules.length) {
        const rule = sortedRules[i];
        if (rule && rule.xRatio > 0 && rule.yRatio > 0) {
          // Change ratio to 1x1 for last layer
          if (i === sortedLayers.length - 1) {
            subdivideRulesArray.push([1, 1]);
          } else {
            subdivideRulesArray.push([
              Math.round(rule.xRatio),
              Math.round(rule.yRatio)
            ]);
          }
        }
      }
    }
  }
  
  // Only get the first layer size
  const firstLayer = sortedLayers[0];
  if (!firstLayer) return null;
  
  return {
    "epsg": targetEPSG === '4326' ? 4326 : parseInt(targetEPSG),
    "bounds": [
      adjustedBounds[0],  // minx (adjusted)
      adjustedBounds[1],  // miny (adjusted)
      adjustedBounds[2],  // maxx (adjusted)
      adjustedBounds[3]   // maxy (adjusted)
    ],
    "first_size": [
      parseInt(firstLayer.width) || 0,
      parseInt(firstLayer.height) || 0
    ],
    "subdivide_rules": subdivideRulesArray
  };
};

// Download JSON file
export const downloadJSON = (jsonData: any) => {
  if (!jsonData) return false;
  
  // Create Blob with JSON data
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schema.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
};

export const sendJSONToInit = async (jsonData: any) => {
  if (!jsonData) return false;
  
  try {
    const response = await fetch('http://127.0.0.1/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending JSON to init endpoint:', error);
    return false;
  }
}; 