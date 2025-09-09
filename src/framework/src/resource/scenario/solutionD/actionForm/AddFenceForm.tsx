import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shrimp, Paintbrush, RotateCcw, Trash2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { GeoJSON } from 'geojson';
import type { HumanAction } from '@/core/apis/types';
import store from '@/store'
import * as apis from '@/core/apis/apis'
import { toast } from "sonner";

type AddFenceAction = Extract<HumanAction, { action_type: 'add_fence' }>;

interface AddFenceFormProps {
  action?: AddFenceAction;
  nodeKey: string;
  editMode?: boolean;
  addMode?: boolean;
  onEdit?: () => void;
  onSubmit: () => void;
}

export default function AddFenceForm({ action, nodeKey, editMode = false, addMode = false, onEdit, onSubmit }: AddFenceFormProps) {
  const isEditable = editMode || addMode;
  const drawInstance = store.get<MapboxDraw>("mapDraw")
  const [actionParams, setActionParams] = useState({
    elevation_delta: '',
    landuse_type: ''
  });
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    if (!addMode && action) {
      setActionParams({
        elevation_delta: action.params.elevation_delta ? String(action.params.elevation_delta) : '',
        landuse_type: action.params.landuse_type ? String(action.params.landuse_type) : ''
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
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#3B82F6',
            'fill-opacity': 0.3,
            'fill-outline-color': '#1E40AF'
          }
        });
      }
    }

    return () => {
      if (map.getSource(sourceId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }
    }
  }, [editMode, action, drawInstance]);

  const handleInputChange = (field: string, value: string) => {
    setActionParams(prev => ({ ...prev, [field]: value }));
  };

  const handleStartDrawing = () => {
    drawInstance?.changeMode("draw_polygon")
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

  const handleApplyAction = async () => {
    if (nodeKey === '') return

    if (!actionParams.elevation_delta && !actionParams.landuse_type) {
      toast.error('Please fill in at least one field')
      return
    }

    const actionFeature = drawInstance?.getAll()

    if (actionFeature?.features.length === 0) {
      toast.error('Map drawing cannot be empty')
      return
    }

    const params: any = {
      feature: actionFeature
    };

    // 根据是否存在动态添加属性
    if (actionParams.elevation_delta !== '') {
      params.elevation_delta = Number(actionParams.elevation_delta);
    }

    if (actionParams.landuse_type !== '') {
      params.landuse_type = Number(actionParams.landuse_type);
    }
    
    const humanAction = {
      node_key: nodeKey,
      action_type: 'add_fence',
      params: params
    };

    store.get<{ on: Function, off: Function }>('isLoading')!.on()

    try {
      const registerResponse = await apis.solution.addHumanAction.fetch(humanAction, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetDrawing()
        toast.success('Human action registered successfully');
        onSubmit()
      } else {
        toast.error('Failed to register human action');
      }
    } catch (err) {
      toast.error('Operation failed');
      store.get<{ on: Function, off: Function }>('isLoading')!.off();
    }
  };

  const handleUpdateAction = async () => {
    if (nodeKey === '') return

    if (!actionParams.elevation_delta && !actionParams.landuse_type) {
      toast.error('Please fill in at least one field')
      return
    }

    const actionFeature = drawInstance?.getAll()

    if (actionFeature?.features.length === 0) {
      toast.error('Map drawing cannot be empty')
      return
    }

    store.get<{ on: Function, off: Function }>('isLoading')!.on()

    const updateParams: any = {
      feature: actionFeature
    };

    // 根据是否存在动态添加属性
    if (actionParams.elevation_delta !== '') {
      updateParams.elevation_delta = Number(actionParams.elevation_delta);
    }

    if (actionParams.landuse_type !== '') {
      updateParams.landuse_type = Number(actionParams.landuse_type);
    }

    try {
      const registerResponse = await apis.solution.updateHumanAction.fetch({
        node_key: nodeKey,
        action_id: action!.action_id,
        action_type: 'add_fence',
        params: updateParams
      }, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetDrawing()
        toast.success('Human action updated successfully');
        onSubmit()
      } else {
        toast.error('Failed to update human action');
      }
    } catch (err) {
      toast.error('Operation failed');
      store.get<{ on: Function, off: Function }>('isLoading')!.off();
    }
  };

  const handleCancelEdit = () => {
    handleResetDrawing()
    onSubmit()
  };

  const handleRemoveAction = async () => {
    if (nodeKey === '') return

    store.get<{ on: Function, off: Function }>('isLoading')!.on()
    try {
      const registerResponse = await apis.solution.deleteHumanAction.fetch({
        node_key: nodeKey,
        action_id: action!.action_id,
      }, false);
      store.get<{ on: Function, off: Function }>('isLoading')!.off();

      if (registerResponse.success) {
        handleResetDrawing()
        toast.success('Human action deleted successfully');
        onSubmit()
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
          <Shrimp className="w-4 h-4 text-green-500" />
          <h4 className="font-medium text-slate-500">
            {addMode ? 'New Human Action' : 'Add GeiWai'}
          </h4>
        </div>
        {/* 只在常规模式下显示编辑和删除按钮 */}
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
            <Badge>Add GeiWai</Badge>
          </div>
        )}

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Elevation Change (Optional)</Label>
          <Input
            type="text"
            value={actionParams.elevation_delta}
            onChange={(e) => handleInputChange('elevation_delta', e.target.value)}
            className="h-8 text-sm"
            placeholder="Enter a number"
            disabled={!isEditable}
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block text-slate-500">Land Use Type (Optional)</Label>
          <Input
            type="text"
            value={actionParams.landuse_type}
            onChange={(e) => handleInputChange('landuse_type', e.target.value)}
            className="h-8 text-sm"
            placeholder="Enter a number"
            disabled={!isEditable}
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block text-slate-500">
            {addMode ? 'Draw GeiWai' : 'Draw GeiWai'}
          </Label>
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
              onClick={!isDrawingMode ? handleStartDrawing : handleStopDrawing}
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

        {/* Bottom Buttons */}
        {isEditable && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            {addMode ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 cursor-pointer"
                  onClick={handleApplyAction}
                  disabled={!actionParams.elevation_delta && !actionParams.landuse_type}
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
                  disabled={!actionParams.elevation_delta && !actionParams.landuse_type}
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