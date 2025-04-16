from pathlib import Path
from pydantic import BaseModel, field_validator
from .schema import GridSchema
from ..core.config import settings

class ProjectMeta(BaseModel):
    """Information about the project"""
    name: str
    schema_name: str # name of grid schema the project is based on
    bounds: tuple[float, float, float, float] # [min_lon, min_lat, max_lon, max_lat] 
    
    @field_validator('bounds')
    def validate_bounds(cls, v):
        if len(v) != 4:
            raise ValueError('bounds must have exactly 4 values [min_lon, min_lat, max_lon, max_lat]')
        return v
    
    def get_path(self) -> str:
        """Get the path to the project directory"""
        project_path = Path(settings.PROJECT_DIR) / f'{self.name}'
        return str(project_path)
    
    def get_schema(self) -> GridSchema:
        """Get the grid schema associated with this project"""
        schema_path = Path(settings.SCHEMA_DIR) / f'{self.schema_name}.json'
        if not schema_path.exists():
            raise FileNotFoundError(f'Schema file {schema_path} does not exist')
        return GridSchema.parse_file(schema_path)

class ResponseWithProjectMeta(BaseModel):
    """Response schema for project meta info"""
    project_meta: ProjectMeta | None

    @field_validator('project_meta')
    def validate_project_meta(cls, v):
        if v is None:
            return v
        # Ensure that the project_meta is an instance of ProjectMeta
        if not isinstance(v, ProjectMeta):
            raise ValueError('project_meta must be an instance of ProjectMeta')
        return v

class ResponseWithProjectMetas(BaseModel):
    """Response schema for project meta info"""
    project_metas: list[ProjectMeta] | None

    @field_validator('project_metas')
    def validate_project_metas(cls, v):
        if v is None:
            return v
        # Ensure that the project_metas are instances of ProjectMeta
        if not all(isinstance(info, ProjectMeta) for info in v):
            raise ValueError('project_metas must be a list of ProjectMeta instances')
        return v
