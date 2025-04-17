import React from 'react';
import { SubdivideRulesProps } from '../types/types';

const SubdivideRules: React.FC<SubdivideRulesProps> = ({
  subdivideRules,
  layers,
  formatNumber,
  language = 'en'
}) => {

  const translations = {
    title: {
      en: 'Subdivide Rules',
      zh: '细分规则'
    },
    layer: {
      en: 'Layer',
      zh: '层级'
    },
    grid: {
      en: 'Grid',
      zh: '网格'
    },
    baseSubdivisionRatio: {
      en: 'Base subdivision ratio',
      zh: '基础细分比例'
    },
    subdivisionRatio: {
      en: 'Subdivision ratio',
      zh: '细分比例'
    },
    originalBounds: {
      en: 'Original bounds',
      zh: '原始边界'
    },
    adjustedBounds: {
      en: 'Adjusted bounds',
      zh: '调整后的边界'
    },
    width: {
      en: 'Width',
      zh: '宽度'
    },
    height: {
      en: 'Height',
      zh: '高度'
    },
    lastLevel: {
      en: 'last level',
      zh: '最后一层'
    },
    relativeToPrevious: {
      en: 'relative to previous level',
      zh: '相对于前一层级'
    },
    boundsAdjusted: {
      en: 'Bounds are adjusted to ensure precise grid division',
      zh: '边界已调整以确保精确的网格划分'
    },
    completeOneLevel: {
      en: 'Please complete at least one grid level above.',
      zh: '请至少完成一个上方的网格层级。'
    }
  };

  // Sort subdivision rules by id
  const sortedRules = [...subdivideRules].sort((a, b) => a.id - b.id);

  // Sort layers by id
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);

  // Check if there is at least one layer with valid width and height
  const firstLayer = sortedLayers.length > 0 ? sortedLayers[0] : null;
  const isFirstLayerValid =
    firstLayer &&
    firstLayer.width &&
    firstLayer.height &&
    parseInt(firstLayer.width) > 0 &&
    parseInt(firstLayer.height) > 0;

  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <h3 className="font-semibold text-lg mb-2">{language === 'zh' ? translations.title.zh : translations.title.en}</h3>
      <div className="space-y-3">
        {sortedRules.length > 0 && isFirstLayerValid ? (
          sortedRules.map((rule, index) => {
            if (rule.cols === 0 || rule.rows === 0) return null;

            const layer = layers.find((l) => l.id === rule.id);
            if (!layer) return null;

            // Calculate boundary width and height
            const originalWidth =
              rule.originalBounds[2] - rule.originalBounds[0];
            const originalHeight =
              rule.originalBounds[3] - rule.originalBounds[1];
            const adjustedWidth =
              rule.adjustedBounds[2] - rule.adjustedBounds[0];
            const adjustedHeight =
              rule.adjustedBounds[3] - rule.adjustedBounds[1];

            return (
              <div
                key={rule.id}
                className="p-2 bg-gray-50 rounded border border-gray-200"
              >
                <h4 className="text-sm font-medium mb-2">{language === 'zh' ? translations.layer.zh : translations.layer.en} {index + 1}</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium">{language === 'zh' ? translations.grid.zh : translations.grid.en}:</span> {rule.cols} ×{' '}
                    {rule.rows}
                  </div>
                  {index === 0 ? (
                    <>
                      <div>
                        <span className="font-medium">
                          {language === 'zh' ? translations.baseSubdivisionRatio.zh : translations.baseSubdivisionRatio.en}:
                        </span>{' '}
                        {rule.xRatio.toFixed(4)} × {rule.yRatio.toFixed(4)}
                      </div>
                      <div>
                        <span className="font-medium">{language === 'zh' ? translations.originalBounds.zh : translations.originalBounds.en}:</span>
                      </div>
                      <div className="pl-2">
                        <div>
                          minX: {formatNumber(rule.originalBounds[0])}, minY:{' '}
                          {formatNumber(rule.originalBounds[1])}
                        </div>
                        <div>
                          maxX: {formatNumber(rule.originalBounds[2])}, maxY:{' '}
                          {formatNumber(rule.originalBounds[3])}
                        </div>
                        <div>
                          {language === 'zh' ? translations.width.zh : translations.width.en}: {formatNumber(originalWidth)}, {language === 'zh' ? translations.height.zh : translations.height.en}:{' '}
                          {formatNumber(originalHeight)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">{language === 'zh' ? translations.adjustedBounds.zh : translations.adjustedBounds.en}:</span>
                      </div>
                      <div className="pl-2">
                        <div>
                          minX: {formatNumber(rule.adjustedBounds[0])}, minY:{' '}
                          {formatNumber(rule.adjustedBounds[1])}
                        </div>
                        <div>
                          maxX: {formatNumber(rule.adjustedBounds[2])}, maxY:{' '}
                          {formatNumber(rule.adjustedBounds[3])}
                        </div>
                        <div>
                          {language === 'zh' ? translations.width.zh : translations.width.en}: {formatNumber(adjustedWidth)}, {language === 'zh' ? translations.height.zh : translations.height.en}:{' '}
                          {formatNumber(adjustedHeight)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {language === 'zh' ? translations.boundsAdjusted.zh : translations.boundsAdjusted.en}
                      </div>
                    </>
                  ) : index === layers.length - 1 ? (
                    <div>
                      <span className="font-medium">{language === 'zh' ? translations.subdivisionRatio.zh : translations.subdivisionRatio.en}:</span> 1
                      × 1 ({language === 'zh' ? translations.lastLevel.zh : translations.lastLevel.en})
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium">{language === 'zh' ? translations.subdivisionRatio.zh : translations.subdivisionRatio.en}:</span>{' '}
                      {rule.xRatio.toFixed(0)} × {rule.yRatio.toFixed(0)}{' '}
                      ({language === 'zh' ? translations.relativeToPrevious.zh : translations.relativeToPrevious.en})
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500 text-center py-2">
            {language === 'zh' ? translations.completeOneLevel.zh : translations.completeOneLevel.en}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubdivideRules;
