import { useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../../../context';
import { AttributePanelProps } from '../types/types';
import store from '@/store';
import NHLayerGroup from '@/components/mapComponent/utils/NHLayerGroup';
// import AttributeLayer from '@/components/mapComponent/layers/AttributeLayer';

export default function AttributePanel({}: AttributePanelProps) {
    const { language } = useContext(LanguageContext);

    const clg = store.get<NHLayerGroup>('clg')!;
    // const attributeLayer = clg.getLayerInstance(
    //     'AttributeLayer'
    // )! as AttributeLayer;

    return (
        <div className="mt-2 space-y-2 p-2 bg-white rounded-md shadow-sm border border-gray-200 relative">
            <h3 className="text-2xl mt-1 ml-1 font-bold">
                {language === 'zh' ? '属性' : 'Attribute'}
            </h3>
            <div className="mt-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                <h3 className="text-md ml-1 mb-1 font-bold">
                    {language === 'zh' ? '属性' : 'attribute'}
                </h3>
            </div>
        </div>
    );
}
