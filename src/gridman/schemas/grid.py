from pydantic import BaseModel, field_validator

class BaseResponse(BaseModel):
    """Standard response schema for grid operations"""
    success: bool
    message: str

class GridSchema(BaseModel):
    """Schema for grid init configuration"""
    name: str # name of the grid schema
    epsg: int # EPSG code for the grid
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
    
class ProjectInfo(BaseModel):
    """Information about the project"""
    name: str
    schema_name: str # name of grid schema the project is based on
    bounds: tuple[float, float, float, float] # [min_lon, min_lat, max_lon, max_lat] 
    
    @field_validator('bounds')
    def validate_bounds(cls, v):
        if len(v) != 4:
            raise ValueError('bounds must have exactly 4 values [min_lon, min_lat, max_lon, max_lat]')
        return v

class ResponseWithProjectInfo(BaseModel):
    """Response schema for project info"""
    project_info: ProjectInfo | None

    @field_validator('project_info')
    def validate_project_info(cls, v):
        if v is None:
            return v
        # Ensure that the project_info is an instance of ProjectInfo
        if not isinstance(v, ProjectInfo):
            raise ValueError('project_info must be an instance of ProjectInfo')
        return v

class ResponseWithProjectInfos(BaseModel):
    """Response schema for project info"""
    project_infos: list[ProjectInfo] | None

    @field_validator('project_infos')
    def validate_project_infos(cls, v):
        if v is None:
            return v
        # Ensure that the project_info is an instance of ProjectInfo
        if not all(isinstance(info, ProjectInfo) for info in v):
            raise ValueError('project_infos must be a list of ProjectInfo instances')
        return v