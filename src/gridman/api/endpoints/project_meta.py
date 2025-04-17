import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from ...core.config import settings
from ...schemas import project, base

# APIs for project meta ################################################

router = APIRouter(prefix='/project-meta', tags=['project-meta'])

@router.get('/{name}', response_model=project.ResponseWithProjectMeta)
def get_project_meta(name: str):
    """
    Description
    --
    Retrieve project meta information by name.
    """
    
    # Check if the project file exists
    project_path = Path(settings.PROJECT_DIR, f'{name}')
    if not project_path.exists():
        raise HTTPException(status_code=404, detail='Project not found')
    
    # Read the project info from the file
    info_path = project_path / f'meta.json'
    try:
        with open(info_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to read project info: {str(e)}')
    
    # Convert the data to a ProjectInfo instance
    project_info = project.ProjectMeta(**data)
    return project.ResponseWithProjectMeta(
        project_meta=project_info
    )

@router.post('/', response_model=base.BaseResponse)
def register_project_meta(data: project.ProjectMeta):
    """
    Description
    --
    Register project meta information.
    """
    
    # Find if project already exists
    project_dir = Path(settings.PROJECT_DIR, f'{data.name}')
    if project_dir.exists():
        return base.BaseResponse(
            success=False,
            message='Project already exists. Please use a different name.'
        )
    
    # Create the project directory if it doesn't exist
    project_dir.mkdir(parents=True, exist_ok=True)
        
    # Write the project info to a file
    info_path = project_dir / f'meta.json'
    try:
        with open(info_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return base.BaseResponse(
            success=False,
            message=f'Failed to save project info: {str(e)}'
        )
    
    return base.BaseResponse(
        success=True,
        message='Project meta info registered successfully'
    )   
    
@router.put('/{name}', response_model=base.BaseResponse)
def update_project_meta(name: str, data: project.ProjectMeta):
    """
    Description
    --
    Update project meta information by name.
    """
    
    # Check if the project file exists
    project_path = Path(settings.PROJECT_DIR, f'{name}')
    if not project_path.exists():
        raise HTTPException(status_code=404, detail='Project not found')
    
    # Write the updated project meta info to a file
    info_path = project_path / f'meta.json'
    try:
        with open(info_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to update project info: {str(e)}')
    
    return base.BaseResponse(
        success=True,
        message='Project meta info updated successfully'
    )  
        