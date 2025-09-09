import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Waves, Paintbrush, Trash2, MapPin, Plus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { HumanAction } from '@/core/apis/types';
import store from '@/store'
import * as apis from '@/core/apis/apis'
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';

type TransferWaterAction = Extract<HumanAction, { action_type: 'transfer_water' }>;

interface TransferWaterFormProps {
	action?: TransferWaterAction;
	nodeKey: string;
	editMode?: boolean;
	addMode?: boolean;
	onEdit?: () => void;
	onSubmit: () => void;
}

export default function TransferWaterForm({ action, nodeKey, editMode = false, addMode = false, onEdit, onSubmit }: TransferWaterFormProps) {
	const isEditable = editMode || addMode;
	const [actionParams, setActionParams] = useState({
		from_longitude: '',
		from_latitude: '',
		to_longitude: '',
		to_latitude: '',
		q: ''
	});

	const fromMarker = useRef<mapboxgl.Marker | null>(null);
	const toMarker = useRef<mapboxgl.Marker | null>(null);

	useEffect(() => {
		if (!addMode && action) {
			setActionParams({
				from_longitude: String(action.params.from_grid[0]),
				from_latitude: String(action.params.from_grid[1]),
				to_longitude: String(action.params.to_grid[0]),
				to_latitude: String(action.params.to_grid[1]),
				q: String(action.params.q)
			});
		}
	}, [action, addMode]);

	useEffect(() => {
		const map = store.get<mapboxgl.Map>("map");
		if (!map || !action) return;

		if (editMode) {
			if (fromMarker.current) {
				fromMarker.current.remove();
				fromMarker.current = null;
			}
			if (toMarker.current) {
				toMarker.current.remove();
				toMarker.current = null;
			}
		} else {
			if (action.params.from_grid && action.params.from_grid.length === 2) {
				const marker = new mapboxgl.Marker({ color: '#22C55E' })
					.setLngLat([action.params.from_grid[0], action.params.from_grid[1]])
					.addTo(map);
				fromMarker.current = marker;
			}

			if (action.params.to_grid && action.params.to_grid.length === 2) {
				const marker = new mapboxgl.Marker({ color: '#F59E0B' })
					.setLngLat([action.params.to_grid[0], action.params.to_grid[1]])
					.addTo(map);
				toMarker.current = marker;
			}
		}

		return () => {
			if (fromMarker.current) {
				fromMarker.current.remove();
			}
			if (toMarker.current) {
				toMarker.current.remove();
			}
		};
	}, [editMode, action]);

	const [isPickingFromGrid, setIsPickingFromGrid] = useState(false);
	const [isPickingToGrid, setIsPickingToGrid] = useState(false);

	const handleInputChange = (field: string, value: string) => {
		setActionParams(prev => ({ ...prev, [field]: value }));
	};

	useEffect(() => {
		const map = store.get<mapboxgl.Map>("map");
		if (!map) return;

		const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
			const { lng, lat } = e.lngLat;

			if (isPickingFromGrid) {
				setActionParams(prev => ({
					...prev,
					from_longitude: lng.toString(),
					from_latitude: lat.toString()
				}));

				if (fromMarker.current) {
					fromMarker.current.remove();
				}
				const marker = new mapboxgl.Marker({ color: '#22C55E' })
					.setLngLat([lng, lat])
					.addTo(map);
				fromMarker.current = marker;

				setIsPickingFromGrid(false);
				toast.success('Start point selected');

			} else if (isPickingToGrid) {
				setActionParams(prev => ({
					...prev,
					to_longitude: lng.toString(),
					to_latitude: lat.toString()
				}));

				if (toMarker.current) {
					toMarker.current.remove();
				}
				const marker = new mapboxgl.Marker({ color: '#F59E0B' })
					.setLngLat([lng, lat])
					.addTo(map);
				toMarker.current = marker;

				setIsPickingToGrid(false);
				toast.success('End point selected');
			}
		};

		if (isPickingFromGrid || isPickingToGrid) {
			map.on('click', handleMapClick);
			map.getCanvas().style.cursor = 'crosshair';
		} else {
			map.getCanvas().style.cursor = '';
		}

		return () => {
			map.off('click', handleMapClick);
			map.getCanvas().style.cursor = '';
		};
	}, [isPickingFromGrid, isPickingToGrid]);

	useEffect(() => {
		const map = store.get<mapboxgl.Map>("map");
		if (!map || !isEditable) return;

		if (actionParams.from_longitude && actionParams.from_latitude) {
			const lng = Number(actionParams.from_longitude);
			const lat = Number(actionParams.from_latitude);

			if (!isNaN(lng) && !isNaN(lat)) {
				if (fromMarker.current) {
					fromMarker.current.setLngLat([lng, lat]);
				} else {
					const marker = new mapboxgl.Marker({ color: '#22C55E' })
						.setLngLat([lng, lat])
						.addTo(map);
					fromMarker.current = marker;
				}
			}
		} else if (fromMarker.current) {
			fromMarker.current.remove();
			fromMarker.current = null;
		}

		if (actionParams.to_longitude && actionParams.to_latitude) {
			const lng = Number(actionParams.to_longitude);
			const lat = Number(actionParams.to_latitude);

			if (!isNaN(lng) && !isNaN(lat)) {
				if (toMarker.current) {
					toMarker.current.setLngLat([lng, lat]);
				} else {
					const marker = new mapboxgl.Marker({ color: '#F59E0B' })
						.setLngLat([lng, lat])
						.addTo(map);
					toMarker.current = marker;
				}
			}
		} else if (toMarker.current) {
			toMarker.current.remove();
			toMarker.current = null;
		}
	}, [actionParams.from_longitude, actionParams.from_latitude, actionParams.to_longitude, actionParams.to_latitude, isEditable]);

	const handleFromGridPicking = () => {
		if (!isEditable) return;

		setIsPickingFromGrid(!isPickingFromGrid);
		setIsPickingToGrid(false);

		if (!isPickingFromGrid) {
			toast.info('Click on the map to select start point');
		} else {
			toast.info('Map selection cancelled');
		}
	};

	const handleToGridPicking = () => {
		if (!isEditable) return;

		setIsPickingToGrid(!isPickingToGrid);
		setIsPickingFromGrid(false);

		if (!isPickingToGrid) {
			toast.info('Click on the map to select end point');
		} else {
			toast.info('Map selection cancelled');
		}
	};

	const handleResetAction = () => {
		setIsPickingFromGrid(false);
		setIsPickingToGrid(false);

		if (fromMarker.current) {
			fromMarker.current.remove();
			fromMarker.current = null;
		}
		if (toMarker.current) {
			toMarker.current.remove();
			toMarker.current = null;
		}
	};

	const handleApplyAction = async () => {
		if (nodeKey === '') return;

		if (!actionParams.from_longitude || !actionParams.from_latitude ||
			!actionParams.to_longitude || !actionParams.to_latitude || !actionParams.q) {
			toast.error('Please fill in all required fields');
			return;
		}

		const humanAction = {
			node_key: nodeKey,
			action_type: 'transfer_water',
			params: {
				from_grid: [Number(actionParams.from_longitude), Number(actionParams.from_latitude)],
				to_grid: [Number(actionParams.to_longitude), Number(actionParams.to_latitude)],
				q: Number(actionParams.q)
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

		if (!actionParams.from_longitude || !actionParams.from_latitude ||
			!actionParams.to_longitude || !actionParams.to_latitude || !actionParams.q) {
			toast.error('Please fill in all required fields');
			return;
		}

		store.get<{ on: Function, off: Function }>('isLoading')!.on();

		try {
			const registerResponse = await apis.solution.updateHumanAction.fetch({
				node_key: nodeKey,
				action_id: action.action_id,
				action_type: 'transfer_water',
				params: {
					from_grid: [Number(actionParams.from_longitude), Number(actionParams.from_latitude)],
					to_grid: [Number(actionParams.to_longitude), Number(actionParams.to_latitude)],
					q: Number(actionParams.q)
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
					<Waves className="w-4 h-4 text-blue-500" />
					<h4 className="font-medium text-slate-500">
						{addMode ? 'New Human Action' : 'Transfer Water'}
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
						<Badge>Transfer Water</Badge>
					</div>
				)}

				<div>
					<Label className="text-sm mb-1 block text-slate-500">Start Point Coordinates</Label>
					<div className='flex items-center gap-2'>
						<div className="flex-1 flex gap-1">
							<Input
								type="text"
								value={actionParams.from_longitude}
								onChange={(e) => handleInputChange('from_longitude', e.target.value)}
								className="h-8 text-sm"
								placeholder="Longitude"
								disabled={!isEditable}
							/>
							<Input
								type="text"
								value={actionParams.from_latitude}
								onChange={(e) => handleInputChange('from_latitude', e.target.value)}
								className="h-8 text-sm"
								placeholder="Latitude"
								disabled={!isEditable}
							/>
						</div>
						<Button
							variant="outline"
							className={`h-8 w-8 text-sm ${!isEditable
									? 'cursor-not-allowed opacity-70'
									: `cursor-pointer ${isPickingFromGrid ? 'bg-blue-100 border-blue-500' : ''}`
								}`}
							onClick={!isEditable ? undefined : handleFromGridPicking}
							disabled={!isEditable}
						>
							<MapPin className={`w-4 h-4 ${isPickingFromGrid ? 'text-blue-500' : ''}`} />
						</Button>
					</div>
				</div>

				<div>
					<Label className="text-sm mb-1 block text-slate-500">End Point Coordinates</Label>
					<div className='flex items-center gap-2'>
						<div className="flex-1 flex gap-1">
							<Input
								type="text"
								value={actionParams.to_longitude}
								onChange={(e) => handleInputChange('to_longitude', e.target.value)}
								className="h-8 text-sm"
								placeholder="Longitude"
								disabled={!isEditable}
							/>
							<Input
								type="text"
								value={actionParams.to_latitude}
								onChange={(e) => handleInputChange('to_latitude', e.target.value)}
								className="h-8 text-sm"
								placeholder="Latitude"
								disabled={!isEditable}
							/>
						</div>
						<Button
							variant="outline"
							className={`h-8 w-8 text-sm ${!isEditable
									? 'cursor-not-allowed opacity-70'
									: `cursor-pointer ${isPickingToGrid ? 'bg-amber-100 border-amber-500' : ''}`
								}`}
							onClick={!isEditable ? undefined : handleToGridPicking}
							disabled={!isEditable}
						>
							<MapPin className={`w-4 h-4 ${isPickingToGrid ? 'text-amber-500' : ''}`} />
						</Button>
					</div>
				</div>

				<div>
					<Label className="text-sm mb-1 block text-slate-500">Water Volume</Label>
					<Input
						type="text"
						value={actionParams.q}
						onChange={(e) => handleInputChange('q', e.target.value)}
						className="h-8 text-sm"
						placeholder="Enter water volume"
						disabled={!isEditable}
					/>
				</div>

				{isEditable && (
					<div className="mt-6 pt-4 border-t border-slate-200">
						{addMode ? (
							<div className="flex gap-2">
								<Button
									className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 cursor-pointer"
									onClick={handleApplyAction}
									disabled={!actionParams.from_longitude || !actionParams.from_latitude ||
										!actionParams.to_longitude || !actionParams.to_latitude || !actionParams.q}
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