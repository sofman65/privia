import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    # Defaults keep app/test startup working even if .env isn't loaded
    secret_key: str = "dev-secret-change-later"
    # Keep this as string so env parsing never fails in PaaS dashboards.
    # Supports:
    #   - comma-separated: "https://a.com,https://b.com"
    #   - JSON array: '["https://a.com","https://b.com"]'
    allowed_origins: str = "http://localhost:3000"
    database_url: str = "sqlite:///./privia.db"

    @property
    def allowed_origins_list(self) -> list[str]:
        raw = (self.allowed_origins or "").strip()
        if not raw:
            return []

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                return [str(origin).strip() for origin in parsed if str(origin).strip()]

        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
