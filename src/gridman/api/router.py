from fastapi import APIRouter
from .endpoints import grid

api_router = APIRouter()

api_router.include_router(grid.router)