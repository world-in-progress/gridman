import { useContext, useState } from 'react';
import { LanguageContext } from '../../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GridInfo } from '@/core/grid/NHGrid';

export default function GridChecking() {
    const { language } = useContext(LanguageContext);
    const [gridChecking, setGridChecking] = useState(false);
    const [gridInfo, setGridInfo] = useState<GridInfo | null>(null);

    store.set('changeGridInfo', {
        on: () => {
            setGridInfo(store.get<GridInfo>('GridInfo'))
        }
    })

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
                        setGridChecking(!gridChecking);
                        store.set(
                            'gridCheckingOn',
                            !store.get<boolean>('gridCheckingOn')
                        );
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
                                globalId:{' '}
                            </span>
                            {gridInfo?.globalId || '-'}
                        </div>
                        <div>
                            <span className="font-bold">
                                storageId:{' '}
                            </span>
                            {gridInfo?.storageId || '-'}
                        </div>
                        <div>
                            <span className="font-bold">
                                localId:{' '}
                            </span>
                            {gridInfo?.localId || '-'}
                        </div>
                        <div>
                            <span className="font-bold">
                                level:{' '}
                            </span>
                            {gridInfo?.level || '-'}
                        </div>
                        <div>
                            <span className="font-bold">
                                deleted:{' '}
                            </span>
                            {gridInfo?.deleted === true
                                ? 'true'
                                : gridInfo?.deleted === false
                                ? 'false'
                                : '-'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
