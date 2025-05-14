import React, { useContext } from 'react';
import { LanguageContext } from '../../../context';
import { BrushCardProps } from '../types/types';
import store from '@/store';
import GridRecorder from '@/core/grid/NHGridRecorder';
import BoundsCard from '@/components/projectPanel/components/boundsCard';

export default function BasicInfo({}: BrushCardProps) {
    const { language } = useContext(LanguageContext);

    const currentProject = store.get<any>('ProjectName');
    const currentSubproject = store.get<any>('SubprojectName');
    const gridCore = store.get<GridRecorder>('gridRecorder');
    const epsg = gridCore?.srcCRS.replace('EPSG:', '');
    const subdivideRules = gridCore?.subdivideRules.rules;
    const bounds = gridCore?.subdivideRules.bBox.data;

    return (
        <div className="bg-blue-50 p-3 rounded-md">
            <h2 className="text-lg font-bold text-blue-900">
                {language === 'zh' ? '当前项目' : 'Current Project'}
            </h2>
            <div className="text-sm text-blue-800 mt-1 grid gap-1">
                <div>
                    <span className="font-medium">
                        {language === 'zh' ? '项目名称：' : 'Project: '}
                    </span>
                    {currentProject || '-'}
                </div>
                <div>
                    <span className="font-medium">
                        {language === 'zh' ? '子项目：' : 'Subproject: '}
                    </span>
                    {currentSubproject || '-'}
                </div>
                <div>
                    <span className="font-medium">EPSG: {epsg || '-'}</span>
                </div>
                <div className="flex flex-row items-start">
                    <div
                        className="font-medium"
                        style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0 }}
                    >
                        {language === 'zh' ? '网格层级：' : 'GridLevel: '}
                    </div>
                    {subdivideRules && subdivideRules.length > 0 ? (
                        <div
                            className="space-y-1"
                            style={{
                                flexBasis: '80%',
                                flexGrow: 0,
                                flexShrink: 0,
                            }}
                        >
                            {subdivideRules.map((rule, index) => (
                                <div key={index} className="text-sm">
                                    {language === 'zh'
                                        ? `第 ${index + 1} 级: [${rule.join(
                                              ', '
                                          )}]`
                                        : `Level ${index + 1}: [${rule.join(
                                              ', '
                                          )}]`}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="text-sm"
                            style={{
                                flexBasis: '73%',
                                flexGrow: 0,
                                flexShrink: 0,
                            }}
                        >
                            -
                        </div>
                    )}
                </div>
                <div>
                    {language === 'zh' ? '包围盒：' : 'BoundingBox: '}
                    {bounds ? (
                        <BoundsCard bounds={bounds} language={language} />
                    ) : (
                        <span>-</span>
                    )}
                </div>
            </div>
        </div>
    );
}
