import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    SchemaNameCardProps,
    SchemaDescriptionCardProps,
    SchemaEpsgCardProps,
    SchemaCoordinateCardProps,
    SchemaConvertedCoordCardProps,
    GridLevelProps,
    GridLevelItemProps,
    SchemaErrorMessageProps,
} from "./types";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MapPin, X } from "lucide-react";

export const SchemaNameCard: React.FC<SchemaNameCardProps> = ({
    name,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h2 className="text-black text-lg font-semibold mb-2">
                New Schema Name
            </h2>
            <div className="space-y-2">
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        'Enter new schema name'
                    }
                    className={`w-full text-black border-gray-300 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const SchemaDescriptionCard: React.FC<SchemaDescriptionCardProps> = ({
    description,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h2 className="text-black text-lg font-semibold mb-2">
                Schema Description (Optional)
            </h2>
            <div className="space-y-2">
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={'Enter schema description'}
                    className={`w-full text-black border-gray-300 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const SchemaEpsgCard: React.FC<SchemaEpsgCardProps> = ({
    epsg,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-black text-lg font-semibold mb-2">
                EPSG Code
            </h2>
            <div className="space-y-2">
                <Input
                    id="epsg"
                    placeholder={
                        'Enter EPSG code (e.g. 4326)'
                    }
                    className={`text-black w-full border-gray-300 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
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
    hasError,
    isSelectingPoint,
    onLonChange,
    onLatChange,
    onDrawClick,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h2 className="text-black text-lg font-semibold mb-2">
                Coordinate (EPSG:4326)
            </h2>
            <div className="flex items-stretch gap-4">
                {/* 左侧经纬度输入 */}
                <div className="flex-1 flex flex-col justify-between text-black">
                    {/* 经度输入框 */}
                    <div className=" flex items-center gap-2 mb-2">
                        <Label htmlFor="lon" className="text-sm font-medium w-1/4">
                            Longitude
                        </Label>
                        <Input
                            id="lon"
                            type="number"
                            step="0.000001"
                            value={lon}
                            onChange={(e) => onLonChange(e.target.value)}
                            placeholder={'Enter longitude'}
                            className={`w-3/4 border-gray-300 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                        />
                    </div>

                    {/* 纬度输入框 */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="lat" className="text-sm font-medium w-1/4">
                            Latitude
                        </Label>
                        <Input
                            id="lat"
                            type="number"
                            step="0.000001"
                            value={lat}
                            onChange={(e) => onLatChange(e.target.value)}
                            placeholder={'Enter latitude'}
                            className={`w-3/4 border-gray-300 ${hasError ? 'border-red-500 focus:ring-red-500' : ''
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
                                ? 'Cancel'
                                : 'Draw'
                            }
                        </span>
                    </div>
                </Button>
            </div>
        </div>
    );
};

export const SchemaConvertedCoordCard: React.FC<SchemaConvertedCoordCardProps> = ({ convertedCoord, epsg }) => {
    if (!convertedCoord || !epsg) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-black">
            <h2 className="text-lg font-semibold mb-2">
                Converted Coordinate (EPSG:{epsg}
                )
            </h2>
            <div className="flex-1 flex flex-col justify-between">
                {/* X坐标显示 */}
                <div className="flex items-center gap-2 mb-2 ">
                    <Label className="text-sm font-medium w-1/4">X</Label>
                    <div className="w-3/4 p-2 bg-gray-100 rounded border border-gray-300">
                        {convertedCoord.x}
                    </div>
                </div>

                {/* Y坐标显示 */}
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium w-1/4">Y</Label>
                    <div className="w-3/4 p-2 bg-gray-100 rounded border border-gray-300">
                        {convertedCoord.y}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GridLevelItem: React.FC<GridLevelItemProps> = ({
    layer,
    index,
    error,
    onUpdateWidth,
    onUpdateHeight,
    onRemoveLayer,
}) => {

    const text = {
        level: 'Level',
        remove: 'Remove',
        width: 'Width/m',
        height: 'Height/m',
        widthPlaceholder: 'Width',
        heightPlaceholder: 'Height'
    };

    return (
        <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">{text.level} {index + 1}</h4>
                <button
                    className="px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs cursor-pointer"
                    onClick={() => onRemoveLayer(layer.id)}
                >
                    {text.remove}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs mb-1">{text.width}</label>
                    <input
                        type="number"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        value={layer.width}
                        onChange={(e) => onUpdateWidth(layer.id, e.target.value)}
                        placeholder={text.widthPlaceholder}
                    />
                </div>
                <div>
                    <label className="block text-xs mb-1">{text.height}</label>
                    <input
                        type="number"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        value={layer.height}
                        onChange={(e) => onUpdateHeight(layer.id, e.target.value)}
                        placeholder={text.heightPlaceholder}
                    />
                </div>
            </div>
            {error && (
                <div className="mt-2 p-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                    {error}
                </div>
            )}
        </div>
    );
};

export const GridLevel: React.FC<GridLevelProps> = ({
    layers,
    layerErrors,
    onAddLayer,
    onUpdateWidth,
    onUpdateHeight,
    onRemoveLayer,
}) => {
    const text = {
        title: 'Grid Level',
        addButton: 'Add Grid Level',
        noLayers: 'No layers added yet. Click the button above to add a layer.',
        rulesTitle: 'Grid levels should follow these rules:',
        rule1: 'Each level should have smaller cell dimensions than the previous level',
        rule2: "Previous level's width/height must be a multiple of the current level's width/height",
        rule3: 'First level defines the base grid cell size, and higher levels define increasingly finer grids'
    };

    // Sort layers by id
    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);

    return (
        <div className="p-3 bg-white text-black rounded-md shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{text.title}</h3>
                <button
                    type="button"
                    className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm cursor-pointer"
                    onClick={onAddLayer}
                >
                    <span className="text-lg">+</span> {text.addButton}
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
                        />
                    ))}
                </div>
            ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                    {text.noLayers}
                </div>
            )}

            {sortedLayers.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
                    <p>{text.rulesTitle}</p>
                    <ul className="list-disc pl-4 mt-1">
                        <li>
                            {text.rule1}
                        </li>
                        <li>
                            {text.rule2}
                        </li>
                        <li>
                            {text.rule3}
                        </li>
                    </ul>
                </div>
            )}
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
            className={` p-2 ${bgColor} ${textColor} text-sm rounded-md border ${borderColor}`}
        >
            {message}
        </div>
    );
};