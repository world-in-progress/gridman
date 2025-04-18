import numpy as np
from pydantic import BaseModel, field_validator
from .base import BaseResponse

class MultiGridInfo(BaseModel):
    levels: list[int]
    global_ids: list[int]
    
    @field_validator('levels')
    def check_levels(cls, v):
        if len(v) == 0:
            raise ValueError('Levels cannot be empty')
        return v
    
    @field_validator('global_ids')
    def check_global_ids(cls, v):
        if len(v) == 0:
            raise ValueError('Global IDs cannot be empty')
        return v
    
    def to_bytes_dict(self):
        """Convert the grid information to a binary-efficient dictionary."""
        
        level_arr = np.array(self.levels, dtype=np.int8)
        global_id_arr = np.array(self.global_ids, dtype=np.int32)
        
        grid_num = len(self.levels)
        level_bytes = level_arr.tobytes()
        global_id_bytes = global_id_arr.tobytes()
        
        level_str = ''.join(chr(x) for x in level_bytes)
        global_id_str = ''.join(chr(x) for x in global_id_bytes)
        
        return {
            'grid_num': grid_num,
            'levels_bytes': level_str,
            'global_ids_bytes': global_id_str,
        }

class MultiGridInfoResponse(BaseResponse):
    """Standard response schema for grid operations"""
    infos: dict[str, str | int] # bytes representation of MultiGridInfo, { 'grid_num': num, 'levels': b'...', 'global_ids': b'...' }
    
    @field_validator('infos')
    def check_infos(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Infos must be a dictionary')
        return v
    