import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProjectNameCardProps {
  name: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export const ProjectNameCard: React.FC<ProjectNameCardProps> = ({
  name,
  language,
  hasError,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-2">
        {language === 'zh' ? '新项目名称' : 'New Project Name'}
      </h2>
      <div className="space-y-2">
        <Input
          id="name"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            language === 'zh' ? '输入新项目名称' : 'Enter new project name'
          }
          className={`w-full ${
            hasError ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
      </div>
    </div>
  );
};

interface ProjectDescriptionCardProps {
  description: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export const ProjectDescriptionCard: React.FC<ProjectDescriptionCardProps> = ({
  description,
  language,
  hasError,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
      <h2 className="text-lg font-semibold mb-2">
        {language === 'zh' ? '项目描述' : 'Project Description'}
      </h2>
      <div className="space-y-2">
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            language === 'zh' ? '输入描述信息' : 'Enter description information'
          }
          className={`w-full ${
            hasError ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
      </div>
    </div>
  );
};

interface ProjectSchemaNameCardProps {
  name: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export const ProjectSchemaNameCard: React.FC<ProjectSchemaNameCardProps> = ({
  name,
  language,
  hasError,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mt-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-2">
        {language === 'zh' ? '关联的Schema名称' : 'Related Schema Name'}
      </h2>
      <div className="space-y-2">
        <Input
          id="schemaName"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            language === 'zh' ? '输入关联的Schema名称' : 'Enter related schema name'
          }
          className={`w-full ${
            hasError ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
      </div>
    </div>
  );
};

interface ProjectEpsgCardProps {
  epsg: string;
  language: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

export const ProjectEpsgCard: React.FC<ProjectEpsgCardProps> = ({
  epsg,
  language,
  hasError,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
      <h2 className="text-lg font-semibold mb-2">
        {language === 'zh' ? 'EPSG代码' : 'EPSG Code'}
      </h2>
      <div className="space-y-2">
        <Input
          id="epsg"
          placeholder={
            language === 'zh'
              ? '输入EPSG代码 (例如: 4326)'
              : 'Enter EPSG code (e.g. 4326)'
          }
          className={`w-full ${
            hasError ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          value={epsg}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

interface ProjectConvertedCoordCardProps {
  convertedCoord: { x: string; y: string } | null;
  epsg: string;
  language: string;
}

export const ProjectConvertedCoordCard: React.FC<
  ProjectConvertedCoordCardProps
> = ({ convertedCoord, epsg, language }) => {
  if (!convertedCoord || !epsg) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
      <h2 className="text-lg font-semibold mb-2">
        {language === 'zh' ? '转换后坐标' : 'Converted Coordinate'} (EPSG:{epsg}
        )
      </h2>
      <div className="flex-1 flex flex-col justify-between">
        {/* X坐标显示 */}
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium w-1/4">X</Label>
          <div className="w-3/4 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            {convertedCoord.x}
          </div>
        </div>

        {/* Y坐标显示 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium w-1/4">Y</Label>
          <div className="w-3/4 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            {convertedCoord.y}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectErrorMessageProps {
  message: string | null;
}

export const ProjectErrorMessage: React.FC<ProjectErrorMessageProps> = ({
  message,
}) => {
  if (!message) return null;

  return (
    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
      {message}
    </div>
  );
};
