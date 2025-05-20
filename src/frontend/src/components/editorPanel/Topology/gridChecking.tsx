import { useContext, useState } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function GridChecking() {
    const { language } = useContext(LanguageContext);
    const [gridChecking, setGridChecking] = useState(false);
    

    return (
        <div className="bg-white p-2 mt-2 rounded-md shadow-sm ">
            <div className="flex mt-1 mb-1 ml-1 gap-3 items-center">
                <h2 className="text-xl font-bold ">
                    {language === 'zh'
                        ? '网格查看信息'
                        : 'Grid Checking Information'}
                </h2>
                <Switch
                    onClick={() => {
                        console.log('点击前的开关状态', store.get<boolean>('gridCheckingOn'));
                        setGridChecking(!gridChecking);
                        store.set('gridCheckingOn', !store.get<boolean>('gridCheckingOn'));
                        console.log('点击后的开关状态', store.get<boolean>('gridCheckingOn'));
                    }}
                    className="bg-gray-900 data-[state=checked]:bg-[#FF8F2E] cursor-pointer"
                />
            </div>
            {gridChecking && (
                <>
                    <Separator />
                    <div className="text-sm p-1 gap-2">
                        <div>
                            <span className="font-bold">
                                {language === 'zh' ? '项目名称：' : 'Project: '}
                            </span>
                            项目名称：
                        </div>
                        <div>
                            <span className="font-bold">
                                {language === 'zh'
                                    ? '子项目：'
                                    : 'Subproject: '}
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
                </>
            )}
        </div>
    );
}
