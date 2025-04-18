import numpy as np
import c_two as cc
from fastapi import APIRouter, Response

from icrms.igrid import IGrid
from ...schemas import grid
from ...compos import grid_comp
from ...core.config import settings

# APIs for grid operations ################################################

router = APIRouter(prefix='/grid', tags=['grid'])

@router.get('/activate-info', response_class=Response, response_description='Returns active grid information in bytes. Formart: [4 bytes for length, followed by level bytes, followed by global id bytes]')
def activate_grid_infos():
    
    with cc.compo.runtime.connect_crm(settings.TCP_ADDRESS, IGrid) as grid_interface:
        levels, global_ids = grid_interface.get_active_grid_infos()
        
        level_bytes = np.array(levels, dtype=np.int8).tobytes()
        global_id_bytes = np.array(global_ids, dtype=np.int32).tobytes()
        
        level_length = len(level_bytes).to_bytes(4, byteorder='little')
        combined_data = level_length + level_bytes + global_id_bytes
        
        return Response(
            content=combined_data,
            media_type='application/octet-stream'
        )
        