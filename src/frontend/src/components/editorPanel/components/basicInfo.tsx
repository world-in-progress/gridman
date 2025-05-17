import React, { useContext, useEffect } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridRecorder from '@/core/grid/NHGridRecorder';
import BoundsCard from '@/components/projectPanel/components/boundsCard';
import { SchemaService } from '../../schemaPanel/utils/SchemaService';
import { ProjectService } from '../../projectPanel/utils/ProjectService';

export default function BasicInfo() {
    const { language } = useContext(LanguageContext);

    const currentProject = store.get<any>('ProjectName');
    const currentSubproject = store.get<any>('SubprojectName');
    const gridCore = store.get<GridRecorder>('gridRecorder');
    const epsg = gridCore?.srcCRS.replace('EPSG:', '');
    const subdivideRules = gridCore?.subdivideRules.rules;
    const bounds = gridCore?.subdivideRules.bBox.data;

    useEffect(() => {
        const schemaService = new SchemaService(language);
        const projectService = new ProjectService(language);
        const schemaName = projectService.getProjectByName(currentProject);
        console.log(schemaName);
            // schemaService.getSchemaByName(schemaName, (err, result) => {
            //     if (!err && result?.project_schema?.epsg) {
            //         setSchemaEpsg(result.project_schema.epsg.toString());
            //     }
            //     if (!err && result?.project_schema?.grid_info) {
            //         console.log(result.project_schema.grid_info);
            //         setSchemaGridInfo(result.project_schema.grid_info);
            //     }
        // });
    }, [currentProject, language]);

    return (
        <div className="bg-blue-50 p-3 rounded-md">
            <h2 className="text-xl font-bold text-blue-900">
                {language === 'zh' ? '当前编辑' : 'Current Editing'}
            </h2>
            <div className="text-sm text-blue-800 mt-1 grid gap-1">
                <div>
                    <span className="font-bold">
                        {language === 'zh' ? '项目名称：' : 'Project: '}
                    </span>
                    {currentProject || '-'}
                </div>
                <div>
                    <span className="font-bold">
                        {language === 'zh' ? '子项目：' : 'Subproject: '}
                    </span>
                    {currentSubproject || '-'}
                </div>
                <div>
                    <span className="font-bold">EPSG: {epsg || '-'}</span>
                </div>
                <div className="flex flex-row items-start">
                    <div
                        className="font-bold"
                        style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0 }}
                    >
                        {language === 'zh' ? '细分规则：' : 'Subdivide: '}
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
                <div className="font-bold">
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
