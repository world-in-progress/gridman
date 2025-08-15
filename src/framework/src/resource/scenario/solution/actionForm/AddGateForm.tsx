import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DoorOpen, Paintbrush, Trash2, MapPin, Plus, X, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { GeoJSON } from 'geojson';
import type { HumanAction } from '@/core/apis/types';
import store from '@/store'
import * as apis from '@/core/apis/apis'
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

type AddGateAction = Extract<HumanAction, { action_type: 'add_gate' }>;

interface AddGateFormProps {
  action?: AddGateAction;
  nodeKey: string;
  editMode?: boolean;
  addMode?: boolean;
  onEdit?: () => void;
  onSubmit: () => void;
}

export default function AddGateForm({ action, editMode = false, nodeKey, addMode = false, onEdit, onSubmit }: AddGateFormProps) {
  const isEditable = editMode || addMode;
  const drawInstance = store.get<MapboxDraw>("mapDraw")

  const [actionParams, setActionParams] = useState({
    up_longitude: '',
    up_latitude: '',
    down_longitude: '',
    down_latitude: '',
    height: ''
  });

  const upstreamMarker = useRef<mapboxgl.Marker | null>(null);
  const downstreamMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!addMode && action) {
      setActionParams({
        up_longitude: String(action.params.up_stream[0]),
        up_latitude: String(action.params.up_stream[1]),
        down_longitude: String(action.params.down_stream[0]),
        down_latitude: String(action.params.down_stream[1]),
        height: String(action.params.gate_height)
      });
    }
  }, [action, addMode]);

  useEffect(() => {
    const map = store.get<mapboxgl.Map>("map");
    if (!map || !action) return;

    const sourceId = `action-${action.action_id}`;
    const layerId = `action-layer-${action.action_id}`;

    if (editMode) {
      if (map.getSource(sourceId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }

      if (upstreamMarker.current) {
        upstreamMarker.current.remove();
        upstreamMarker.current = null;
      }
      if (downstreamMarker.current) {
        downstreamMarker.current.remove();
        downstreamMarker.current = null;
      }

      if (action.params.feature && drawInstance) {
        drawInstance.deleteAll();
        drawInstance.add(action.params.feature as GeoJSON);
      }
    } else {
      if (action.params.feature && !map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: action.params.feature as GeoJSON
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#F59E0B',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
      }

      if (action.params.up_stream && action.params.up_stream.length === 2) {
        const marker = new mapboxgl.Marker({ color: '#22C55E' })
          .setLngLat([action.params.up_stream[0], action.params.up_stream[1]])
          .addTo(map);
        upstreamMarker.current = marker;
      }

      if (action.params.down_stream && action.params.down_stream.length === 2) {
        const marker = new mapboxgl.Marker({ color: '#EF4444' })
          .setLngLat([action.params.down_stream[0], action.params.down_stream[1]])
          .addTo(map);
        downstreamMarker.current = marker;
      }
    }

    return () => {
      if (map.getSource(sourceId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }
      if (upstreamMarker.current) {
        upstreamMarker.current.remove();
      }
      if (downstreamMarker.current) {
        downstreamMarker.current.remove();
      }
    };
  }, [editMode, action, drawInstance]);

  const [isPickingUpstream, setIsPickingUpstream] = useState(false);
  const [isPickingDownstream, setIsPickingDownstream] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setActionParams(prev => ({ ...prev, [field]: value }));
  };
  
  useEffect(() => {
    const map = store.get<mapboxgl.Map>("map");
    if (!map) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;

      if (isPickingUpstream) {
        setActionParams(prev => ({
          ...prev,
          up_longitude: lng.toString(),
          up_latitude: lat.toString()
        }));

        if (upstreamMarker.current) {
          upstreamMarker.current.remove();
        }
        const marker = new mapboxgl.Marker({ color: '#22C55E' })
          .setLngLat([lng, lat])
          .addTo(map);
        upstreamMarker.current = marker;

        setIsPickingUpstream(false);
        toast.success('Upstream point selected');

      } else if (isPickingDownstream) {
        setActionParams(prev => ({
          ...prev,
          down_longitude: lng.toString(),
          down_latitude: lat.toString()
        }));

        if (downstreamMarker.current) {
          downstreamMarker.current.remove();
        }
        const marker = new mapboxgl.Marker({ color: '#EF4444' })
          .setLngLat([lng, lat])
          .addTo(map);
        downstreamMarker.current = marker;

        setIsPickingDownstream(false);
        toast.success('Downstream point selected');
      }
    };

    if (isPickingUpstream || isPickingDownstream) {
      map.on('click', handleMapClick);
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.getCanvas().style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [isPickingUpstream, isPickingDownstream]);

  useEffect(() => {
    const map = store.get<mapboxgl.Map>("map");
    if (!map || !isEditable) return;

    if (actionParams.up_longitude && actionParams.up_latitude) {
      const lng = Number(actionParams.up_longitude);
      const lat = Number(actionParams.up_latitude);

      if (!isNaN(lng) && !isNaN(lat)) {
        if (upstreamMarker.current) {
          upstreamMarker.current.setLngLat([lng, lat]);
        } else {
          const marker = new mapboxgl.Marker({ color: '#22C55E' })
            .setLngLat([lng, lat])
            .addTo(map);
          upstreamMarker.current = marker;
        }
      }
    } else if (upstreamMarker.current) {
      upstreamMarker.current.remove();
      upstreamMarker.current = null;
    }

    if (actionParams.down_longitude && actionParams.down_latitude) {
      const lng = Number(actionParams.down_longitude);
      const lat = Number(actionParams.down_latitude);

      if (!isNaN(lng) && !isNaN(lat)) {
        if (downstreamMarker.current) {
          downstreamMarker.current.setLngLat([lng, lat]);
        } else {
          const marker = new mapboxgl.Marker({ color: '#EF4444' })
            .setLngLat([lng, lat])
            .addTo(map);
          downstreamMarker.current = marker;
        }
      }
    } else if (downstreamMarker.current) {
      downstreamMarker.current.remove();
      downstreamMarker.current = null;
    }
  }, [actionParams.up_longitude, actionParams.up_latitude, actionParams.down_longitude, actionParams.down_latitude, isEditable]);

  const handleUpstreamPicking = () => {
    if (!isEditable) return;

    setIsPickingUpstream(!isPickingUpstream);
    setIsPickingDownstream(false);

    if (!isPickingUpstream) {
      toast.info('Click on the map to select upstream point');
    } else {
      toast.info('Map selection cancelled');
    }
  };

  const handleDownstreamPicking = () => {
    if (!isEditable) return;

    setIsPickingDownstream(!isPickingDownstream);
    setIsPickingUpstream(false);

    if (!isPickingDownstream) {
      toast.info('Click on the map to select downstream point');
    } else {
      toast.info('Map selection cancelled');
    }
  };

  const handleStartDrawing = () => {
    drawInstance?.changeMode("draw_line_string")
    setIsDrawingMode(true);
  };

  const handleStopDrawing = () => {
    setIsDrawingMode(false);
    drawInstance?.changeMode("simple_select")
  };

  const handleResetDrawing = () => {
    setIsDrawingMode(false);
    drawInstance?.changeMode("simple_select")
    drawInstance?.deleteAll()
  };

  const handleResetAction = () => {
    setIsPickingUpstream(false);
    setIsPickingDownstream(false);
    setIsDrawingMode(false);

    if (upstreamMarker.current) {
      upstreamMarker.current.remove();
      upstreamMarker.current = null;
    }
    if (downstreamMarker.current) {
      downstreamMarker.current.remove();
      downstreamMarker.current = null;
    }

    drawInstance?.changeMode("simple_select")
    drawInstance?.deleteAll()
  };

  const handleApplyAction = async () => {
    if (nodeKey === '') return;

    if (!actionParams.up_longitude || !actionParams.up_latitude ||
      !actionParams.down_longitude || !actionParams.down_latitude || !actionParams.height) {
      toast.error('Please fill in all required fields');
      return;
    }

    const actionFeature = drawInstance?.getAll();

    if (!actionFeature?.features || actionFeature.features.length === 0) {
      toast.error('Please draw the gate line');
      return;
    }

    const humanAction = {
      node_key: nodeKey,
      action_type: 'add_gate',
      params: {
        up_stream: [Number(actionParams.up_longitude), Number(actionParams.up_latitude)],
        down_stream: [Number(actionParams.down_longitude), Number(actionParams.down_latitude)],
        gate_height: Number(actionParams.height),
        feature: actionFeature
      }
    };

    store.get<{ on: Function, off: Function }>('isLoading')!.on();

    try {
      const registerResponse = await apis.solution.addHumanAction.fetch(humanAction, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetAction();
        toast.success('Human action registered successfully');
        onSubmit();
      } else {
        toast.error('Failed to register human action');
      }
    } catch (err) {
      toast.error('Operation failed');
      store.get<{ on: Function, off: Function }>('isLoading')!.off();
    }
  };

  const handleUpdateAction = async () => {
    if (nodeKey === '' || !action) return;

    if (!actionParams.up_longitude || !actionParams.up_latitude ||
      !actionParams.down_longitude || !actionParams.down_latitude || !actionParams.height) {
      toast.error('Please fill in all required fields');
      return;
    }

    const actionFeature = drawInstance?.getAll();

    if (!actionFeature?.features || actionFeature.features.length === 0) {
      toast.error('Please draw the gate line');
      return;
    }

    store.get<{ on: Function, off: Function }>('isLoading')!.on();

    try {
      const registerResponse = await apis.solution.updateHumanAction.fetch({
        node_key: nodeKey,
        action_id: action.action_id,
        action_type: 'add_gate',
        params: {
          up_stream: [Number(actionParams.up_longitude), Number(actionParams.up_latitude)],
          down_stream: [Number(actionParams.down_longitude), Number(actionParams.down_latitude)],
          gate_height: Number(actionParams.height),
          feature: actionFeature
        }
      }, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetAction();
        toast.success('Human action updated successfully');
        onSubmit();
      } else {
        toast.error('Failed to update human action');
      }
    } catch (err) {
      toast.error('Operation failed');
      store.get<{ on: Function, off: Function }>('isLoading')!.off();
    }
  };

  const handleCancelEdit = () => {
    handleResetAction();
    onSubmit();
  };

  const handleRemoveAction = async () => {
    if (nodeKey === '' || !action) return;

    store.get<{ on: Function, off: Function }>('isLoading')!.on();
    try {
      const registerResponse = await apis.solution.deleteHumanAction.fetch({
        node_key: nodeKey,
        action_id: action.action_id,
      }, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetAction();
        toast.success('Human action deleted successfully');
        onSubmit();
      } else {
        toast.error('Failed to delete human action');
      }
    } catch (err) {
      toast.error('Operation failed');
      store.get<{ on: Function, off: Function }>('isLoading')!.off();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-amber-500" />
          <h4 className="font-medium text-slate-500">
            {addMode ? 'New Human Action' : 'Add Gate'}
          </h4>
        </div>
        {!editMode && !addMode && (
          <div className='flex items-center gap-2'>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer" onClick={onEdit}>
              <Paintbrush className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer" onClick={handleRemoveAction}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {addMode && (
          <div>
            <Label className="text-sm mb-1 block text-slate-500">Action Type</Label>
            <Badge>Add Gate</Badge>
          </div>
        )}

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Upstream Coordinates</Label>
          <div className='flex items-center gap-2'>
            <div className="flex-1 flex gap-1">
              <Input
                type="text"
                value={actionParams.up_longitude}
                onChange={(e) => handleInputChange('up_longitude', e.target.value)}
                className="h-8 text-sm"
                placeholder="Longitude"
                disabled={!isEditable}
              />
              <Input
                type="text"
                value={actionParams.up_latitude}
                onChange={(e) => handleInputChange('up_latitude', e.target.value)}
                className="h-8 text-sm"
                placeholder="Latitude"
                disabled={!isEditable}
              />
            </div>
            <Button
              variant="outline"
              className={`h-8 w-8 text-sm ${!isEditable
                  ? 'cursor-not-allowed opacity-70'
                  : `cursor-pointer ${isPickingUpstream ? 'bg-blue-100 border-blue-500' : ''}`
                }`}
              onClick={!isEditable ? undefined : handleUpstreamPicking}
              disabled={!isEditable}
            >
              <MapPin className={`w-4 h-4 ${isPickingUpstream ? 'text-blue-500' : ''}`} />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Downstream Coordinates</Label>
          <div className='flex items-center gap-2'>
            <div className="flex-1 flex gap-1">
              <Input
                type="text"
                value={actionParams.down_longitude}
                onChange={(e) => handleInputChange('down_longitude', e.target.value)}
                className="h-8 text-sm"
                placeholder="Longitude"
                disabled={!isEditable}
              />
              <Input
                type="text"
                value={actionParams.down_latitude}
                onChange={(e) => handleInputChange('down_latitude', e.target.value)}
                className="h-8 text-sm"
                placeholder="Latitude"
                disabled={!isEditable}
              />
            </div>
            <Button
              variant="outline"
              className={`h-8 w-8 text-sm ${!isEditable
                  ? 'cursor-not-allowed opacity-70'
                  : `cursor-pointer ${isPickingDownstream ? 'bg-amber-100 border-amber-500' : ''}`
                }`}
              onClick={!isEditable ? undefined : handleDownstreamPicking}
              disabled={!isEditable}
            >
              <MapPin className={`w-4 h-4 ${isPickingDownstream ? 'text-amber-500' : ''}`} />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Height</Label>
          <Input
            type="text"
            value={actionParams.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            className="h-8 text-sm"
            placeholder="Enter height"
            disabled={!isEditable}
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Draw Gate</Label>
          <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
            <Button
              variant="secondary"
              size="sm"
              className={`cursor-pointer flex-1 min-w-0 ${!isEditable
                  ? 'bg-sky-500 text-white cursor-not-allowed opacity-70'
                  : !isDrawingMode
                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              onClick={!isEditable ? undefined : (!isDrawingMode ? handleStartDrawing : handleStopDrawing)}
              disabled={!isEditable}
            >
              <span className="hidden sm:inline">
                {isDrawingMode ? <X className="w-3 h-3 mr-1" /> : <Paintbrush className="w-3 h-3 mr-1" />}
              </span>
              <span className="truncate">
                {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 min-w-0 text-red-500 hover:text-red-600 hover:bg-red-50 ${!isEditable ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              onClick={!isEditable ? undefined : handleResetDrawing}
              disabled={!isEditable}
            >
              <span className="hidden sm:inline"><RotateCcw className="w-3 h-3 mr-1" /></span>
              <span className="truncate">Reset Drawing</span>
            </Button>
          </div>
        </div>

        {isEditable && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            {addMode ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 cursor-pointer"
                  onClick={handleApplyAction}
                  disabled={!actionParams.up_longitude || !actionParams.up_latitude ||
                    !actionParams.down_longitude || !actionParams.down_latitude || !actionParams.height}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-700 font-medium py-2 cursor-pointer"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 cursor-pointer"
                  onClick={handleUpdateAction}
                >
                  Update This Action
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-700 font-medium py-2 cursor-pointer"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}