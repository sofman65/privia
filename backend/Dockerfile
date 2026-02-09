# -------------------------------------------------------------------
# Privia backend – production image
# -------------------------------------------------------------------

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# -------------------------------------------------------------------
# Dependencies
# -------------------------------------------------------------------
FROM base AS deps

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -------------------------------------------------------------------
# Application
# -------------------------------------------------------------------
FROM deps AS runner

COPY alembic.ini .
COPY alembic/ alembic/
COPY app/ app/

# Create a non-root user.
# Use uid/gid 1000 for better compatibility with mounted volumes on PaaS platforms.
RUN addgroup --system --gid 1000 appgroup && \
    adduser --system --uid 1000 --ingroup appgroup appuser

# Writable directory for SQLite (when DATABASE_URL points here)
RUN mkdir -p /app/data && chown appuser:appgroup /app/data

USER appuser

EXPOSE 8000

ENV PORT=8000 \
    ENV=production \
    DATABASE_URL=sqlite:////app/data/privia.db

# Run migrations then start uvicorn
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
