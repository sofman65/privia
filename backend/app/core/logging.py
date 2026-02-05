import logging
import sys


def setup_logging(env: str) -> None:
    level = logging.DEBUG if env == "development" else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
