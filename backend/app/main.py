import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.router import api_router


def create_app() -> FastAPI:
    setup_logging(settings.env)
    logger = logging.getLogger("app")

    app = FastAPI(
        title="Privia API",
        version="0.1.0",
        debug=settings.env == "development",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    logger.info("🚀 Privia API started")
    logger.info(
        "ENV=%s HOST=%s PORT=%s", settings.env, settings.api_host, settings.api_port
    )

    return app


app = create_app()
