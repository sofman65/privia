from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    # Defaults keep app/test startup working even if .env isn't loaded
    secret_key: str = "dev-secret-change-later"
    allowed_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "sqlite:///./privia.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
