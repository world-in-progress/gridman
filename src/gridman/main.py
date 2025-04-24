from pathlib import Path
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.router import api_router
from .core.server import shutdown_server_subprocess, init_working_directory
from .core.mcp_client import MCPClient

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_working_directory()
    
    # Initialize the MCP server from MCP client
    agent_client = MCPClient()
    app.state.agent_client = agent_client
    await agent_client.connect_to_server(settings.MCP_SERVER_SCRIPT_PATH)
    
    yield
    
    shutdown_server_subprocess()
    await agent_client.cleanup()

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="Grid Management API for spatial data processing",
        version="0.1.0",
        lifespan=lifespan,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_CREDENTIALS,
        allow_methods=settings.CORS_METHODS,
        allow_headers=settings.CORS_HEADERS,
    )
    
    # Set up static files and templates
    templates_dir = Path(settings.TEMPLATES_DIR)
    if templates_dir.exists() and templates_dir.is_dir():
        for subfolder in templates_dir.iterdir():
            if subfolder.is_dir():
                mount_point = f'/{subfolder.name}'
                try:
                    app.mount(
                        mount_point,
                        StaticFiles(directory=subfolder),
                        name=subfolder.name
                    )
                except Exception as e:
                    print(f'Skipping {mount_point} due to error: {e}')

    # Add API routers
    app.include_router(api_router)
        
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)