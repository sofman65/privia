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
    # Optional regex for origin matching (e.g. https://.*\.vercel\.app)
    allowed_origin_regex: str | None = None
    database_url: str = "sqlite:///./privia.db"

    @property
    def allowed_origins_list(self) -> list[str]:
        def normalize(origin: str) -> str:
            cleaned = origin.strip()
            if cleaned.endswith("/"):
                cleaned = cleaned.rstrip("/")
            return cleaned

        raw = (self.allowed_origins or "").strip()
        if not raw:
            return []

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                return [normalize(str(origin)) for origin in parsed if normalize(str(origin))]

        return [normalize(origin) for origin in raw.split(",") if normalize(origin)]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
