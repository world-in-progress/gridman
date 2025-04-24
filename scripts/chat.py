import os
import sys
import subprocess

def main():
    # Execute the command to run the MCP client with the grid_mcp_server.py script
    cmd = ["python", "src/gridman/core/mcp_client.py", "scripts/grid_mcp_server.py"]
    
    # Create a process using Popen and connect standard input, output, and error streams to the current process
    process = subprocess.Popen(
        cmd,
        stdin=sys.stdin,   
        stdout=sys.stdout, 
        stderr=sys.stderr, 
        text=True,
        bufsize=1          
    )
    
    # Wait for the process to complete
    return_code = process.wait()
    print(f"Process exited with code: {return_code}")

if __name__ == "__main__":
    main()