import json
import c_two as cc
from pathlib import Path
from pydantic import BaseModel
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import APIRouter, HTTPException, Depends, status, Request

from ...compos import grid_comp
from ...core.config import settings
from ...schemas import grid
from ...core.server import start_server_subprocess, get_server_status

TEMPLATES_DIR = settings.TEMPLATES_DIR
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

router = APIRouter(prefix='/grid', tags=['grid'])

@router.get('/', response_class=HTMLResponse)
def grid_visualization(request: Request):
    """Grid visualization web interface"""
    
    status = get_server_status()
    grid_data = None
    
    if status == 'running' and Path(settings.SCHEMA_FILE).exists():
        try:
            with open(settings.SCHEMA_FILE, 'r') as f:
                grid_data = json.load(f)
        except Exception:
            grid_data = None
    
    return templates.TemplateResponse(
        'index.html', 
        {
            'request': request,
            'server_status': status,
            'grid_data': grid_data,
            'app_name': settings.APP_NAME
        }
    )
    
@router.get('/status', response_model=grid.BaseResponse)
def get_status():
    """Check the status of the grid server"""
    status = get_server_status()
    return grid.BaseResponse(
        success=True,
        message=f'Server is {status}',
        data={'status': status}
    )

# APIs for single grid schema ##################################################

