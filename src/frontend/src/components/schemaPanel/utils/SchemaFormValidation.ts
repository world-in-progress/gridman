import { TopologyLayer, ValidationResult, Schema } from '../types/types';

export const validateGridLayers = (
    topologyLayers: TopologyLayer[],
    language: string
): { errors: Record<number, string>; isValid: boolean } => {
    const errors: Record<number, string> = {};
    let isValid = true;

    const errorText = {
        empty: {
            zh: '宽度和高度不能为空',
            en: 'Width and height cannot be empty',
        },
        notPositive: {
            zh: '宽度和高度必须是大于0的数字',
            en: 'Width and height must be positive numbers',
        },
        notSmaller: {
            zh: (prevWidth: number, prevHeight: number) =>
                `单元格尺寸应小于前一层级 (${prevWidth}×${prevHeight})`,
            en: (prevWidth: number, prevHeight: number) =>
                `Cell dimensions should be smaller than previous level (${prevWidth}×${prevHeight})`,
        },
        notMultiple: {
            zh: (
                prevWidth: number,
                currentWidth: number,
                prevHeight: number,
                currentHeight: number
            ) =>
                `前一层级的尺寸 (${prevWidth}×${prevHeight}) 必须是当前层级 (${currentWidth}×${currentHeight}) 的倍数`,
            en: (
                prevWidth: number,
                currentWidth: number,
                prevHeight: number,
                currentHeight: number
            ) =>
                `Previous level's dimensions (${prevWidth}×${prevHeight}) must be multiples of current level (${currentWidth}×${currentHeight})`,
        },
        widthNotSmaller: {
            zh: (prevWidth: number) => `宽度必须小于前一层级 (${prevWidth})`,
            en: (prevWidth: number) =>
                `Width must be smaller than previous level (${prevWidth})`,
        },
        widthNotMultiple: {
            zh: (prevWidth: number, currentWidth: number) =>
                `前一层级的宽度 (${prevWidth}) 必须是当前层级宽度 (${currentWidth}) 的倍数`,
            en: (prevWidth: number, currentWidth: number) =>
                `Previous level's width (${prevWidth}) must be a multiple of current width (${currentWidth})`,
        },
        heightNotSmaller: {
            zh: (prevHeight: number) => `高度必须小于前一层级 (${prevHeight})`,
            en: (prevHeight: number) =>
                `Height must be smaller than previous level (${prevHeight})`,
        },
        heightNotMultiple: {
            zh: (prevHeight: number, currentHeight: number) =>
                `前一层级的高度 (${prevHeight}) 必须是当前层级高度 (${currentHeight}) 的倍数`,
            en: (prevHeight: number, currentHeight: number) =>
                `Previous level's height (${prevHeight}) must be a multiple of current height (${currentHeight})`,
        },
        and: {
            zh: ` 且 `,
            en: ` and `,
        },
    };

    const lang = language === 'zh' ? 'zh' : 'en';

    const sortedLayers = [...topologyLayers].sort((a, b) => a.id - b.id);

    sortedLayers.forEach((layer, index) => {
        const width = String(layer.width).trim();
        const height = String(layer.height).trim();

        delete errors[layer.id];

        if (width === '' || height === '') {
            errors[layer.id] = errorText.empty[lang];
            isValid = false;
            return;
        }

        const currentWidth = Number(width);
        const currentHeight = Number(height);

        if (
            isNaN(currentWidth) ||
            isNaN(currentHeight) ||
            currentWidth <= 0 ||
            currentHeight <= 0
        ) {
            errors[layer.id] = errorText.notPositive[lang];
            isValid = false;
            return;
        }

        if (index > 0) {
            const prevLayer = sortedLayers[index - 1];
            const prevWidth = Number(String(prevLayer.width).trim());
            const prevHeight = Number(String(prevLayer.height).trim());

            let hasWidthError = false;
            if (currentWidth >= prevWidth) {
                errors[layer.id] = errorText.widthNotSmaller[lang](prevWidth);
                hasWidthError = true;
                isValid = false;
            } else if (prevWidth % currentWidth !== 0) {
                errors[layer.id] = errorText.widthNotMultiple[lang](
                    prevWidth,
                    currentWidth
                );
                hasWidthError = true;
                isValid = false;
            }

            if (currentHeight >= prevHeight) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and[lang] +
                        errorText.heightNotSmaller[lang](prevHeight);
                } else {
                    errors[layer.id] =
                        errorText.heightNotSmaller[lang](prevHeight);
                }
                isValid = false;
            } else if (prevHeight % currentHeight !== 0) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and[lang] +
                        errorText.heightNotMultiple[lang](
                            prevHeight,
                            currentHeight
                        );
                } else {
                    errors[layer.id] = errorText.heightNotMultiple[lang](
                        prevHeight,
                        currentHeight
                    );
                }
                isValid = false;
            }
        }
    });

    return { errors, isValid };
};

