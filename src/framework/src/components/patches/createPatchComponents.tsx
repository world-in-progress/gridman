import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    PatchNameCardProps,
    PatchDescriptionCardProps,
    BelongToProjectCardProps,
    ProjectEpsgCardProps,
    ProjectErrorMessageProps
} from "./types";

export const PatchNameCard: React.FC<PatchNameCardProps> = ({
    name,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
                New Patch Name
            </h2>
            <div className="space-y-2">
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={'Enter new patch name'}
                    className={`w-full ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const PatchDescriptionCard: React.FC<PatchDescriptionCardProps> = ({
    description,
    hasError,
    onChange,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                Patch Description
            </h2>
            <div className="space-y-2">
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={'Enter description information'}
                    className={`w-full ${hasError ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                />
            </div>
        </div>
    );
};

export const BelongToProjectCard: React.FC<BelongToProjectCardProps> = ({
    projectName
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mt-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
                Belong To Project
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

export const ProjectEpsgCard: React.FC<ProjectEpsgCardProps> = ({
    epsg,
    hasError,
    onChange,
    epsgFromProps = false,
    formErrors,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mt-4">
            <h2 className="text-lg font-semibold mb-2">
                Target Coordinate System (EPSG)
            </h2>
            <div className="space-y-2">
                <div className="flex items-center">
                    <span className="mr-2">EPSG:</span>
                    <Input
                        id="epsg"
                        placeholder={'e.g. 3857'}
                        className={`w-full ${hasError || (formErrors && formErrors.epsg) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                            } ${epsgFromProps ? 'bg-gray-100' : ''}`}
                        value={epsg}
                        onChange={(e) => !epsgFromProps && onChange(e.target.value)}
                        readOnly={epsgFromProps}
                    />
                </div>
                {formErrors && formErrors.epsg && (
                    <p className="text-red-500 text-sm mt-1">
                        Please enter a valid EPSG code
                    </p>
                )}
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
