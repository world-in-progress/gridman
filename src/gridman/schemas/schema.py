import json
from pydantic import BaseModel, field_validator

class GridSchema(BaseModel):
    """Schema for grid init configuration"""
    name: str # name of the grid schema
    epsg: int # EPSG code for the grid
    starred: bool # whether the grid schema is starred
    description: str # description of the grid schema
    base_point: tuple[float, float] # [lon, lat], base point of the grid
    grid_info: list[tuple[float, float]] # [(width_in_meter, height_in_meter), ...], grid size in each level

    @field_validator('base_point')
    def validate_base_point(cls, v):
        if len(v) != 2:
            raise ValueError('base_point must have exactly 2 values [lon, lat]')
        return v
    
    @field_validator('grid_info')
    def validate_grid_info(cls, v):
        if not all(len(item) == 2 for item in v):
            raise ValueError('grid_info must contain tuples of exactly 2 values [width_in_meter, height_in_meter]')
        return v

    @staticmethod
    def parse_file(file_path: str) -> 'GridSchema':
        """Parse a grid schema from a JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return GridSchema(**data)
    
class ResponseWithGridSchema(BaseModel):
    """Response schema for grid operations with grid schema"""
    grid_schema: GridSchema | None

    @field_validator('grid_schema')
    def validate_schema(cls, v):
        if v is None:
            return v
        # Ensure that the schema is an instance of GridSchema
        if not isinstance(v, GridSchema):
            raise ValueError('schema must be an instance of GridSchema')
        return v

class ResponseWithGridSchemas(BaseModel):
    """Response schema for grid operations with grid schemas"""
    grid_schemas: list[GridSchema] | None

    @field_validator('grid_schemas')
    def validate_schemas(cls, v):
        if v is None:
            return v
        # Ensure that the schemas are instances of GridSchema
        if not all(isinstance(schema, GridSchema) for schema in v):
            raise ValueError('schemas must be a list of GridSchema instances')
        return v
 