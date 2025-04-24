import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/')))

import c_two as cc
import gridman.compos.grid_comp as compo
from mcp.server.fastmcp import FastMCP

mcp = FastMCP('Grid Agent Tools', instructions=cc.mcp.CC_INSTRUCTION)
cc.mcp.register_mcp_tools_from_compo_module(mcp, compo)


if __name__ == '__main__':
    mcp.run()
