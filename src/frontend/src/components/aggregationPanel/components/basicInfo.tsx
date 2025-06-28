import { useContext } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import BoundsCard from '@/components/projectPanel/components/boundsCard';

export default function BasicInfo() {
    const { language } = useContext(LanguageContext);

    const currentProject = store.get<any>('ProjectName');
    const currentPatch = store.get<any>('PatchName');
    const currentEpsg = store.get<any>('CurrentPatchEPSG');
    const bounds = store.get<number[]>('PatchBounds');

    return (
        <div className="bg-blue-50 p-3 rounded-md shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
                {language === 'zh'
                    ? '当前编辑信息'
                    : 'Current Editing Information'}
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
                    {currentEpsg || '-'}
                </div>
                <div className="font-bold">
                    {language === 'zh' ? '编辑范围：' : 'Editing Bounds: '}
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
