from pydantic import BaseModel, field_validator
from .base import BaseResponse

class ActivateGridResponse(BaseResponse):
    """Standard response schema for grid operations"""
    infos: dict