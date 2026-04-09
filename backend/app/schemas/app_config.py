from pydantic import BaseModel


class AppConfigResponse(BaseModel):
    id: int
    key: str
    value: str
    description: str | None = None

    model_config = {"from_attributes": True}


class AppConfigUpdate(BaseModel):
    value: str
