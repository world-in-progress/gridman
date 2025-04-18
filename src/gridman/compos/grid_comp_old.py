import io
import pyarrow as pa
import c_two as cc
import numpy as np
from osgeo import gdal, osr
from icrms.igrid import IGrid, GridAttribute

@cc.compo.runtime.connect
def get_active_grid_render_infos(crm: IGrid) -> bytes:
    # Get active grid information
    schema = crm.get_schema()
    levels, global_ids = crm.get_active_grid_infos()
    
    levels_arr = np.array(levels, dtype=np.int8)
    global_ids_arr = np.array(global_ids, dtype=np.int32)
    
    levels_bytes = levels_arr.tobytes()
    global_ids_bytes = global_ids_arr.tobytes()
    
    return levels_bytes, global_ids_bytes

    levels_arr = np.asarray(levels, dtype=np.int8)
    global_ids_arr = np.asarray(global_ids, dtype=np.int32)
    
    # Get active grid attributes
    grids: list[GridAttribute] = []
    for level in np.unique(levels_arr):
        mask = (levels_arr == level)
        peer_global_ids = global_ids_arr[mask].tolist()
        grids.extend(crm.get_grid_infos(int(level), peer_global_ids))

    grid_count = len(grids)
    levels_arr = np.empty(grid_count, dtype=np.int8)
    global_ids_arr = np.empty(grid_count, dtype=np.int32)
    all_coords = np.empty((grid_count, 4, 2), dtype=np.float64)  # [grid_idx, corner_idx, coord]
    for idx, grid in enumerate(grids):
        levels_arr[idx] = grid.level
        global_ids_arr[idx] = grid.global_id
        all_coords[idx] = [
            [grid.min_x, grid.max_y], # TL
            [grid.max_x, grid.max_y], # TR
            [grid.min_x, grid.min_y], # BL
            [grid.max_x, grid.min_y]  # BR
        ]
    
    # Transfer coordinates to WGS84
    if schema.epsg != 4326:
        transformer = CoordinateTransformer2D(schema.epsg, 4326)
        coords_flat = all_coords.reshape(-1, 2)
        transformed_flat = transformer.transform_points(coords_flat)
        all_coords = transformed_flat.reshape(grid_count, 4, 2)
    
    vertices_arr = np.empty(grid_count * 8, dtype=np.float64)
    for corner in range(4):
        x_indices = slice(grid_count * corner * 2, grid_count * (corner + 1) * 2, 2)
        y_indices = slice(grid_count * corner * 2 + 1, grid_count * (corner + 1) * 2, 2)
        vertices_arr[x_indices] = all_coords[:, corner, 0]
        vertices_arr[y_indices] = all_coords[:, corner, 1]

    # Create and serialize the table
    table = pa.Table.from_arrays(
        [
            pa.array(levels_arr),
            pa.array(global_ids_arr),
            pa.array(vertices_arr)
        ],
        ['levels', 'global_ids', 'vertices']
    )

    # Serialize to bytes
    sink = pa.BufferOutputStream()
    with pa.RecordBatchFileWriter(sink, table.schema) as writer:
        writer.write_table(table)
    return sink.getvalue().to_pybytes()
    
# Helpers ##################################################

class CoordinateTransformer2D:
    def __init__(self, source_epsg: int, target_epsg: int):
        source_srs = osr.SpatialReference()
        target_srs = osr.SpatialReference()
        
        source_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        target_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        
        source_srs.ImportFromEPSG(source_epsg)
        target_srs.ImportFromEPSG(target_epsg)
        
        self.transform = osr.CoordinateTransformation(source_srs, target_srs)
        self.source_epsg = source_epsg
        self.target_epsg = target_epsg
    
    def transform_point(self, x: float, y: float) -> tuple[float, float]:
        return self.transform.TransferPoint(x, y)[:2]
    
    def transform_points(self, coords: list[tuple[float, float]] | np.ndarray) -> np.ndarray:
        coords_array = np.asarray(coords, dtype=np.float64)
        
        n_points = coords_array.shape[0]
        if coords_array.shape[1] == 2:
            points_3d = np.column_stack((coords_array, np.zeros(n_points, dtype=np.float64)))
            transformed_points = np.array(self.transform.TransformPoints(points_3d))
            return transformed_points[:, :2]
        else:
            raise ValueError(f'Invalid coordinate shape: {coords_array.shape}')
        
    def transform_bounds(self, min_x: float, min_y: float, max_x: float, max_y: float) -> tuple[float, float, float, float]:
        corners = np.array([
            [min_x, min_y],
            [min_x, max_y],
            [max_x, max_y],
            [max_x, min_y]
        ])
        transformed = self.transform_points(corners)
        
        new_min_x = np.min(transformed[:, 0])
        new_min_y = np.min(transformed[:, 1])
        new_max_x = np.max(transformed[:, 0])
        new_max_y = np.max(transformed[:, 1])
        return new_min_x, new_min_y, new_max_x, new_max_y
    