from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request

from ...schemas import clever
from ...core.mcp_client import MCPClient

# APIs for grid operations ################################################

router = APIRouter(prefix='/clever-grid', tags=['clever-grid'])

def get_agent(request: Request) -> MCPClient:
    return request.app.state.agent_client

@router.post('/chat', response_model=clever.BaseChatResponse)
async def chat(query: clever.BaseChat, agent: MCPClient = Depends(get_agent)):
        try:
            res = await agent.process_query(query.query, '')
            return clever.BaseChatResponse(
                response=res
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/chat/stream")
async def chat_stream(request: clever.BaseChat, agent: MCPClient = Depends(get_agent)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Empty query not allowed")
    
    try:
        async def generate_response():
            async for text in agent.process_query_stream(request.query):
                yield text

        return StreamingResponse(
            generate_response(),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
        