import { useContext, useState } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GridInfo } from '@/core/grid/NHGrid';
import { Label } from '@/components/ui/label';

export default function GridChecking() {
    const { language } = useContext(LanguageContext);
    const [gridChecking, setGridChecking] = useState(false);
    const [gridInfo, setGridInfo] = useState<GridInfo | null>(null);

    store.set('changeGridInfo', {
        on: () => {
            setGridInfo(store.get<GridInfo>('GridInfo'));
        },
    });

    return (
        <div className="bg-white p-2 mt-2 rounded-md shadow-sm ">
            <div className="flex mt-1 mb-1 ml-1 items-center">
                <h2 className="text-2xl font-bold ">
                    {language === 'zh' ? '查看' : 'Checking'}
                </h2>
                <Label className='text-gray-400 ml-auto mr-2'>{language === 'zh' ? '开启' : 'Enable'}</Label>
                <Switch
                    onClick={() => {
                        setGridChecking(!gridChecking);
                        store.set(
                            'gridCheckingOn',
                            !store.get<boolean>('gridCheckingOn')
                        );
                    }}
                    className="bg-gray-900 data-[state=checked]:bg-[#FF8F2E] cursor-pointer mr-2"
                />
            </div>
            {gridChecking && (
                <>
                    <Separator />
                    <div className="text-md p-1 gap-4">
                        <div>
                            <span className="font-bold">level: </span>
                            {gridInfo?.level ?? '-'}
                        </div>
                        <div>
                            <span className="font-bold">localId: </span>
                            {gridInfo?.localId ?? '-'}
                        </div>
                        <div>
                            <span className="font-bold">deleted: </span>
                            {gridInfo?.deleted === true
                                ? 'true'
                                : gridInfo?.deleted === false
                                ? 'false'
                                : '-'}
                        </div>
                        <div>
                            <span className="font-bold">globalId: </span>
                            {gridInfo?.globalId ?? '-'}
                        </div>
                        <div>
                            <span className="font-bold">storageId: </span>
                            {gridInfo?.storageId ?? '-'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
