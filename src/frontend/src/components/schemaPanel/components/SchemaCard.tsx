import React from 'react';
import {
  MoreHorizontal,
  Star,
  Grid,
  MapPin,
  Layers,
  SquarePen,
  FileType2,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedCard, CardBackground, Blob } from './styledComponents';
import { Schema, MenuItem } from '../types/types';

interface SchemaCardProps {
  schema: Schema;
  title: string;
  isHighlighted: boolean;
  language: string;
  starredItems: Record<string, boolean>;
  openMenuId: string | null;
  editingDescription: string | null;
  descriptionText: Record<string, string>;
  menuItems: MenuItem[];
  onCardClick: () => void;
  onStarToggle: (name: string, schema: Schema) => void;
  onMenuOpenChange: (open: boolean) => void;
  onEditDescription: (name: string) => void;
  onDescriptionChange: (name: string, value: string) => void;
  onSaveDescription: (name: string, schema: Schema) => void;
}

export const SchemaCard: React.FC<SchemaCardProps> = ({
  schema,
  title,
  isHighlighted,
  language,
  starredItems,
  openMenuId,
  editingDescription,
  descriptionText,
  menuItems,
  onCardClick,
  onStarToggle,
  onMenuOpenChange,
  onEditDescription,
  onDescriptionChange,
  onSaveDescription,
}) => {
  // 卡片内容重复部分提取为组件
  const CardContent = () => (
    <>
      {/* 卡片标题区域 */}
      <div className="flex items-center justify-between mb-2 relative">
        <h3 className="text-lg font-bold truncate pr-16">{title}</h3>
        <div className="absolute right-0 top-0 flex items-center">
          <button
            className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center mr-1"
            aria-label={language === 'zh' ? '标星' : 'Star'}
            title={language === 'zh' ? '标星' : 'Star'}
            onClick={(e) => {
              e.stopPropagation();
              onStarToggle(title, schema);
            }}
          >
            <Star
              className={`h-5 w-5 ${
                starredItems[title] || schema?.starred
                  ? 'fill-yellow-400 text-yellow-400'
                  : ''
              }`}
            />
          </button>
          <DropdownMenu
            open={openMenuId === title}
            onOpenChange={(open) => {
              onMenuOpenChange(open);
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                aria-label={language === 'zh' ? '更多选项' : 'More options'}
                title={language === 'zh' ? '更多选项' : 'More options'}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              alignOffset={40}
              className="w-48"
              sideOffset={-20}
            >
              {menuItems.map((subItem) => (
                <DropdownMenuItem key={subItem.title} asChild>
                  <a
                    href={subItem.url}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuOpenChange(false); // 关闭菜单
                      subItem.onClick && subItem.onClick(e);
                    }}
                  >
                    {subItem.title}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 卡片内容区域 */}
      <div className="text-sm space-y-2">
        {/* EPSG信息 */}
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <Grid className="h-4 w-4 mr-2" />
          <span>EPSG: {schema?.epsg}</span>
        </div>

        {/* 基准点信息 */}
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4 mr-2" />
          <span>
            {language === 'zh' ? '基准点' : 'Base Point'}:
            {schema?.base_point
              ? ` [${schema.base_point[0].toFixed(2)}, ${schema.base_point[1].toFixed(
                  2
                )}]`
              : ' -'}
          </span>
        </div>

        {/* 网格层级信息 */}
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <Layers className="h-4 w-4 mr-2" />
          <span>
            {language === 'zh' ? '网格层级' : 'Grid Levels'}:
            {schema?.grid_info ? ` ${schema.grid_info.length}` : ' -'}
          </span>
        </div>

        {/* 描述信息 */}
        <div className="text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-gray-700 mb-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <FileType2 className="h-4 w-4 mr-2" />
              <h3 className="text-sm font-bold">
                {language === 'zh' ? '描述' : 'Description'}
              </h3>
            </div>
            <SquarePen
              className="h-4 w-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEditDescription(title);
              }}
            />
          </div>
          {editingDescription === title ? (
            <div className="relative">
              <textarea
                className="w-full p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[60px]"
                value={descriptionText[title] || ''}
                onChange={(e) => onDescriptionChange(title, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                aria-label={language === 'zh' ? '描述编辑' : 'Edit Description'}
                placeholder={
                  language === 'zh' ? '输入描述...' : 'Enter description...'
                }
              />
              <button
                className="absolute bottom-2 right-2 bg-green-500 text-white rounded-md px-2 py-1 hover:bg-green-600 text-xs flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveDescription(title, schema);
                }}
                title={language === 'zh' ? '保存' : 'Save'}
                aria-label={
                  language === 'zh' ? '保存描述' : 'Save Description'
                }
              >
                <Check className="h-3 w-3 mr-1" />
                {language === 'zh' ? '完成' : 'Done'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600 ml-6">{schema?.description || ''}</p>
          )}
        </div>
      </div>
    </>
  );

  const cardId = `schema-card-${title.replace(/\s+/g, '-')}`;

  if (isHighlighted) {
    return (
      <AnimatedCard className="p-3 mb-4" id={cardId}>
        <CardBackground />
        <Blob />
        <div className="relative z-10">
          <CardContent />
        </div>
      </AnimatedCard>
    );
  } else {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4 border border-gray-200 dark:border-gray-700 relative transition-all duration-300 cursor-pointer"
        onClick={onCardClick}
        id={cardId}
      >
        <CardContent />
      </div>
    );
  }
}; 