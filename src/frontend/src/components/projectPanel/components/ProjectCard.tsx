import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Star,
  Grid,
  FileType2,
  SquarePen,
  MapPin,
  LayoutPanelTop
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedCard, CardBackground, Blob } from '../../schemaPanel/components/styledComponents';
import { ProjectCardProps, Project } from '../../schemaPanel/types/types';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  title,
  isHighlighted,
  language,
  starredItems,
  openMenuId,
  menuItems,
  onCardClick,
  onStarToggle,
  onMenuOpenChange,
  onEditDescription,
  onSaveDescription,
  editingDescription,
  descriptionText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localStarred, setLocalStarred] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardId = `project-card-${title.replace(/\s+/g, '-')}`;

  useEffect(() => {
    setLocalStarred(starredItems?.[title] || false);
  }, [starredItems, title]);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarredState = !localStarred;
    setLocalStarred(newStarredState);
    onStarToggle(title, project);
  };

  const handleUpdateDescription = async () => {
    if (!textareaRef.current) return;
    
    const newDescription = textareaRef.current.value;
    
    try {
      if (onSaveDescription) {
        const updatedProject = {
          ...project,
          description: newDescription
        };
        await onSaveDescription(title, updatedProject);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project description:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const formatBounds = (bounds: number[]) => {
    if (!bounds || bounds.length !== 4) return '-';
    
    const [minX, minY, maxX, maxY] = bounds.map(val => val.toFixed(6));
    
    return language === 'zh' 
      ? `X: ${minX}~${maxX}, Y: ${minY}~${maxY}`
      : `X: ${minX}~${maxX}, Y: ${minY}~${maxY}`;
  };

  const BoundsVisualization = ({ bounds }: { bounds: number[] }) => {
    if (!bounds || bounds.length !== 4) return null;
    
    const [minX, minY, maxX, maxY] = bounds;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const formatCoord = (value: number): string => value.toFixed(4);
    
    return (
      <div className="mt-2 mb-2 mx-1 p-1 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-1 text-xs">
          {/* 左上角 */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="absolute top-0 left-1/4 w-3/4 h-1/2 border-t border-l border-gray-400 dark:border-gray-500 rounded-tl"></div>
          </div>
          
          {/* 上方 - 显示maxY */}
          <div className="text-center">
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">N</span>
            <div className="text-[10px] text-gray-700 dark:text-gray-300">{formatCoord(maxY)}</div>
          </div>
          
          {/* 右上角 */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="absolute top-0 right-1/4 w-3/4 h-1/2 border-t border-r border-gray-400 dark:border-gray-500 rounded-tr"></div>
          </div>
          
          {/* 左侧 - 显示minX */}
          <div className="text-center">
            <span className="font-bold text-green-600 dark:text-green-400 text-sm">W</span>
            <div className="text-[10px] text-gray-700 dark:text-gray-300">{formatCoord(minX)}</div>
          </div>
          
          {/* 中心 */}
          <div className="text-center">
            <span className="font-bold text-xs">{language === 'zh' ? '中心' : 'Center'}</span>
            <div className="text-[9px] text-gray-700 dark:text-gray-300">
              [{formatCoord(centerX)}, {formatCoord(centerY)}]
            </div>
          </div>
          
          {/* 右侧 - 显示maxX */}
          <div className="text-center">
            <span className="font-bold text-red-600 dark:text-red-400 text-sm">E</span>
            <div className="text-[10px] text-gray-700 dark:text-gray-300">{formatCoord(maxX)}</div>
          </div>
          
          {/* 左下角 */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="absolute bottom-0 left-1/4 w-3/4 h-1/2 border-b border-l border-gray-400 dark:border-gray-500 rounded-bl"></div>
          </div>
          
          {/* 下方 - 显示minY */}
          <div className="text-center">
            <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">S</span>
            <div className="text-[10px] text-gray-700 dark:text-gray-300">{formatCoord(minY)}</div>
          </div>
          
          {/* 右下角 */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="absolute bottom-0 right-1/4 w-3/4 h-1/2 border-b border-r border-gray-400 dark:border-gray-500 rounded-br"></div>
          </div>
        </div>
      </div>
    );
  };

  const CardContent = () => (
    <>
      {/* Card Title Area */}
      <div className="flex items-center justify-between mb-2 relative">
        <h3 className="text-lg font-bold truncate pr-16">{title}</h3>
        <div className="absolute right-0 top-0 flex items-center">
          <button
            className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center mr-1"
            aria-label={language === 'zh' ? '标星' : 'Star'}
            title={language === 'zh' ? '标星' : 'Star'}
            onClick={handleStarClick}
          >
            <Star
              className={`h-5 w-5 ${
                localStarred ? 'fill-yellow-400 text-yellow-400' : ''
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
                      onMenuOpenChange(false);
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

      {/* Card Content Area */}
      <div className="text-sm space-y-2">
        {/* Schema Information */}
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <LayoutPanelTop className="h-4 w-4 mr-2" />
          <span>
            {language === 'zh' ? '模板名称' : 'Schema Name'}: {project.schema_name}
          </span>
        </div>

        {/* Bounds Information */}
        <div className="text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="font-medium">
              {language === 'zh' ? '项目边界：' : 'Project Bounds:'}
            </span>
          </div>
          
          {project.bounds && project.bounds.length === 4 ? (
            <BoundsVisualization bounds={project.bounds} />
          ) : (
            <div className="mt-1 ml-6">
              {language === 'zh' ? '无边界信息' : 'No bounds information'}
            </div>
          )}
        </div>

        {/* Description Information */}
        <div className="text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-gray-700 mb-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <FileType2 className="h-4 w-4 mr-2" />
              <h3 className="text-sm font-bold">
                {language === 'zh' ? '描述' : 'Description'}
              </h3>
            </div>
            {onEditDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                  onEditDescription(title);
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                aria-label={language === 'zh' ? '编辑描述' : 'Edit description'}
                title={language === 'zh' ? '编辑描述' : 'Edit description'}
              >
                <SquarePen className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Display description text when not in editing mode */}
          {!isEditing && project.description && (
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 px-1">
              {project.description}
            </div>
          )}
          {/* Display text input when in editing mode */}
          {isEditing && (
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="project-description"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[80px] pr-[140px]"
                aria-label={
                  language === 'zh' ? '项目描述' : 'Project description'
                }
                placeholder={
                  language === 'zh'
                    ? '输入项目描述'
                    : 'Enter project description'
                }
                onClick={(e) => {
                  e.stopPropagation();
                }}
                defaultValue={(descriptionText && descriptionText[title]) || project.description || ''}
              />
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <button
                  className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateDescription();
                  }}
                >
                  {language === 'zh' ? '完成' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

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
