import * as React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import GridLevel from '../operatePanel/components/GridLevel';
import {
    SchemaNameCard,
    SchemaDescriptionCard,
    SchemaEpsgCard,
    SchemaCoordinateCard,
    SchemaConvertedCoordCard,
    SchemaErrorMessage,
} from './components/SchemaFormComponents';
import {
    convertCoordinate,
    clearMapMarkers,
    enableMapPointSelection,
} from './utils/SchemaCoordinateService';
import {
    validateGridLayers,
    validateSchemaForm,
    createSchemaData,
} from './utils/SchemaFormValidation';
import { SchemaService } from './utils/SchemaService';
import { TopologyLayer } from './types/types';

interface CreateSchemaProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export default function CreateSchema({ onBack, ...props }: CreateSchemaProps) {
    const { language } = useContext(LanguageContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [lon, setLon] = useState('');
    const [lat, setLat] = useState('');
    const [isSelectingPoint, setIsSelectingPoint] = useState(false);
    const [topologyLayers, setGridLayers] = useState<TopologyLayer[]>([]);
    const [layerErrors, setLayerErrors] = useState<Record<number, string>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [epsg, setEpsg] = useState('');
    const [convertedCoord, setConvertedCoord] = useState<{
        x: string;
        y: string;
    } | null>(null);
    const [formErrors, setFormErrors] = useState<{
        name: boolean;
        description: boolean;
        coordinates: boolean;
        epsg: boolean;
    }>({
        name: false,
        description: false,
        coordinates: false,
        epsg: false,
    });

    const [schemaService] = useState(() => new SchemaService(language));

    useEffect(() => {
        schemaService.setLanguage(language);
    }, [language, schemaService]);

    useEffect(() => {
        if (lon && lat && epsg) {
            const result = convertCoordinate(lon, lat, '4326', epsg);
            setConvertedCoord(result);
        } else {
            setConvertedCoord(null);
        }
    }, [lon, lat, epsg]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateSchemaForm(
            { name, epsg, lon, lat, topologyLayers, convertedCoord },
            language
        );

        if (!validation.isValid) {
            setFormErrors(validation.errors);
            setGeneralError(validation.generalError);
            return;
        }

        const schemaData = createSchemaData(
            name,
            description,
            epsg,
            convertedCoord,
            topologyLayers
        );

        if (!schemaData) {
            setGeneralError(
                language === 'zh'
                    ? '无法创建Schema数据'
                    : 'Unable to create Schema data'
            );
            return;
        }

        setGeneralError(
            language === 'zh' ? '正在提交数据...' : 'Submitting data...'
        );

        schemaService.submitSchemaData(
            schemaData,
            isSelectingPoint,
            (err, result) => {
                if (err) {
                    setGeneralError(result.message);
                    // clearMapMarkers();
                } else {
                    if (result && result.success === false) {
                        setGeneralError(result.message);
                        // clearMapMarkers();
                    } else {
                        setGeneralError(
                            language === 'zh'
                                ? '创建成功！'
                                : 'Created successfully!'
                        );
                        setTimeout(() => {
                            if (onBack) {
                                onBack();
                            }
                        }, 1000);
                    }
                    setIsSelectingPoint(false);
                }
            }
        );
    };

    const handleBack = () => {
        clearMapMarkers();

        if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            setIsSelectingPoint(false);
        }

        if (onBack) {
            onBack();
        }
    };

    const handleDraw = () => {
        if (isSelectingPoint && window.mapInstance) {
            if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }

            setIsSelectingPoint(false);
            return;
        }

        setIsSelectingPoint(true);

        if (window.mapInstance) {
            enableMapPointSelection(window.mapInstance, (lng, lat) => {
                setLon(lng.toFixed(6));
                setLat(lat.toFixed(6));
                setIsSelectingPoint(false);
            });
        }
    };

    const handleAddLayer = () => {
        setGridLayers((prevLayers) => {
            const nextId =
                prevLayers.length > 0
                    ? Math.max(...prevLayers.map((layer) => layer.id)) + 1
                    : 0;

            const updatedLayers = [
                ...prevLayers,
                { id: nextId, width: '', height: '' },
            ];

            const { errors } = validateGridLayers(updatedLayers, language);
            setLayerErrors(errors);

            return updatedLayers;
        });
    };

    const handleUpdateWidth = (id: number, width: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, width } : layer
            );

            const { errors } = validateGridLayers(updatedLayers, language);
            setLayerErrors(errors);

            return updatedLayers;
        });
    };

    const handleUpdateHeight = (id: number, height: string) => {
        setGridLayers((prevLayers) => {
            const updatedLayers = prevLayers.map((layer) =>
                layer.id === id ? { ...layer, height } : layer
            );

            const { errors } = validateGridLayers(updatedLayers, language);
            setLayerErrors(errors);

            return updatedLayers;
        });
    };

    const handleRemoveLayer = (id: number) => {
        setGridLayers((prevLayers) => {
            const filteredLayers = prevLayers.filter(
                (layer) => layer.id !== id
            );

            const { errors } = validateGridLayers(filteredLayers, language);
            setLayerErrors(errors);

            return filteredLayers;
        });
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <div className="flex items-center p-3 mb-0">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh' ? '创建新模式' : 'Create New Schema'}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-1 pt-0 -mt-3">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="p-1">
                                <SchemaNameCard
                                    name={name}
                                    language={language}
                                    hasError={formErrors.name}
                                    onChange={setName}
                                />

                                <SchemaDescriptionCard
                                    description={description}
                                    language={language}
                                    hasError={formErrors.description}
                                    onChange={setDescription}
                                />

                                <SchemaEpsgCard
                                    epsg={epsg}
                                    language={language}
                                    hasError={formErrors.epsg}
                                    onChange={setEpsg}
                                />

                                <SchemaCoordinateCard
                                    lon={lon}
                                    lat={lat}
                                    language={language}
                                    hasError={formErrors.coordinates}
                                    isSelectingPoint={isSelectingPoint}
                                    onLonChange={setLon}
                                    onLatChange={setLat}
                                    onDrawClick={handleDraw}
                                />

                                <SchemaConvertedCoordCard
                                    convertedCoord={convertedCoord}
                                    epsg={epsg}
                                    language={language}
                                />

                                <GridLevel
                                    layers={topologyLayers}
                                    layerErrors={layerErrors}
                                    onAddLayer={handleAddLayer}
                                    onUpdateWidth={handleUpdateWidth}
                                    onUpdateHeight={handleUpdateHeight}
                                    onRemoveLayer={handleRemoveLayer}
                                />

                                <SchemaErrorMessage message={generalError} />

                                <Button
                                    type="submit"
                                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {language === 'zh'
                                        ? '创建并返回'
                                        : 'Create and Back'}
                                </Button>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </form>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
