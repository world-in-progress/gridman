import json
import c_two as cc
from fastapi import APIRouter

from ...schemas import grid
from ...compos import grid_comp
from ...core.config import settings

# APIs for grid operations ################################################

router = APIRouter(prefix='/grid', tags=['grid'])

@router.get('/activate-info', response_model=grid.ActivateGridResponse)
def activate_grid_info():
    with cc.compo.runtime.connect_crm(settings.TCP_ADDRESS):
        levels, global_ids = grid_comp.get_active_grid_render_infos()
        return grid.ActivateGridResponse(
            success=True,
            message='Grid information retrieved successfully',
            infos={
                'levels': levels,
                'global_ids': global_ids
            }
        )       
        