import { LayerSize, SubdivideRule, RectangleCoordinates } from '../types/types';


const errorTranslations = {
  widthSmaller: {
    en: (prevWidth: number) => `Width must be smaller than previous level's width (${prevWidth})`,
    zh: (prevWidth: number) => `宽度必须小于前一层级的宽度 (${prevWidth})`
  },
  widthMultiple: {
    en: (prevWidth: number, currentWidth: number) => 
      `Previous level's width (${prevWidth}) must be a multiple of current width (${currentWidth})`,
    zh: (prevWidth: number, currentWidth: number) => 
      `前一层级的宽度 (${prevWidth}) 必须是当前宽度 (${currentWidth}) 的倍数`
  },
  heightSmaller: {
    en: (prevHeight: number) => `Height must be smaller than previous level's height (${prevHeight})`,
    zh: (prevHeight: number) => `高度必须小于前一层级的高度 (${prevHeight})`
  },
  heightMultiple: {
    en: (prevHeight: number, currentHeight: number) => 
      `Previous level's height (${prevHeight}) must be a multiple of current height (${currentHeight})`,
    zh: (prevHeight: number, currentHeight: number) => 
      `前一层级的高度 (${prevHeight}) 必须是当前高度 (${currentHeight}) 的倍数`
  },
  and: {
    en: ` and `,
    zh: ` 且 `
  }
};

// Validate grid level size relationships
export const validateLayerHierarchy = (layers: LayerSize[], language: 'en' | 'zh' = 'en') => {
  if (layers.length <= 1) {
    return {};
  }

  const errors: {[key: number]: string} = {};
  
  // Sort layers by ID to maintain order
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
  
  for (let i = 1; i < sortedLayers.length; i++) {
    const prevLayer = sortedLayers[i-1];
    const currentLayer = sortedLayers[i];
    
    const prevWidth = parseInt(prevLayer.width) || 0;
    const prevHeight = parseInt(prevLayer.height) || 0;
    const currentWidth = parseInt(currentLayer.width) || 0;
    const currentHeight = parseInt(currentLayer.height) || 0;
    
    // Skip validation if values are 0 or empty
    if (!prevWidth || !prevHeight || !currentWidth || !currentHeight) {
      continue;
    }
    
    // Check if current layer's dimensions are smaller than previous layer
    if (currentWidth >= prevWidth) {
      errors[currentLayer.id] = language === 'zh' 
        ? errorTranslations.widthSmaller.zh(prevWidth) 
        : errorTranslations.widthSmaller.en(prevWidth);
    } else if (prevWidth % currentWidth !== 0) {
      errors[currentLayer.id] = language === 'zh'
        ? errorTranslations.widthMultiple.zh(prevWidth, currentWidth)
        : errorTranslations.widthMultiple.en(prevWidth, currentWidth);
    }
    
    if (currentHeight >= prevHeight) {
      if (errors[currentLayer.id]) {
        errors[currentLayer.id] += language === 'zh' 
          ? errorTranslations.and.zh 
          : errorTranslations.and.en;
        errors[currentLayer.id] += language === 'zh'
          ? errorTranslations.heightSmaller.zh(prevHeight)
          : errorTranslations.heightSmaller.en(prevHeight);
      } else {
        errors[currentLayer.id] = language === 'zh' 
          ? errorTranslations.heightSmaller.zh(prevHeight)
          : errorTranslations.heightSmaller.en(prevHeight);
      }
    } else if (prevHeight % currentHeight !== 0) {
      if (errors[currentLayer.id]) {
        errors[currentLayer.id] += language === 'zh' 
          ? errorTranslations.and.zh 
          : errorTranslations.and.en;
        errors[currentLayer.id] += language === 'zh'
          ? errorTranslations.heightMultiple.zh(prevHeight, currentHeight)
          : errorTranslations.heightMultiple.en(prevHeight, currentHeight);
      } else {
        errors[currentLayer.id] = language === 'zh'
          ? errorTranslations.heightMultiple.zh(prevHeight, currentHeight)
          : errorTranslations.heightMultiple.en(prevHeight, currentHeight);
      }
    }
  }
  
  return errors;
};

