import json
from pathlib import Path
from fastapi import APIRouter

from ...schemas import base
from ...schemas import project
from ...core.config import settings

# APIs for multiple project meta ################################################

router = APIRouter(prefix='/project-metas', tags=['project-metas'])

@router.get('/', response_model=project.ResponseWithProjectMetas)
def get_project_metas(startIndex: int = 0, endIndex: int = None):
    """
    Description
    --
    Get project metas within the specified range (startIndex inclusive, endIndex exclusive).  
    If endIndex is not provided, returns all project metas starting from startIndex.  
    
    Order
    --
    The order of project meta infos is based on the starred status and then alphabetically by name.
    """
    
    project_dirs = list(Path(settings.PROJECT_DIR).glob('*'))
    project_files = [ project_dir / 'meta.json' for project_dir in project_dirs if project_dir.is_dir() ]

    if startIndex < 0:
        startIndex = 0
    if endIndex is None:
        endIndex = startIndex + 1 if startIndex + 1 < len(project_files) else startIndex + 1
        
    project_files = project_files[startIndex:endIndex]
    
    project_metas = []
    for file in project_files:
        with open(file, 'r') as f:
            data = json.load(f)
            project_metas.append(project.ProjectMeta(**data))
    
    # Sort project metas: first by starred (True first), then alphabetically by name within each group
    project_metas.sort(key=lambda meta: (not meta.starred, meta.name.lower()))
    
    return project.ResponseWithProjectMetas(
        project_metas=project_metas
    )

@router.get('/num', response_model=base.NumberResponse)
def get_project_meta_num():
    """
    Description
    --
    Retrieve the number of project meta files.
    """
    
    project_dirs = list(Path(settings.PROJECT_DIR).glob('*'))
    num = len(project_dirs)
    return base.NumberResponse(
        number=num
    )
