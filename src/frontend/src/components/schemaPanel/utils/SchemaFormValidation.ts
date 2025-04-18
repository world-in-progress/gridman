import { Schema } from '../types/types';

export interface GridLayer {
  id: number;
  width: string;
  height: string;
}

export interface FormErrors {
  name: boolean;
  description: boolean;
  coordinates: boolean;
  epsg: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
  generalError: string | null;
}

/**
 * 验证网格层级数据
 */
export const validateGridLayers = (
  gridLayers: GridLayer[],
  language: string
): { errors: Record<number, string>; isValid: boolean } => {
  const errors: Record<number, string> = {};
  let isValid = true;

  gridLayers.forEach((layer, index) => {
    // 检查宽高是否有值
    if (!layer.width.trim() || !layer.height.trim()) {
      errors[layer.id] =
        language === 'zh'
          ? '宽度和高度不能为空'
          : 'Width and height cannot be empty';
      isValid = false;
      return;
    }

    const currentWidth = parseInt(layer.width);
    const currentHeight = parseInt(layer.height);

    // 检查宽高是否为有效数字
    if (
      isNaN(currentWidth) ||
      isNaN(currentHeight) ||
      currentWidth <= 0 ||
      currentHeight <= 0
    ) {
      errors[layer.id] =
        language === 'zh'
          ? '宽度和高度必须是大于0的数字'
          : 'Width and height must be positive numbers';
      isValid = false;
      return;
    }

    if (index > 0) {
      const prevLayer = gridLayers[index - 1];
      const prevWidth = parseInt(prevLayer.width);
      const prevHeight = parseInt(prevLayer.height);

      if (currentWidth >= prevWidth || currentHeight >= prevHeight) {
        errors[layer.id] =
          language === 'zh'
            ? '单元格尺寸应小于前一层级'
            : 'Cell dimensions should be smaller than previous level';
        isValid = false;
      }

      if (
        prevWidth % currentWidth !== 0 ||
        prevHeight % currentHeight !== 0
      ) {
        errors[layer.id] =
          language === 'zh'
            ? '前一层级的宽度/高度必须是当前层级的倍数'
            : "Previous level's dimensions must be multiples of current level's";
        isValid = false;
      }
    }
  });

  return { errors, isValid };
};

/**
 * 验证整个表单
 */
export const validateSchemaForm = (
  data: {
    name: string;
    epsg: string;
    lon: string;
    lat: string;
    gridLayers: GridLayer[];
    convertedCoord: { x: string; y: string } | null;
  },
  language: string
): ValidationResult => {
  const errors = {
    name: false,
    description: false,
    coordinates: false,
    epsg: false,
  };

  let generalError: string | null = null;

  // 验证名称
  if (!data.name.trim()) {
    generalError = language === 'zh' ? '请输入模板名称' : 'Please enter schema name';
    errors.name = true;
    return { isValid: false, errors, generalError };
  }

  // 验证EPSG码
  if (!data.epsg.trim() || isNaN(Number(data.epsg))) {
    generalError = language === 'zh'
      ? '请输入有效的EPSG代码'
      : 'Please enter a valid EPSG code';
    errors.epsg = true;
    return { isValid: false, errors, generalError };
  }

  // 验证坐标
  if (!data.lon.trim() || !data.lat.trim()) {
    generalError = language === 'zh' ? '请输入经纬度坐标' : 'Please enter coordinates';
    errors.coordinates = true;
    return { isValid: false, errors, generalError };
  }

  // 验证网格层级
  if (data.gridLayers.length === 0) {
    generalError = language === 'zh'
      ? '请至少添加一级网格'
      : 'Please add at least one grid level';
    return { isValid: false, errors, generalError };
  }

  // 验证每个网格层级的宽高
  for (let i = 0; i < data.gridLayers.length; i++) {
    const layer = data.gridLayers[i];
    if (
      !layer.width.trim() ||
      !layer.height.trim() ||
      isNaN(parseInt(layer.width)) ||
      isNaN(parseInt(layer.height))
    ) {
      generalError = language === 'zh'
        ? `请为第${i + 1}级网格填写有效的宽度和高度`
        : `Please enter valid width and height for grid level ${i + 1}`;
      return { isValid: false, errors, generalError };
    }
  }

  // 验证网格层级的关系
  const { errors: layerErrors, isValid: gridValid } = validateGridLayers(data.gridLayers, language);
  if (!gridValid) {
    generalError = language === 'zh'
      ? '请修正网格层级中的错误'
      : 'Please fix errors in grid levels';
    return { isValid: false, errors, generalError };
  }

  // 验证坐标转换
  if (!data.convertedCoord) {
    generalError = language === 'zh'
      ? '无法获取转换后的坐标'
      : 'Unable to get converted coordinates';
    return { isValid: false, errors, generalError };
  }

  return { isValid: true, errors, generalError: null };
};

/**
 * 创建Schema数据对象
 */
export const createSchemaData = (
  name: string,
  description: string,
  epsg: string,
  convertedCoord: { x: string; y: string } | null,
  gridLayers: GridLayer[]
): Schema | null => {
  if (!convertedCoord) return null;
  
  return {
    name,
    starred: false,
    description,
    epsg: parseInt(epsg),
    base_point: [parseFloat(convertedCoord.x), parseFloat(convertedCoord.y)],
    grid_info: gridLayers.map((layer) => [
      parseInt(layer.width),
      parseInt(layer.height),
    ]),
  };
}; 