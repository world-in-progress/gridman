import json
import c_two as cc
from pathlib import Path
from fastapi import APIRouter, HTTPException

from ...core.config import settings
from ...schemas.base import BaseResponse
from ...schemas.project import ProjectMeta, ProjectStatus
from ...core.server import set_current_project

# APIs for project ################################################

router = APIRouter(prefix='/project', tags=['project'])

@router.get('/', response_model=ProjectStatus)
def check_project_ready():
    """
    Description
    --
    Check if the project is ready.
    """
    
    try:
        flag = cc.message.Client.ping(settings.TCP_ADDRESS)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to check CRM of the project: {str(e)}')
    
    return ProjectStatus(
        status='ACTIVATED' if flag else 'DEACTIVATED',
        is_ready=flag
    )

@router.get('/{name}', response_model=BaseResponse)
def set_project(name: str):
    """
    Description
    --
    Set a specific project as the current project.
    """
    
    # Check if the project directory exists
    project_dir = Path(settings.PROJECT_DIR, f'{name}')
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail='Project not found')

    try:
        meta_path = Path(project_dir, 'meta.json')
        with open(meta_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to read project meta: {str(e)}')
    
    project_meta = ProjectMeta(**data)
    try:
        set_current_project(project_meta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to set project: {str(e)}')
    return BaseResponse(
        success=True,
        message='Project set successfully',
        data={'project_meta': project_meta}
    )

@router.delete('/{name}', response_model=BaseResponse)
def delete_project(name: str):
    """
    Description
    --
    Delete a project by name.
    """
    
    # Check if the project directory exists
    project_dir = Path(settings.PROJECT_DIR, f'{name}')
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail='Project not found')
    
    # Delete the project directory
    try:
        for item in project_dir.iterdir():
            item.unlink()
        project_dir.rmdir()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to delete project: {str(e)}')
    
    return BaseResponse(
        success=True,
        message='Project deleted successfully'
    )