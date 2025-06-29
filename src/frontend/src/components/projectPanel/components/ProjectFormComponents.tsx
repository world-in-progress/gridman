import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ProjectErrorMessageProps,
    ProjectNameCardProps,
    ProjectDescriptionCardProps,
    GridSchemaNameCardProps,
    ProjectEpsgCardProps,
    PatchNameCardProps,
    PatchDescriptionCardProps,
    BelongToProjectCardProps,
    ProjectConvertedCoordCardProps,
    PatchErrorMessageProps,
} from '../types/types';

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
                        language === 'zh'
                            ? '输入新项目名称'
                            : 'Enter new project name'
                    }
                    className={`w-full ${
                        hasError ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                />
            </div>
        </div>
    );
};

export const PatchNameCard: React.FC<PatchNameCardProps> = ({
    name,
    language,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '新补丁名称' : 'New Patch Name'}
            </h2>
            <div className="space-y-2">
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        language === 'zh'
                            ? '输入新补丁名称'
                            : 'Enter new patch name'
                    }
                    className={`w-full ${
                        hasError ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                />
            </div>
        </div>
    );
};

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
                        language === 'zh'
                            ? '输入描述信息'
                            : 'Enter description information'
                    }
                    className={`w-full ${
                        hasError ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                />
            </div>
        </div>
    );
};

export const PatchDescriptionCard: React.FC<PatchDescriptionCardProps> = ({
    description,
    language,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '补丁描述' : 'Patch Description'}
            </h2>
            <div className="space-y-2">
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        language === 'zh'
                            ? '输入描述信息'
                            : 'Enter description information'
                    }
                    className={`w-full ${
                        hasError ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                />
            </div>
        </div>
    );
};

export const GridSchemaNameCard: React.FC<GridSchemaNameCardProps> = ({
    name,
    language,
    hasError,
    onChange,
    readOnly = false,
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
                        language === 'zh'
                            ? '输入关联的Schema名称'
                            : 'Enter related schema name'
                    }
                    className={`w-full ${
                        hasError ? 'border-red-500 focus:ring-red-500' : ''
                    } ${readOnly ? 'bg-gray-100' : ''}`}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};

export const ProjectEpsgCard: React.FC<ProjectEpsgCardProps> = ({
    epsg,
    language,
    hasError,
    onChange,
    epsgFromProps = false,
    formErrors,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '目标坐标系统 (EPSG)' : 'Target Coordinate System (EPSG)'}
            </h2>
            <div className="space-y-2">
                <div className="flex items-center">
                    <span className="mr-2">EPSG:</span>
                    <Input
                        id="epsg"
                        placeholder={
                            language === 'zh'
                                ? '例如: 3857'
                                : 'e.g. 3857'
                        }
                        className={`w-full ${
                            hasError || (formErrors && formErrors.epsg) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        } ${epsgFromProps ? 'bg-gray-100' : ''}`}
                        value={epsg}
                        onChange={(e) => !epsgFromProps && onChange(e.target.value)}
                        readOnly={epsgFromProps}
                    />
                </div>
                {formErrors && formErrors.epsg && (
                    <p className="text-red-500 text-sm mt-1">
                        {language === 'zh'
                            ? '请输入有效的EPSG代码'
                            : 'Please enter a valid EPSG code'}
                    </p>
                )}
            </div>
        </div>
    );
};

export const ProjectConvertedCoordCard: React.FC<ProjectConvertedCoordCardProps> = ({
    convertedCoord,
    epsg,
    language,
}) => {
    if (!convertedCoord || !epsg) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '转换后坐标' : 'Converted Coordinate'}{' '}
                (EPSG:{epsg})
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

export const ProjectErrorMessage: React.FC<ProjectErrorMessageProps> = ({
    message,
}) => {
    if (!message) return null;

    let bgColor = 'bg-red-50';
    let textColor = 'text-red-700';
    let borderColor = 'border-red-200';

    if (
        message.includes('正在提交数据') ||
        message.includes('Submitting data')
    ) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        borderColor = 'border-orange-200';
    } else if (
        message.includes('创建成功') ||
        message.includes('created successfully') ||
        message.includes('Created successfully')
    ) {
        bgColor = 'bg-green-50';
        textColor = 'text-green-700';
        borderColor = 'border-green-200';
    }

    return (
        <div
            className={`mt-4 p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
        >
            {message}
        </div>
    );
};

export const PatchErrorMessage: React.FC<PatchErrorMessageProps> = ({
    message,
}) => {
    if (!message) return null;

    let bgColor = 'bg-red-50';
    let textColor = 'text-red-700';
    let borderColor = 'border-red-200';

    if (
        message.includes('正在提交数据') ||
        message.includes('Submitting data')
    ) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        borderColor = 'border-orange-200';
    } else if (
        message.includes('创建成功') ||
        message.includes('created successfully') ||
        message.includes('Created successfully')
    ) {
        bgColor = 'bg-green-50';
        textColor = 'text-green-700';
        borderColor = 'border-green-200';
    }

    return (
        <div
            className={`mt-2 p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
        >
            {message}
        </div>
    );
};

export const BelongToProjectCard: React.FC<BelongToProjectCardProps> = ({
    projectName,
    language,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mt-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '所属项目' : 'Belong To Project'}
            </h2>
            <div className="space-y-2">
                <Input
                    id="belongToProject"
                    value={projectName}
                    readOnly
                    className="w-full bg-gray-100"
                />
            </div>
        </div>
    );
};
