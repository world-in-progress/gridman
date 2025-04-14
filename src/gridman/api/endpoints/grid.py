import json
import c_two as cc
from pathlib import Path
from pydantic import BaseModel
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import APIRouter, HTTPException, Depends, status, Request
from ...schemas.grid import GridSchema, BaseResponse
from ...core.server import start_server_subprocess, get_server_status
from ...core.config import settings
from ...compos import grid_comp

TEMPLATES_DIR = settings.TEMPLATES_DIR
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

router = APIRouter(prefix="/grid", tags=["grid"])

@router.get("/", response_class=HTMLResponse)
def grid_visualization(request: Request):
    """Grid visualization web interface"""
    
    status = get_server_status()
    grid_data = None
    
    if status == "running" and Path(settings.SCHEMA_FILE).exists():
        try:
            with open(settings.SCHEMA_FILE, "r") as f:
                grid_data = json.load(f)
        except Exception:
            grid_data = None
    
    return templates.TemplateResponse(
        "index.html", 
        {
            "request": request,
            "server_status": status,
            "grid_data": grid_data,
            "app_name": settings.APP_NAME
        }
    )
    
@router.get("/status", response_model=BaseResponse)
def get_status():
    """Check the status of the grid server"""
    status = get_server_status()
    return BaseResponse(
        success=True,
        message=f"Server is {status}",
        data={"status": status}
    )

@router.post("/init", response_model=BaseResponse)
def initialize_grid(data: GridSchema):
    """Initialize the grid server with the provided schema"""
    
    if get_server_status() == "running":
        return BaseResponse(
            success=False,
            message="Server already initialized. Please restart the API to reinitialize.",
        )
        
    try:
        with open(settings.SCHEMA_FILE, "w") as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return BaseResponse(
            success=False,
            message=f"Failed to save schema: {str(e)}"
        )
    
    if start_server_subprocess():
        return BaseResponse(
            success=True,
            message="Grid initialized and server started successfully",
            data={"schema": data.model_dump()}
        )
    else:
        return BaseResponse(
            success=False,
            message="Failed to start grid server"
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