import os
import sys
import math
import json
import argparse
import c_two as cc
from pathlib import Path

# Import Grid (CRM)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from crms.grid import Grid

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Grid Launcher')
    parser.add_argument('--temp', type=str, default='False', help='Use temporary memory for grid')
    parser.add_argument('--meta_path', type=str, required=True,  help='Path to the project meta info file')
    parser.add_argument('--schema_path', type=str, required=True, help='Path to the schema file')
    parser.add_argument('--tcp_address', type=str, required=True, help='TCP address for the server')
    parser.add_argument('--project_path', type=str, required=True, help='Path to the project directory')
    args = parser.parse_args()
    
    # Get info from schema file
    schema = json.load(open(args.schema_path, 'r'))
    epsg: int = schema['epsg']
    grid_info: list[list[float]] = schema['grid_info']
    first_size: list[float] = grid_info[0]
    
    # Get info from project meta file
    meta_path = Path(args.project_path, args.meta_path)
    meta = json.load(open(meta_path, 'r'))
    bounds: list[float] = meta['bounds']
    
    # Calculate subdivide rules
    subdivide_rules: list[list[int]] = [
        [
            int(math.ceil((bounds[2] - bounds[0]) / first_size[0])),
            int(math.ceil((bounds[3] - bounds[1]) / first_size[1])),
        ]
    ]
    for i in range(len(grid_info) - 1):
        level_a = grid_info[i]
        level_b = grid_info[i + 1]
        subdivide_rules.append(
            [
                int(level_a[0] / level_b[0]),
                int(level_a[1] / level_b[1]),
            ]
        )
    subdivide_rules.append([1, 1])
    
    # Set crm server address
    ipc_address = 'ipc:///tmp/grid' # default address based on IPC, only can be used in Linux / MacOS
    tcp_address = args.tcp_address
    
    # Init CRM
    crm = Grid(
        epsg, bounds, first_size, subdivide_rules, 
        str(Path(args.project_path, 'grids.arrow'))
    )
    
    # Run CRM server
    server = cc.message.Server(tcp_address, crm)
    server.start()
    print('CRM server started at', tcp_address)
    server.wait_for_termination()
