import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from ...core.config import settings
from ...schemas.base import BaseResponse
from ...schemas.project import ProjectMeta
from ...core.server import set_current_project

# APIs for project ################################################

router = APIRouter(prefix='/project', tags=['project'])

@router.get('/{name}', response_model=BaseResponse)
def set_project(name: str):
    """Set a specific project as the current project"""

    project_file_path = Path(settings.PROJECT_DIR, f'{name}.json')
    if not project_file_path.exists():
        raise HTTPException(status_code=404, detail='Project not found')

    try:
        with open(project_file_path, 'r') as f:
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
    """Delete a project by name"""
    
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