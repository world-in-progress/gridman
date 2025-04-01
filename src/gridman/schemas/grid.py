from pydantic import BaseModel, field_validator
import os
import json

class GridSchema(BaseModel):
    """Schema for grid init configuration"""
    epsg: int
    first_size: list[float]
    bounds: list[float]
    subdivide_rules: list[list[int]]

    @field_validator('bounds')
    def validate_bounds(cls, v):
        if len(v) != 4:
            raise ValueError('bounds must have exactly 4 values [min_x, min_y, max_x, max_y]')
        return v
    
    @field_validator('first_size')
    def validate_first_size(cls, v):
        if len(v) != 2:
            raise ValueError('first_size must have exactly 2 values [width, height]')
        return v

class BaseResponse(BaseModel):
    """Standard response schema for grid operations"""
    success: bool
    message: str