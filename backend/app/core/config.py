from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173"
    MODE: str = "production"

    # Resend settings
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "KeepCoins <noreply@keepcoins.online>"
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10

    # Security alert settings
    ALERT_EMAIL: str = ""  # email to receive security alerts

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()  # type: ignore[call-arg]
