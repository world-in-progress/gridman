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
  
  // Find the adjusted bounds from first rule
  let adjustedBounds = [coords.southWest[0], coords.southWest[1], coords.northEast[0], coords.northEast[1]];
  if (sortedRules.length > 0 && sortedRules[0].adjustedBounds) {
    adjustedBounds = sortedRules[0].adjustedBounds;
  }
  
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
  
  // Build size object for each layer
  const layerSizesObject: Record<string, [number, number]> = {};
  const layerNames = ['first_size', 'second_size', 'third_size', 'fourth_size', 'fifth_size', 'sixth_size'];
  
  sortedLayers.forEach((layer, index) => {
    if (index < layerNames.length) {
      layerSizesObject[layerNames[index]] = [
        parseInt(layer.width) || 0,
        parseInt(layer.height) || 0
      ];
    }
  });
  
  return {
    "epsg": targetEPSG === '4326' ? 4326 : parseInt(targetEPSG),
    "bounds": [
      adjustedBounds[0],  // minx (adjusted)
      adjustedBounds[1],  // miny (adjusted)
      adjustedBounds[2],  // maxx (adjusted)
      adjustedBounds[3]   // maxy (adjusted)
    ],
    ...layerSizesObject,
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