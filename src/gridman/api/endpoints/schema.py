import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from ...core.config import settings
from ...schemas.base import BaseResponse
from ...schemas.schema import GridSchema, ResponseWithGridSchema

# APIs for single grid schema ##################################################

router = APIRouter(prefix='/schema', tags=['schema'])

@router.get('/{name}', response_model=ResponseWithGridSchema)
def get_schema(name: str):
    """
    Description
    --
    Get a grid schema by name.
    """
    
    # Check if the schema file exists
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{name}.json')
    if not grid_schema_path.exists():
        raise HTTPException(status_code=404, detail='Schema not found')
    
    # Read the schema from the file
    try:
        with open(grid_schema_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to read schema: {str(e)}')
    
    # Convert the data to a GridSchema instance
    grid_schema = GridSchema(**data)
    return ResponseWithGridSchema(
        grid_schema=grid_schema
    )

@router.post('/', response_model=BaseResponse)
def register_schema(data: GridSchema):
    """
    Description
    --
    Register a grid schema.
    """
    
    # Find if grid schema is existed
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{data.name}.json')
    if grid_schema_path.exists():
        return BaseResponse(
            success=False,
            message='Grid schema already exists. Please use a different name.'
        )
        
    # Write the schema to a file
    try:
        with open(grid_schema_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        return BaseResponse(
            success=False,
            message=f'Failed to save schema: {str(e)}'
        )
    return BaseResponse(
        success=True,
        message='Grid schema registered successfully'
    )

@router.put('/{name}', response_model=BaseResponse)
def update_schema(name: str, data: GridSchema):
    """
    Description
    --
    Update a grid schema by name.
    """
    
    # Check if the schema file exists
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{name}.json')
    if not grid_schema_path.exists():
        raise HTTPException(status_code=404, detail='Schema not found')
    
    # Write the updated schema to the file
    try:
        with open(grid_schema_path, 'w') as f:
            f.write(data.model_dump_json(indent=4))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to update schema: {str(e)}')
    
    return BaseResponse(
        success=True,
        message='Grid schema updated successfully'
    )

@router.delete('/{name}', response_model=BaseResponse)
def delete_schema(name: str):
    """
    Description
    --
    Delete a grid schema by name.
    """
    
    # Check if the schema file exists
    grid_schema_path = Path(settings.SCHEMA_DIR, f'{name}.json')
    if not grid_schema_path.exists():
        raise HTTPException(status_code=404, detail='Schema not found')
    
    # Delete the schema file
    try:
        grid_schema_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to delete schema: {str(e)}')
    
    return BaseResponse(
        success=True,
        message='Grid schema deleted successfully'
    )
        