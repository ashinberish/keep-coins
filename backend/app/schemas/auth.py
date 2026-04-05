import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

# --- Request schemas ---


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Response schemas ---


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    currency: str = "USD"
    default_payment_method_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateCurrencyRequest(BaseModel):
    currency: str


class UpdateDefaultPaymentMethodRequest(BaseModel):
    default_payment_method_id: uuid.UUID | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