export const validateSchemaForm = (
    data: {
        name: string;
        epsg: string;
        lon: string;
        lat: string;
        topologyLayers: TopologyLayer[];
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

    if (!data.name.trim()) {
        generalError =
            language === 'zh' ? '请输入模板名称' : 'Please enter schema name';
        errors.name = true;
        return { isValid: false, errors, generalError };
    }

    if (!data.epsg.trim() || isNaN(Number(data.epsg))) {
        generalError =
            language === 'zh'
                ? '请输入有效的EPSG代码'
                : 'Please enter a valid EPSG code';
        errors.epsg = true;
        return { isValid: false, errors, generalError };
    }

    if (!data.lon.trim() || !data.lat.trim()) {
        generalError =
            language === 'zh' ? '请输入经纬度坐标' : 'Please enter coordinates';
        errors.coordinates = true;
        return { isValid: false, errors, generalError };
    }

    if (data.topologyLayers.length === 0) {
        generalError =
            language === 'zh'
                ? '请至少添加一级网格'
                : 'Please add at least one grid level';
        return { isValid: false, errors, generalError };
    }

    for (let i = 0; i < data.topologyLayers.length; i++) {
        const layer = data.topologyLayers[i];
        if (
            !layer.width.toString().trim() ||
            !layer.height.toString().trim() ||
            isNaN(parseInt(layer.width.toString())) ||
            isNaN(parseInt(layer.height.toString()))
        ) {
            generalError =
                language === 'zh'
                    ? `请为第${i + 1}级网格填写有效的宽度和高度`
                    : `Please enter valid width and height for grid level ${
                          i + 1
                      }`;
            return { isValid: false, errors, generalError };
        }
    }

    const { errors: layerErrors, isValid: gridValid } = validateGridLayers(
        data.topologyLayers,
        language
    );
    if (!gridValid) {
        generalError =
            language === 'zh'
                ? '请修正网格层级中的错误'
                : 'Please fix errors in grid levels';
        return { isValid: false, errors, generalError };
    }

    if (!data.convertedCoord) {
        generalError =
            language === 'zh'
                ? '无法获取转换后的坐标'
                : 'Unable to get converted coordinates';
        return { isValid: false, errors, generalError };
    }

    return { isValid: true, errors, generalError: null };
};

export const createSchemaData = (
    name: string,
    description: string,
    epsg: string,
    convertedCoord: { x: string; y: string } | null,
    topologyLayers: TopologyLayer[]
): Schema | null => {
    if (!convertedCoord) return null;

    return {
        name,
        starred: false,
        description,
        epsg: parseInt(epsg),
        base_point: [
            parseFloat(convertedCoord.x),
            parseFloat(convertedCoord.y),
        ],
        grid_info: topologyLayers.map((layer) => [
            parseInt(layer.width.toString()),
            parseInt(layer.height.toString()),
        ]),
    };
};
