import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Schema } from '../types/types';
import { CreateFromDialogProps } from '../types/types';

export const CreateFromDialog: React.FC<CreateFromDialogProps> = ({
    schema,
    isOpen,
    language,
    onClose,
    onClone,
}) => {
    const [name, setName] = useState(`${schema.name}_copy`);
    const [description, setDescription] = useState(schema.description || '');
    const [starred, setStarred] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError(
                language === 'zh'
                    ? '模板名称不能为空'
                    : 'Schema name cannot be empty'
            );
            return;
        }

        try {
            setIsSubmitting(true);

            const newSchema: Schema = {
                ...schema,
                name,
                description,
                starred,
            };

            await onClone(newSchema);
            onClose();
        } catch (err) {
            console.error('Failed to clone schema:', err);
            setError(
                language === 'zh'
                    ? err instanceof Error
                        ? err.message
                        : '创建模板失败，请重试'
                    : err instanceof Error
                    ? err.message
                    : 'Failed to create schema, please try again'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">
                        {language === 'zh'
                            ? '基于此创建新模板'
                            : 'Create New Schema From This'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        aria-label={language === 'zh' ? '关闭' : 'Close'}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="schema-name"
                                className="block text-sm font-medium mb-1"
                            >
                                {language === 'zh' ? '名称' : 'Name'}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="schema-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                                required
                                aria-label={
                                    language === 'zh'
                                        ? '模板名称'
                                        : 'Schema name'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '输入模板名称'
                                        : 'Enter schema name'
                                }
                            />
                        </div>

                        {/* EPSG (Read-only) */}
                        <div>
                            <label
                                htmlFor="schema-epsg"
                                className="block text-sm font-medium mb-1"
                            >
                                EPSG
                            </label>
                            <input
                                id="schema-epsg"
                                type="text"
                                value={schema.epsg}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                                disabled
                                aria-label="EPSG"
                                placeholder="EPSG"
                            />
                        </div>

                        {/* Base Point (Read-only) */}
                        <div>
                            <label
                                htmlFor="schema-basepoint"
                                className="block text-sm font-medium mb-1"
                            >
                                {language === 'zh' ? '基准点' : 'Base Point'}
                            </label>
                            <input
                                id="schema-basepoint"
                                type="text"
                                value={
                                    schema.base_point
                                        ? `[${schema.base_point[0].toFixed(
                                              2
                                          )}, ${schema.base_point[1].toFixed(
                                              2
                                          )}]`
                                        : '-'
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                                disabled
                                aria-label={
                                    language === 'zh' ? '基准点' : 'Base Point'
                                }
                                placeholder={
                                    language === 'zh' ? '基准点' : 'Base Point'
                                }
                            />
                        </div>

                        {/* Grid Info (Read-only) */}
                        <div>
                            <label
                                htmlFor="schema-gridinfo"
                                className="block text-sm font-medium mb-1"
                            >
                                {language === 'zh' ? '网格层级' : 'Grid Levels'}
                            </label>
                            <textarea
                                id="schema-gridinfo"
                                value={
                                    schema.grid_info
                                        ? schema.grid_info
                                              .map(
                                                  (gridLevel, idx) =>
                                                      `${
                                                          language === 'zh'
                                                              ? '层级'
                                                              : 'Level'
                                                      } ${
                                                          idx + 1
                                                      }: [${gridLevel.join(
                                                          ', '
                                                      )}]`
                                              )
                                              .join('\n')
                                        : '-'
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 min-h-[80px] resize-none"
                                disabled
                                aria-label={
                                    language === 'zh'
                                        ? '网格层级'
                                        : 'Grid Levels'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '网格层级'
                                        : 'Grid Levels'
                                }
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="schema-description"
                                className="block text-sm font-medium mb-1"
                            >
                                {language === 'zh' ? '描述' : 'Description'}
                            </label>
                            <textarea
                                id="schema-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[80px]"
                                aria-label={
                                    language === 'zh'
                                        ? '模板描述'
                                        : 'Schema description'
                                }
                                placeholder={
                                    language === 'zh'
                                        ? '输入模板描述'
                                        : 'Enter schema description'
                                }
                            />
                        </div>

                        {/* Star */}
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => setStarred(!starred)}
                                className="flex items-center space-x-2 cursor-pointer"
                                aria-label={
                                    language === 'zh'
                                        ? '收藏此模板'
                                        : 'Star this schema'
                                }
                            >
                                <Star
                                    className={`h-5 w-5 ${
                                        starred
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : ''
                                    }`}
                                />
                                <span>
                                    {language === 'zh'
                                        ? '收藏此模板'
                                        : 'Star this schema'}
                                </span>
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                            disabled={isSubmitting}
                        >
                            {language === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? language === 'zh'
                                    ? '处理中...'
                                    : 'Processing...'
                                : language === 'zh'
                                ? '完成'
                                : 'Done'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
