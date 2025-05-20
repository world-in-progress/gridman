import { useContext, useState } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function GridChecking() {
    const { language } = useContext(LanguageContext);
    const [gridChecking, setGridChecking] = useState(false);
    store.set('gridCheckingOn', false);

    return (
        <div className="bg-white p-2 mt-2 rounded-md shadow-sm ">
            <div className="flex mt-1 ml-1 gap-3 items-center">
                <h2 className="text-xl font-bold ">
                    {language === 'zh'
                        ? '网格查看信息'
                        : 'Grid Checking Information'}
                </h2>
                <Switch
                    onClick={() => {
                        setGridChecking(!gridChecking);
                        console.log(store.get('gridCore'));
                    }}
                    className="bg-gray-900 data-[state=checked]:bg-[#FF8F2E] cursor-pointer"
                />
            </div>
            {gridChecking && (
                <div className="text-sm mt-1 grid gap-1 border border-gray-200 rounded-md shadow-sm p-2">
                    <div>
                        <span className="font-bold">
                            {language === 'zh' ? '项目名称：' : 'Project: '}
                        </span>
                        项目名称：
                    </div>
                    <div>
                        <span className="font-bold">
                            {language === 'zh' ? '子项目：' : 'Subproject: '}
                        </span>
                        子项目：
                    </div>
                    <div>
                        <span className="font-bold">EPSG:</span>
                    </div>
                    <div className="flex items-start flex-row">
                        {language === 'zh' ? '网格等级' : 'Grid Levels'}(m):
                    </div>
                </div>
            )}
        </div>
    );
}
