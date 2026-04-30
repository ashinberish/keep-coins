from pydantic import BaseModel


class AppConfigResponse(BaseModel):
    id: int
    key: str
    value: str
    description: str | None = None

    model_config = {"from_attributes": True}


class AppConfigUpdate(BaseModel):
    value: str


class PublicConfigResponse(BaseModel):
    signup_enabled: bool
    sidebar_button: "SidebarButtonConfig | None" = None


class SidebarButtonConfig(BaseModel):
    enabled: bool
    label: str
    url: str
    variant: str
