import React, { useContext } from 'react';
import { GridLevelProps } from '../types/types';
import GridLevelItem from './GridLevelItem';
import { LanguageContext } from '../../../context';

const GridLevel: React.FC<GridLevelProps> = ({
  layers,
  layerErrors,
  onAddLayer,
  onUpdateWidth,
  onUpdateHeight,
  onRemoveLayer,
}) => {
  const { language } = useContext(LanguageContext);
  

  const translations = {
    title: {
      en: 'Grid Level',
      zh: '网格层级'
    },
    addButton: {
      en: 'Add Grid Level',
      zh: '添加网格层级'
    },
    noLayers: {
      en: 'No layers added yet. Click the button above to add a layer.',
      zh: '尚未添加任何层级。点击上方按钮添加层级。'
    },
    rulesTitle: {
      en: 'Grid levels should follow these rules:',
      zh: '网格层级应遵循以下规则：'
    },
    rule1: {
      en: 'Each level should have smaller cell dimensions than the previous level',
      zh: '每个层级的单元格尺寸应小于前一层级'
    },
    rule2: {
      en: "Previous level's width/height must be a multiple of the current level's width/height",
      zh: '前一层级的宽度/高度必须是当前层级宽度/高度的倍数'
    },
    rule3: {
      en: 'First level defines the base grid cell size, and higher levels define increasingly finer grids',
      zh: '第一层级定义基本网格单元大小，更高层级定义逐渐精细的网格'
    }
  };

  // Sort layers by id
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);

  return (
    <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{language === 'zh' ? translations.title.zh : translations.title.en}</h3>
        <button
          type="button"
          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm cursor-pointer"
          onClick={onAddLayer}
        >
          <span className="text-lg">+</span> {language === 'zh' ? translations.addButton.zh : translations.addButton.en}
        </button>
      </div>

      {sortedLayers.length > 0 ? (
        <div className="space-y-3">
          {sortedLayers.map((layer, index) => (
            <GridLevelItem
              key={layer.id}
              layer={layer}
              index={index}
              error={layerErrors[layer.id]}
              onUpdateWidth={onUpdateWidth}
              onUpdateHeight={onUpdateHeight}
              onRemoveLayer={onRemoveLayer}
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-2">
          {language === 'zh' ? translations.noLayers.zh : translations.noLayers.en}
        </div>
      )}

      {sortedLayers.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
          <p>{language === 'zh' ? translations.rulesTitle.zh : translations.rulesTitle.en}</p>
          <ul className="list-disc pl-4 mt-1">
            <li>
              {language === 'zh' ? translations.rule1.zh : translations.rule1.en}
            </li>
            <li>
              {language === 'zh' ? translations.rule2.zh : translations.rule2.en}
            </li>
            <li>
              {language === 'zh' ? translations.rule3.zh : translations.rule3.en}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GridLevel;
