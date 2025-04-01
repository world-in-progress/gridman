import uvicorn
from src.gridman.main import app

if __name__ == "__main__":
    uvicorn.run("src.gridman.main:app", host="0.0.0.0", port=8000, reload=True)