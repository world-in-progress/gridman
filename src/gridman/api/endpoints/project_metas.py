import json
from pathlib import Path
from fastapi import APIRouter

from ...schemas import base
from ...schemas import project
from ...core.config import settings

# APIs for multiple project meta ################################################

router = APIRouter(prefix='/project-metas', tags=['project-metas'])

@router.get('/', response_model=project.ResponseWithProjectMetas)
def get_project_infos(startIndex: int = 0, endIndex: int = None):
    """Retrieve project information with pagination"""
    
    project_dirs = list(Path(settings.PROJECT_DIR).glob('*'))
    project_files = [ project_dir / 'meta.json' for project_dir in project_dirs if project_dir.is_dir() ]

    if startIndex < 0:
        startIndex = 0
    if endIndex is None:
        endIndex = startIndex + 1 if startIndex + 1 < len(project_files) else startIndex + 1
        
    project_files = project_files[startIndex:endIndex]
    
    project_infos = []
    for file in project_files:
        with open(file, 'r') as f:
            data = json.load(f)
            project_infos.append(project.ProjectMeta(**data))
    
    return project.ResponseWithProjectMetas(
        project_metas=project_infos
    )

@router.get('/num', response_model=base.NumberResponse)
def get_project_meta_num():
    """Retrieve the number of project meta files"""
    
    project_dirs = list(Path(settings.PROJECT_DIR).glob('*'))
    num = len(project_dirs)
    return base.NumberResponse(
        number=num
    )
