import uuid
from datetime import datetime

from pydantic import BaseModel


class PaymentMethodCreate(BaseModel):
    name: str
    icon: str = "💳"


class PaymentMethodResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}
