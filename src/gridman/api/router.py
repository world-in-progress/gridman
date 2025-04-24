from fastapi import APIRouter
from .endpoints import ui, schema, schemas, project_meta, project_metas, project, grid, clever_grid

api_router = APIRouter()

api_router.include_router(ui.router)
api_router.include_router(grid.router)
api_router.include_router(schema.router)
api_router.include_router(schemas.router)
api_router.include_router(project.router)
api_router.include_router(clever_grid.router)
api_router.include_router(project_meta.router)
api_router.include_router(project_metas.router)
