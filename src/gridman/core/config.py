import os
from pathlib import Path
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).parent.parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = 'Gridman'
    DEBUG: bool = True
    TCP_ADDRESS: str = 'tcp://localhost:5555'
    GRID_TEMP: str = 'True'
    GRID_FILE: str = 'resource/grid/grids.arrow'
    SCHEMA_FILE: str = 'resource/grid/schema.json'
    SCHEMA_DIR: str = 'resource/grid/schemas/'
    PROJECT_DIR: str = 'resource/grid/projects/'
    CRM_LAUNCHER_FILE: str = 'scripts/grid_crm_launcher.py'
    TEMPLATES_DIR: str = str(ROOT_DIR / 'templates/')

    # CORS
    CORS_ORIGINS: list[str] = ['*']
    CORS_HEADERS: list[str] = ['*']
    CORS_METHODS: list[str] = ['*']
    CORS_CREDENTIALS: bool = True

    class Config:
        env_file = '.env'

settings = Settings()
