import json
import argparse
import c_two as cc

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from crms.grid import Grid

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="CRM Launcher")
    parser.add_argument('--temp', type=str, default=False, help="Use temporary memory for grid")
    parser.add_argument('--schema_path', type=str, required=True, help="Path to the schema file")
    parser.add_argument('--tcp_address', type=str, required=True, help="TCP address for the server")
    parser.add_argument('--grid_file_path', type=str, required=True, help="Path to the grid file")
    args = parser.parse_args()

    # Grid parameters
    schema = json.load(open(args.schema_path, 'r'))
    epsg = schema['epsg']
    first_size = schema['first_size']
    bounds = schema['bounds']
    subdivide_rules = schema['subdivide_rules']
    ipc_address = 'ipc:///tmp/zmq_test'
    tcp_address = args.tcp_address
    temp = args.temp == 'True'
    grid_file_path = None if temp else args.grid_file_path
    
    # Init CRM
    crm = Grid(epsg, bounds, first_size, subdivide_rules, grid_file_path)

    # if sys.platform == 'win32':
    #     try:
    #         from ctypes import windll
    #         kernel32 = windll.kernel32
    #         kernel32.SetConsoleCtrlHandler(None, False)
    #     except:
    #         pass
    
    # Run CRM server
    server = cc.message.Server(tcp_address, crm)
    server.run()
