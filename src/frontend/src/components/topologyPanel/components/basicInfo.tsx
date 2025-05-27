import { useContext } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import BoundsCard from '@/components/projectPanel/components/boundsCard';

export default function BasicInfo() {
    const { language } = useContext(LanguageContext);

    const currentProject = store.get<any>('ProjectName');
    const currentPatch = store.get<any>('PatchName');
    const gridCore = store.get<GridCore>('gridCore');
    const epsg = gridCore?.srcCRS.replace('EPSG:', '');
    const bounds = gridCore?.context.bBox.data;
    const schemaGridInfo = store.get<number[][]>('SchemaGridInfo');
    const paletteColorList = store.get<Uint8Array>('paletteColorList');

    return (
        <div className="bg-blue-50 p-3 rounded-md shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
                {language === 'zh' ? '当前编辑信息' : 'Current Editing Information'}
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
                        {language === 'zh' ? '补丁：' : 'Patch: '}
                    </span>
                    {currentPatch || '-'}
                </div>
                <div>
                    <span className="font-bold">EPSG: </span>
                    {epsg || '-'}
                </div>
                <div className="flex items-start flex-row">
                    <div
                        className={`font-bold ${language === 'zh' ? 'w-[28%]' : 'w-[35%]'}`}
                    >
                        {language === 'zh' ? '网格等级' : 'Grid Levels'}(m):
                    </div>
                    <div
                        className="space-y-1"
                    >
                        {schemaGridInfo ? (
                            schemaGridInfo.map(
                                (level: number[], index: number) => {
                                    const color = paletteColorList ?
                                        [paletteColorList[(index+1) * 3], paletteColorList[(index+1) * 3 + 1], paletteColorList[(index+1) * 3 + 2]] :
                                        null;
                                    const colorStyle = color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : undefined;

                                    return (
                                        <div key={index} className="text-sm" style={{ color: colorStyle }}>
                                            level {index + 1}: [{level.join(', ')}]
                                        </div>
                                    );
                                }
                            )
                        ) : (
                            <span>-</span>
                        )}
                    </div>
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
