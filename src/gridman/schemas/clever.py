from pydantic import BaseModel, field_validator

class BaseChat(BaseModel):
    query: str

class BaseChatResponse(BaseModel):
    response: str