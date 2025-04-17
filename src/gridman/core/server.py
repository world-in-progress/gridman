import os
import sys
import zmq
import time
import signal
import subprocess
from pathlib import Path
from .config import settings
from ..schemas.project import ProjectMeta

project_name: str | None = None
server_process: subprocess.Popen | None = None

def shutdown_crm_server() -> bool:
    """Shutdown the CRM server gracefully"""
    global server_process
    if server_process:
        if sys.platform != 'win32':
            # Unix-specific: terminate the process group
            try:
                os.killpg(os.getpgid(server_process.pid), signal.SIGINT)
            except (AttributeError, ProcessLookupError):
                server_process.terminate()
        else:
            # Windows-specific: send Ctrl+C signal and then terminate
            try:
                server_process.send_signal(signal.CTRL_C_EVENT)
            except (AttributeError, ProcessLookupError):
                server_process.terminate()
        
        try:
            server_process.wait(timeout=60)
            
        except subprocess.TimeoutExpired:
            if sys.platform != 'win32':
                try:
                    os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
                except (AttributeError, ProcessLookupError):
                    server_process.kill()
            else:
                server_process.kill()
        
        server_process = None
        return True

def init_working_directory():
    """Ensure the working directory structure exists for the server"""
    resource_dir = os.path.join(os.getcwd(), 'resource')
    grid_dir = os.path.join(resource_dir, 'grid')

    os.makedirs(grid_dir, exist_ok=True)
    os.makedirs(resource_dir, exist_ok=True)
    os.makedirs(settings.SCHEMA_DIR, exist_ok=True)
    os.makedirs(settings.PROJECT_DIR, exist_ok=True)

def set_current_project(project_meta: ProjectMeta):
    
    global project_name
    # Check if current project is the same as the new one
    # If not, shut down current crm server
    if project_name == project_meta.name:
        return
    else:
        project_name = project_meta.name
        shutdown_crm_server()

    # Check if schema is valid
    schema_path = Path(settings.SCHEMA_DIR) / f'{project_meta.schema_name}.json'
    if not schema_path.exists():
        raise FileNotFoundError(f'Schema file {schema_path} does not exist')
    
    # Start crm server process for this project
    global server_process
    
    # Platform-specific subprocess arguments
    kwargs = {}
    if sys.platform != 'win32':
        # Unix-specific: create new process group
        kwargs['preexec_fn'] = os.setsid
    else:
        # Windows-specific: don't open a new console window
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    
    server_process = subprocess.Popen(
        [
            sys.executable, settings.CRM_LAUNCHER_FILE,
            '--temp', settings.GRID_TEMP,
            '--meta_path', 'meta.json', # Always use meta.json
            '--schema_path', schema_path,
            '--tcp_address', settings.TCP_ADDRESS,
            '--project_path', project_meta.get_path()
        ],
        **kwargs
    )
    return server_process is not None
    
def start_server_subprocess():
    """Launch CRM server subprocess"""
    global server_process
    
    if not os.path.exists(settings.SCHEMA_FILE):
        return
    
    # Platform-specific subprocess arguments
    kwargs = {}
    if sys.platform != 'win32':
        # Unix-specific: create new process group
        kwargs['preexec_fn'] = os.setsid
    else:
        # Windows-specific: don't open a new console window
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    
    server_process = subprocess.Popen(
        [
            sys.executable, settings.CRM_LAUNCHER_FILE,
            '--temp', settings.GRID_TEMP,
            '--schema_path', settings.SCHEMA_FILE,
            '--tcp_address', settings.TCP_ADDRESS,
            '--grid_file_path', settings.GRID_FILE_NAME,
        ],
        **kwargs
    )
    return server_process is not None

def shutdown_server_subprocess():
    """Shutdown CRM server subprocess"""
    
    global server_process
    if server_process:
        if sys.platform != 'win32':
            # Unix-specific: terminate the process group
            try:
                os.killpg(os.getpgid(server_process.pid), signal.SIGINT)
            except (AttributeError, ProcessLookupError):
                server_process.terminate()
        else:
            # Windows-specific: send Ctrl+C signal and then terminate
            try:
                server_process.send_signal(signal.CTRL_C_EVENT)
            except (AttributeError, ProcessLookupError):
                server_process.terminate()
        
        try:
            server_process.wait(timeout=60)
            
        except subprocess.TimeoutExpired:
            if sys.platform != 'win32':
                try:
                    os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
                except (AttributeError, ProcessLookupError):
                    server_process.kill()
            else:
                server_process.kill()
        
        server_process = None
        return True
    return False

def get_server_status():
    global server_process
    if server_process:
        try:
            os.kill(server_process.pid, 0)
            return 'running'
        except OSError:
            server_process = None
            return 'stopped'
    return 'not_started'
