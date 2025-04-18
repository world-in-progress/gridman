import c_two as cc
import numpy as np
from icrms.igrid import IGrid

@cc.compo.runtime.connect
def get_active_grid_infos(crm: IGrid) -> tuple[list[int], list[int]]:
    """Method to get all active grids' global ids and levels"""
    return crm.get_active_grid_infos()
    