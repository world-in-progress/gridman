import * as React from 'react';
import { MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    SchemaNameCardProps,
    SchemaDescriptionCardProps,
    SchemaEpsgCardProps,
    SchemaCoordinateCardProps,
    SchemaConvertedCoordCardProps,
    SchemaErrorMessageProps,
} from '../types/types';

export const SchemaNameCard: React.FC<SchemaNameCardProps> = ({
    name,
    language,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '新模板名称' : 'New Schema Name'}
            </h2>
            <div className="space-y-2">
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        language === 'zh' ? '输入新模式名称' : 'Enter new schema name'
                    }
                    className={`w-full ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const SchemaDescriptionCard: React.FC<SchemaDescriptionCardProps> = ({
    description,
    language,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '模板描述(选填)' : 'Schema Description (Optional)'}
            </h2>
            <div className="space-y-2">
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        language === 'zh' ? '输入描述信息' : 'Enter description information'
                    }
                    className={`w-full ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const SchemaEpsgCard: React.FC<SchemaEpsgCardProps> = ({
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
                    className={`w-full ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                    value={epsg}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export const SchemaCoordinateCard: React.FC<SchemaCoordinateCardProps> = ({
    lon,
    lat,
    language,
    hasError,
    isSelectingPoint,
    onLonChange,
    onLatChange,
    onDrawClick,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '坐标' : 'Coordinate'} (EPSG:4326)
            </h2>
            <div className="flex items-stretch gap-4">
                {/* 左侧经纬度输入 */}
                <div className="flex-1 flex flex-col justify-between">
                    {/* 经度输入框 */}
                    <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="lon" className="text-sm font-medium w-1/4">
                            {language === 'zh' ? '经度' : 'Longitude'}
                        </Label>
                        <Input
                            id="lon"
                            type="number"
                            step="0.000001"
                            value={lon}
                            onChange={(e) => onLonChange(e.target.value)}
                            placeholder={language === 'zh' ? '输入经度' : 'Enter longitude'}
                            className={`w-3/4 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                        />
                    </div>

                    {/* 纬度输入框 */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="lat" className="text-sm font-medium w-1/4">
                            {language === 'zh' ? '纬度' : 'Latitude'}
                        </Label>
                        <Input
                            id="lat"
                            type="number"
                            step="0.000001"
                            value={lat}
                            onChange={(e) => onLatChange(e.target.value)}
                            placeholder={language === 'zh' ? '输入纬度' : 'Enter latitude'}
                            className={`w-3/4 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                        />
                    </div>
                </div>

                {/* 右侧Draw按钮 */}
                <Button
                    type="button"
                    onClick={onDrawClick}
                    className={`w-[80px] h-[84px] ${isSelectingPoint
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                        } text-white cursor-pointer`}
                >
                    <div className="flex flex-col items-center">
                        {isSelectingPoint ? (
                            <X className="h-8 w-8 mb-1 font-bold stroke-6" />
                        ) : (
                            <MapPin className="h-8 w-8 mb-1 stroke-2" />
                        )}
                        <span>
                            {isSelectingPoint
                                ? language === 'zh'
                                    ? '取消'
                                    : 'Cancel'
                                : language === 'zh'
                                    ? '绘制'
                                    : 'Draw'}
                        </span>
                    </div>
                </Button>
            </div>
        </div>
    );
};

export const SchemaConvertedCoordCard: React.FC<SchemaConvertedCoordCardProps> = ({ convertedCoord, epsg, language }) => {
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

export const SchemaErrorMessage: React.FC<SchemaErrorMessageProps> = ({
    message,
}) => {
    if (!message) return null;

    let bgColor = 'bg-red-50';
    let textColor = 'text-red-700';
    let borderColor = 'border-red-200';

    if (message.includes('正在提交数据') || message.includes('Submitting data')) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        borderColor = 'border-orange-200';
    } else if (
        message.includes('创建成功') ||
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
