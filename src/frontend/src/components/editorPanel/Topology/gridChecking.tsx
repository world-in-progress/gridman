import { useContext, useState, useEffect } from 'react';
import { LanguageContext, CheckingSwitch } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GridCheckingInfo } from '@/core/grid/types';
import { Label } from '@/components/ui/label';

export default function GridChecking() {
    const { language } = useContext(LanguageContext);
    const [gridChecking, setGridChecking] = useState(false);
    const [gridInfo, setGridInfo] = useState<GridCheckingInfo | null>(null);

    store.set('changeGridInfo', {
        on: () => {
            setGridInfo(store.get<GridCheckingInfo>('GridInfo'));
        },
    });

    useEffect(() => {
        const checkOnEvent = () => setGridChecking(true);
        const checkOffEvent = () => setGridChecking(false);
        const checkingSwitch: CheckingSwitch = store.get('checkingSwitch')!;
        checkingSwitch.addEventListener('on', checkOnEvent);
        checkingSwitch.addEventListener('off', checkOffEvent);
        
        return () => {
            const checkingSwitch: CheckingSwitch = store.get('checkingSwitch')!;
            if (checkingSwitch.isOn) {
                checkingSwitch.switch();
            }
            checkingSwitch.removeEventListener('on', checkOnEvent);
            checkingSwitch.removeEventListener('off', checkOffEvent);
        };
    }, []);

    return (
        <div className="bg-white p-2 mt-2 rounded-md shadow-sm ">
            <div className="flex mt-1 mb-1 ml-1 items-center">
                <h2 className="text-2xl font-bold ">
                    {language === 'zh' ? '查看' : 'Checking'}
                </h2>
                <div className="p-2 bg-white border border-gray-200 rounded-4xl shadow-sm flex gap-2 ml-auto">
                    <Label
                        className={`${
                            gridChecking ? 'text-[#FF8F2E]' : 'text-gray-400'
                        }  ml-1`}
                    >
                        {language === 'zh' ? '开启' : 'Enable'}
                    </Label>
                    <Switch
                        onClick={() => {
                            store
                                .get<CheckingSwitch>('checkingSwitch')!
                                .switch();
                        }}
                        className="bg-gray-900 data-[state=checked]:bg-[#FF8F2E] cursor-pointer mr-2"
                    />
                </div>
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
