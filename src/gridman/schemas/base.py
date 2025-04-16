from pydantic import BaseModel, field_validator

class BaseResponse(BaseModel):
    """Standard response schema for grid operations"""
    success: bool
    message: str
    
class NumberResponse(BaseModel):
    """Standard response schema for a number"""
    number: int | float | None

    @field_validator('number')
    def validate_number(cls, v):
        if v is None:
            return v
        # Ensure that the number is either an int or a float
        if not isinstance(v, (int, float)):
            raise ValueError('number must be an int or a float')
        return v
