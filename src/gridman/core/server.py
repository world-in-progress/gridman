import os
import signal
import subprocess
from .config import settings

server_process = None

def init_working_directory():
    """Ensure the working directory structure exists for the server"""
    resource_dir = os.path.join(os.getcwd(), 'resource')
    grid_dir = os.path.join(resource_dir, 'grid')

    os.makedirs(resource_dir, exist_ok=True)
    os.makedirs(grid_dir, exist_ok=True)

def start_server_subprocess():
    """Launch CRM server subprocess"""
    global server_process
    
    if not os.path.exists(settings.SCHEMA_FILE):
        return
    
    server_process = subprocess.Popen(
        [
            'python', settings.CRM_LAUNCHER_FILE,
            '--debug', 'True',
            '--schema_path', settings.SCHEMA_FILE,
            '--tcp_address', settings.TCP_ADDRESS,
            '--grid_file_path', settings.GRID_FILE,
        ],
        preexec_fn=os.setsid
    )
    return server_process is not None

def shutdown_server_subprocess():
    """Shutdown CRM server subprocess"""
    global server_process
    if server_process:
        os.killpg(os.getpgid(server_process.pid), signal.SIGINT)
        
        try:
            server_process.wait(timeout=60)
        except subprocess.TimeoutExpired:
            os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
        
        server_process = None
        return True
    return False

def get_server_status():
    global server_process
    if server_process:
        try:
            os.kill(server_process.pid, 0)
            return "running"
        except OSError:
            server_process = None
            return "stopped"
    return "not_started"