@router.get('/schema/{name}', response_model=grid.ResponseWithGridSchema)
def get_schema(name: str):
    """Get a grid schema by name"""
    
    # Check if the schema file exists
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{name}.json')
    if not grid_schema_path.exists():
        raise HTTPException(status_code=404, detail='Schema not found')
    
    # Read the schema from the file
    try:
        with open(grid_schema_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to read schema: {str(e)}')
    
    # Convert the data to a GridSchema instance
    grid_schema = grid.GridSchema(**data)
    return grid.ResponseWithGridSchema(
        grid_schema=grid_schema
    )

@router.post('/schema', response_model=grid.BaseResponse)
def register_schema(data: grid.GridSchema):
    """Register a grid schema"""
    
    # Find if grid schema is existed
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{data.name}.json')
    if grid_schema_path.exists():
        return grid.BaseResponse(
            success=False,
            message='Grid schema already exists. Please use a different name.'
        )
        
    # Write the schema to a file
    try:
        with open(grid_schema_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return grid.BaseResponse(
            success=False,
            message=f'Failed to save schema: {str(e)}'
        )
    return grid.BaseResponse(
        success=True,
        message='Grid schema registered successfully'
    )

@router.delete('/schema/{name}', response_model=grid.BaseResponse)
def delete_schema(name: str):
    """Delete a grid schema by name"""
    
    # Check if the schema file exists
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{name}.json')
    if not grid_schema_path.exists():
        raise HTTPException(status_code=404, detail='Schema not found')
    
    # Delete the schema file
    try:
        grid_schema_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to delete schema: {str(e)}')
    
    return grid.BaseResponse(
        success=True,
        message='Grid schema deleted successfully'
    )

# APIs for multiple grid schemas ################################################

@router.get('/schemas', response_model=grid.ResponseWithGridSchemas)
def get_schemas(startIndex: int = 0, endIndex: int = None):
    """
    Get grid schemas within the specified range (startIndex inclusive, endIndex exclusive)
    If endIndex is not provided, returns all schemas starting from startIndex
    """
    try:
        schema_files = list(Path(settings.SCHEMA_DIR).glob('*.json'))
        
        if startIndex < 0:
            startIndex = 0
        if endIndex is None:
            endIndex = startIndex + 1
            
        schema_files = schema_files[startIndex:endIndex]
            
        schemas = []
        for file in schema_files:
            with open(file, 'r') as f:
                data = json.load(f)
                schemas.append(grid.GridSchema(**data))
                
        return grid.ResponseWithGridSchemas(
            grid_schemas=schemas
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to retrieve schemas: {str(e)}')

# APIs for project info ################################################

@router.get('/project-info/{name}', response_model=grid.ResponseWithProjectInfo)
def get_project_info(name: str):
    """Retrieve project information by name"""
    
    # Check if the project file exists
    project_file_path = Path(settings.PROJECT_DIR, f'{name}.json')
    if not project_file_path.exists():
        raise HTTPException(status_code=404, detail='Project not found')
    
    # Read the project info from the file
    try:
        with open(project_file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to read project info: {str(e)}')
    
    # Convert the data to a ProjectInfo instance
    project_info = grid.ProjectInfo(**data)
    return grid.ResponseWithProjectInfo(
        project_info=project_info
    )

@router.post('/project-info', response_model=grid.BaseResponse)
def register_project_info(data: grid.ProjectInfo):
    """Register project information"""
    
    # Find if project info is existed
    project_file_path = Path(settings.PROJECT_DIR, f'{data.name}.json')
    if project_file_path.exists():
        return grid.BaseResponse(
            success=False,
            message='Project info already exists. Please use a different name.'
        )
        
    # Write the project info to a file
    try:
        with open(project_file_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return grid.BaseResponse(
            success=False,
            message=f'Failed to save project info: {str(e)}'
        )
    
    return grid.BaseResponse(
        success=True,
        message='Project info registered successfully'
    )

@router.delete('/project-info/{name}', response_model=grid.BaseResponse)
def delete_project_info(name: str):
    """Delete project information by name"""
    
    # Check if the project file exists
    project_file_path = Path(settings.PROJECT_DIR, f'{name}.json')
    if not project_file_path.exists():
        raise HTTPException(status_code=404, detail='Project not found')
    
    # Delete the project file
    try:
        project_file_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to delete project info: {str(e)}')
    
    return grid.BaseResponse(
        success=True,
        message='Project info deleted successfully'
    )

# APIs for multiple project info ################################################

@router.get('/project-infos', response_model=grid.ResponseWithProjectInfos)
def get_project_infos(startIndex: int = 0, endIndex: int = None):
    """Retrieve project information with pagination"""

    project_files = list(Path(settings.PROJECT_DIR).glob('*.json'))

    if startIndex < 0:
        startIndex = 0
    if endIndex is None:
        endIndex = startIndex + 1
        
    project_files = project_files[startIndex:endIndex]
    
    project_infos = []
    for file in project_files:
        with open(file, 'r') as f:
            data = json.load(f)
            project_infos.append(grid.ProjectInfo(**data))
    
    return grid.ResponseWithProjectInfos(
        project_infos=project_infos
    )

# APIs for grid initializaion ################################################

@router.post('/init', response_model=grid.BaseResponse)
def initialize_grid(data: grid.GridSchema):
    """Initialize the grid server with the provided schema"""
    
    if get_server_status() == 'running':
        return grid.BaseResponse(
            success=False,
            message='Server already initialized. Please restart the API to reinitialize.',
        )
        
    try:
        with open(settings.SCHEMA_FILE, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return grid.BaseResponse(
            success=False,
            message=f'Failed to save schema: {str(e)}'
        )
    
    if start_server_subprocess():
        return grid.BaseResponse(
            success=True,
            message='Grid initialized and server started successfully',
            data={'schema': data.model_dump()}
        )
    else:
        return grid.BaseResponse(
            success=False,
            message='Failed to start grid server'
        )

class ActivateGridResponse(BaseModel):
    """Standard response schema for grid operations"""
    success: bool
    message: str
    infos: dict

@router.get('/activate-grid-info', response_model=ActivateGridResponse)
def activate_grid_info():
    with cc.compo.runtime.connect_crm(settings.TCP_ADDRESS):
        levels, global_ids = grid_comp.get_active_grid_render_infos()
        return ActivateGridResponse(
            success=True,
            message='Grid information retrieved successfully',
            infos={
                'levels': levels,
                'global_ids': global_ids
            }
        )       
        