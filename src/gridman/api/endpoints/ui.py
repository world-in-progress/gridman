import json
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ...core.config import settings
from ...core.server import get_server_status

TEMPLATES_DIR = settings.TEMPLATES_DIR
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

router = APIRouter(prefix='/ui', tags=['ui'])

@router.get('/', response_class=HTMLResponse)
def gridman_ui(request: Request):
    """
    Description
    --
    Web interface of GridMan.  
    It provides a user-friendly way to interact with the GridMan server.
    """
    
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
  