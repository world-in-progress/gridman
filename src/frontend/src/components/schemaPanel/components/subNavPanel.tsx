import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '../../../App';
import proj4 from 'proj4';
import {
  epsgDefinitions,
  convertCoordinate,
} from '../../operatePanel/utils/coordinateUtils';
import { SidebarGroup, useSidebar } from '@/components/ui/sidebar';
import { Schema, SubNavItem, SubNavPanelProps } from '../types/types';
import { findSchemaPage } from '../utils/utils';
import { SchemaCard } from './SchemaCard';
import { SchemaService } from '../utils/SchemaService';
import { MapMarkerManager } from '../utils/MapMarkerManager';

Object.keys(epsgDefinitions).forEach((epsg) => {
  proj4.defs(`EPSG:${epsg}`, epsgDefinitions[epsg]);
});

export function SubNavPanel({
  items: propItems,
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
  onNavigateToPage,
}: SubNavPanelProps) {
  const { language } = useContext(LanguageContext);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starredItems, setStarredItems] = useState<Record<string, boolean>>({});
  const [allSchemas, setAllSchemas] = useState<Schema[]>([]);
  const [highlightedSchema, setHighlightedSchema] = useState<string | null>(
    null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string | null>(
    null
  );
  const [descriptionText, setDescriptionText] = useState<
    Record<string, string>
  >({});
  const [schemaService] = useState(() => new SchemaService(language));
  const [markerManager] = useState(
    () =>
      new MapMarkerManager(
        language,
        (schemaName) => setHighlightedSchema(schemaName),
        (schemaName) => navigateToSchemaPage(schemaName)
      )
  );

  const fetchSchemasCallback = useCallback(async (page: number) => {
    try {
      setLoading(true);

      const result = await schemaService.fetchSchemas(page, itemsPerPage);

      onTotalItemsChange(result.totalCount);
      setSchemas(result.schemas);
      updateStarredItems(result.schemas);

      setLoading(false);
    } catch (err) {
      setError(
        language === 'zh' ? '获取模板列表失败' : 'Failed to fetch schemas'
      );
      setLoading(false);
    }
  }, [language, itemsPerPage, onTotalItemsChange, schemaService]);

  const fetchAllSchemasCallback = useCallback(async () => {
    try {
      const schemas = await schemaService.fetchAllSchemas();
      setAllSchemas(schemas);
      updateStarredItems(schemas);

      if (schemas.length > 0) {
        markerManager.showAllSchemasOnMap(schemas);
      }
    } catch (err) {
      console.error('Failed to fetch all schemas:', err);
    }
  }, [markerManager, schemaService]);

  useEffect(() => {
    schemaService.setLanguage(language);
    markerManager.setLanguage(language);
  }, [language, schemaService, markerManager]);

  useEffect(() => {
    fetchAllSchemasCallback();
  }, [fetchAllSchemasCallback]);
  
  useEffect(() => {
    fetchSchemasCallback(currentPage);
  }, [currentPage, fetchSchemasCallback]);

  const updateStarredItems = (schemaList: Schema[]) => {
    const newStarredItems: Record<string, boolean> = {};
    const newDescriptionText: Record<string, string> = {};
    schemaList.forEach((schema) => {
      if (schema.name) {
        newStarredItems[schema.name] = schema.starred || false;
        newDescriptionText[schema.name] = schema.description || '';
      }
    });
    setStarredItems(newStarredItems);
    setDescriptionText(newDescriptionText);
  };

  const toggleStar = async (name: string, schema: Schema) => {
    const newState = !starredItems[name];

    try {
      setStarredItems((prev) => ({
        ...prev,
        [name]: newState,
      }));

      setSchemas(
        schemas.map((s) =>
          s.name === schema.name ? { ...s, starred: newState } : s
        )
      );

      setAllSchemas((prevAllSchemas) => {
        const updatedAllSchemas = prevAllSchemas.map((s) =>
          s.name === schema.name ? { ...s, starred: newState } : s
        );
        markerManager.showAllSchemasOnMap(updatedAllSchemas);
        return updatedAllSchemas;
      });

      const updatedSchema = await schemaService.updateSchemaStarred(
        schema.name,
        newState
      );

      if (updatedSchema && updatedSchema.starred !== undefined) {
        const serverStarredState = updatedSchema.starred;

        if (serverStarredState !== newState) {
          setStarredItems((prev) => ({
            ...prev,
            [name]: serverStarredState,
          }));

          setSchemas(
            schemas.map((s) =>
              s.name === schema.name ? { ...s, starred: serverStarredState } : s
            )
          );

          setAllSchemas((prevAllSchemas) => {
            const updatedWithServerState = prevAllSchemas.map((s) =>
              s.name === schema.name ? { ...s, starred: serverStarredState } : s
            );
            markerManager.showAllSchemasOnMap(updatedWithServerState);
            return updatedWithServerState;
          });

          fetchSchemasCallback(currentPage);
        }
      }
    } catch (err) {
      setStarredItems((prev) => ({
        ...prev,
        [name]: !newState,
      }));

      setSchemas(
        schemas.map((s) =>
          s.name === schema.name ? { ...s, starred: !newState } : s
        )
      );

      setAllSchemas((prevAllSchemas) => {
        const rolledBackSchemas = prevAllSchemas.map((s) =>
          s.name === schema.name ? { ...s, starred: !newState } : s
        );
        markerManager.showAllSchemasOnMap(rolledBackSchemas);
        return rolledBackSchemas;
      });
    }
  };

  const navigateToSchemaPage = (schemaName: string) => {
    const page = findSchemaPage(schemaName, allSchemas, itemsPerPage);

    if (page !== currentPage && onNavigateToPage) {
      onNavigateToPage(page);
    }
  };

  const flyToSchema = (schema: Schema) => {
    markerManager.flyToSchema(schema);
  };

  const toggleEditDescription = (name: string) => {
    if (editingDescription === name) {
      setEditingDescription(null);
    } else {
      setEditingDescription(name);
    }
  };

  const handleDescriptionChange = (name: string, value: string) => {
    setDescriptionText({
      ...descriptionText,
      [name]: value,
    });
  };

  const updateDescription = async (name: string, schema: Schema) => {
    const newDescription = descriptionText[name] || '';

    try {
      setSchemas(
        schemas.map((s) =>
          s.name === schema.name ? { ...s, description: newDescription } : s
        )
      );

      setAllSchemas((prevAllSchemas) => {
        const updatedAllSchemas = prevAllSchemas.map((s) =>
          s.name === schema.name ? { ...s, description: newDescription } : s
        );
        return updatedAllSchemas;
      });

      const updatedSchema = await schemaService.updateSchemaDescription(
        schema.name,
        newDescription
      );

      if (updatedSchema && updatedSchema.description !== undefined) {
        const serverDescription = updatedSchema.description;

        if (serverDescription !== newDescription) {
          setDescriptionText((prev) => ({
            ...prev,
            [name]: serverDescription,
          }));

          setSchemas(
            schemas.map((s) =>
              s.name === schema.name
                ? { ...s, description: serverDescription }
                : s
            )
          );

          setAllSchemas((prevAllSchemas) => {
            const updatedWithServerState = prevAllSchemas.map((s) =>
              s.name === schema.name
                ? { ...s, description: serverDescription }
                : s
            );
            return updatedWithServerState;
          });
        }
      }

      setEditingDescription(null);
    } catch (err) {
      setDescriptionText((prev) => ({
        ...prev,
        [name]: schema.description || '',
      }));

      setSchemas(
        schemas.map((s) =>
          s.name === schema.name ? { ...s, description: schema.description } : s
        )
      );

      setAllSchemas((prevAllSchemas) => {
        const rolledBackSchemas = prevAllSchemas.map((s) =>
          s.name === schema.name ? { ...s, description: schema.description } : s
        );
        return rolledBackSchemas;
      });

      setEditingDescription(null);
    }
  };

  useEffect(() => {
    if (allSchemas.length > 0) {
      markerManager.showAllSchemasOnMap(allSchemas);
    }
  }, [language, allSchemas, markerManager]);

  useEffect(() => {
    return () => {
      markerManager.clearAllMarkers();
    };
  }, [markerManager]);

  const items: SubNavItem[] = schemas.map((schema) => ({
    title: schema.name,
    url: '#',
    schema: schema,
    items: [
      {
        title: language === 'zh' ? '显示详情' : 'Show Details',
        url: `#/schemas/${schema.name}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          flyToSchema(schema);
        },
      },
      {
        title: language === 'zh' ? '基于此创建' : 'Create From',
        url: `#/create-from/${schema.name}`,
      },
      {
        title: language === 'zh' ? '创建项目' : 'Create Project',
        url: `#/project/new/${schema.name}`,
      },
      {
        title: language === 'zh' ? '删除' : 'Delete',
        url: `#/project/new/${schema.name}`,
      },
    ],
  }));

  if (loading) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center">
          {language === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center text-red-500">{error}</div>
      </SidebarGroup>
    );
  }

  if (items.length === 0) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center">
          {language === 'zh' ? '没有可用的模板' : 'No schemas available'}
        </div>
      </SidebarGroup>
    );
  }

  return (
    <div className="px-3">
      {items.map((item) => (
        <div key={item.title}>
          <SchemaCard
            schema={item.schema!}
            title={item.title}
            isHighlighted={highlightedSchema === item.schema?.name}
            language={language}
            starredItems={starredItems}
            openMenuId={openMenuId}
            editingDescription={editingDescription}
            descriptionText={descriptionText}
            menuItems={item.items || []}
            onCardClick={() =>
              highlightedSchema !== item.schema?.name &&
              item.schema &&
              flyToSchema(item.schema)
            }
            onStarToggle={toggleStar}
            onMenuOpenChange={(open) => {
              if (open) {
                setOpenMenuId(item.title);
              } else {
                setOpenMenuId(null);
              }
            }}
            onEditDescription={toggleEditDescription}
            onDescriptionChange={handleDescriptionChange}
            onSaveDescription={updateDescription}
          />
        </div>
      ))}
    </div>
  );
}