// Calculate subdivision rules
export const calculateSubdivideRules = (
  layers: LayerSize[],
  coords: RectangleCoordinates | null
): SubdivideRule[] => {
  if (!coords) return [];
  
  // Get original bounds
  const minX = coords.southWest[0];
  const minY = coords.southWest[1];
  const maxX = coords.northEast[0];
  const maxY = coords.northEast[1];
  
  // Original width and height
  const origWidth = maxX - minX;
  const origHeight = maxY - minY;
  
  // Sort layers by ID to maintain hierarchy
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
  
  // Calculate first layer's adjusted bounds for all layers to use
  let adjustedMinX = minX;
  let adjustedMinY = minY;
  let adjustedMaxX = maxX;
  let adjustedMaxY = maxY;
  
  // Only calculate adjusted bounds if first layer exists and has valid dimensions
  if (sortedLayers.length > 0) {
    const firstLayer = sortedLayers[0];
    const firstLayerWidth = parseInt(firstLayer.width) || 0;
    const firstLayerHeight = parseInt(firstLayer.height) || 0;
    
    if (firstLayerWidth > 0 && firstLayerHeight > 0) {
      // Calculate needed columns and rows for first layer
      const firstLayerCols = Math.ceil(origWidth / firstLayerWidth);
      const firstLayerRows = Math.ceil(origHeight / firstLayerHeight);
      
      // Calculate adjustment values for first layer
      const targetWidth = firstLayerCols * firstLayerWidth;
      const targetHeight = firstLayerRows * firstLayerHeight;
      const widthDiff = targetWidth - origWidth;
      const heightDiff = targetHeight - origHeight;
      
      // Adjust bounds based on first layer
      adjustedMinX = minX - (widthDiff / 2);
      adjustedMinY = minY - (heightDiff / 2);
      adjustedMaxX = maxX + (widthDiff / 2);
      adjustedMaxY = maxY + (heightDiff / 2);
    }
  }
  
  // Adjusted bounds width and height (same for all layers)
  const adjustedWidth = adjustedMaxX - adjustedMinX;
  const adjustedHeight = adjustedMaxY - adjustedMinY;
  
  const rules: SubdivideRule[] = sortedLayers.map((layer, index) => {
    const layerWidth = parseInt(layer.width) || 0;
    const layerHeight = parseInt(layer.height) || 0;
    
    if (layerWidth <= 0 || layerHeight <= 0) {
      return {
        id: layer.id,
        cols: 0,
        rows: 0,
        originalBounds: [minX, minY, maxX, maxY],
        adjustedBounds: [adjustedMinX, adjustedMinY, adjustedMaxX, adjustedMaxY],
        xRatio: 0,
        yRatio: 0
      };
    }
    
    let xRatio = 0;
    let yRatio = 0;
    
    if (index === 0) {
      // First layer: ratio is comparison with original bounds
      xRatio = origWidth / layerWidth;
      yRatio = origHeight / layerHeight;
    } else {
      // Other layers: ratio is comparison with previous layer
      const prevLayer = sortedLayers[index - 1];
      const prevWidth = parseInt(prevLayer.width) || 1;
      const prevHeight = parseInt(prevLayer.height) || 1;
      
      xRatio = prevWidth / layerWidth;
      yRatio = prevHeight / layerHeight;
    }
    
    // Calculate columns and rows based on adjusted bounds
    const cols = Math.round(adjustedWidth / layerWidth);
    const rows = Math.round(adjustedHeight / layerHeight);
    
    return {
      id: layer.id,
      cols,
      rows,
      originalBounds: [minX, minY, maxX, maxY],
      adjustedBounds: [adjustedMinX, adjustedMinY, adjustedMaxX, adjustedMaxY],
      xRatio,
      yRatio
    };
  });
  
  return rules;
}; 