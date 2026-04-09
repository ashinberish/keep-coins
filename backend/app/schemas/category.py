import uuid
from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    emoji: str = "📁"
    description: str | None = None
    category_type: str = "expense"


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    emoji: str
    description: str | None
    category_type: str
    user_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
