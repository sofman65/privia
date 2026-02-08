# Privia Backend

The FastAPI backend for **Privia** — a privacy-first AI chat workspace for teams.

Synchronous SQLite + SQLAlchemy, JWT authentication, Alembic migrations, and a pluggable ChatEngine abstraction that separates the API layer from any inference backend.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 (sync) |
| Language | Python 3.12, type-annotated |
| ORM | SQLAlchemy 2.0 (mapped columns) |
| Migrations | Alembic 1.16 |
| Database | SQLite (FK enforcement via PRAGMA) |
| Auth | JWT (python-jose), PBKDF2 password hashing |
| Validation | Pydantic 2.12 + pydantic-settings |
| API docs | Scalar (OpenAPI) |
| Containerization | Docker (Python 3.12-slim) |

---

## Project structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app factory, CORS, startup
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py               # Central API router (/api prefix)
│   │   └── routes/
│   │       ├── auth.py             # /login, /signup, /me
│   │       ├── chat.py             # /query, /stream, /ws/chat
│   │       ├── conversations.py    # CRUD: list, get, update, delete
│   │       ├── health.py           # /health
│   │       └── scalar.py           # /scalar (API docs UI)
│   ├── core/
│   │   ├── config.py               # pydantic-settings (env vars)
│   │   ├── database.py             # Engine, SessionLocal, Base
│   │   ├── deps.py                 # FastAPI dependencies (get_db, get_current_user)
│   │   ├── logging.py              # Structured logging setup
│   │   └── security.py             # JWT encode/decode, password hashing
│   ├── engine/
│   │   ├── __init__.py             # get_engine() factory
│   │   ├── base.py                 # Abstract ChatEngine interface
│   │   ├── stub.py                 # StubChatEngine (no-model fallback)
│   │   ├── context.py              # ChatContext, HistoryMessage
│   │   └── response.py             # ChatResponse dataclass
│   ├── models/
│   │   ├── __init__.py             # Re-exports User, Conversation, Message
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   └── schemas/
│       ├── __init__.py             # Re-exports all Pydantic schemas
│       ├── auth.py                 # LoginResponse, SignupRequest, UserProfile
│       ├── conversation.py         # ConversationOut, ConversationListItem, etc.
│       └── query.py                # QueryRequest, QueryResponse
├── alembic/
│   ├── env.py                      # Migration environment (imports all models)
│   ├── script.py.mako
│   └── versions/
│       └── 2e6c151298f6_initial.py # Initial schema
├── tests/
│   ├── conftest.py                 # TestClient fixture
│   ├── test_auth_me.py
│   └── test_health.py
├── alembic.ini
├── requirements.txt                # Pinned dependencies
├── Dockerfile
├── .env.example
└── README.md
```

---

## API endpoints

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login with email/password (form data) |
| `POST` | `/api/auth/signup` | Public | Register a new account |
| `GET` | `/api/auth/me` | Bearer | Return current user profile |

### Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/query` | Bearer | Send a question, get a complete answer |
| `POST` | `/api/stream` | Bearer | Send a question, receive SSE token stream |
| `WS` | `/api/ws/chat` | Cookie | WebSocket streaming chat |

### Conversations

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/conversations` | Bearer | List all conversations for current user |
| `GET` | `/api/conversations/{id}` | Bearer | Get conversation with messages |
| `PATCH` | `/api/conversations/{id}` | Bearer | Update conversation (e.g. title) |
| `DELETE` | `/api/conversations/{id}` | Bearer | Delete conversation and messages |

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check (status, version, uptime) |
| `GET` | `/scalar` | Public | Interactive API documentation |

---

## Database schema

```
users
├── id            VARCHAR  PK  (UUID)
├── email         VARCHAR  UNIQUE, INDEXED
├── full_name     VARCHAR  NULLABLE
├── password_hash VARCHAR
└── role          VARCHAR  DEFAULT 'member'

conversations
├── id            VARCHAR  PK  (UUID)
├── user_id       VARCHAR  FK → users.id
├── title         VARCHAR
├── created_at    DATETIME
└── updated_at    DATETIME

messages
├── id              VARCHAR   PK  (UUID)
├── conversation_id VARCHAR   FK → conversations.id  ON DELETE CASCADE
├── role            VARCHAR   ('user' | 'assistant' | 'system')
├── content         VARCHAR
└── timestamp       DATETIME
```

Foreign keys are enforced at the SQLite level via `PRAGMA foreign_keys=ON`.

---

## ChatEngine abstraction

The API layer never calls a model directly. All inference goes through the `ChatEngine` interface:

```python
class ChatEngine(ABC):
    def answer(self, query: str, context: ChatContext) -> ChatResponse: ...
    def stream(self, query: str, context: ChatContext) -> Iterator[str]: ...
    def last_response(self) -> ChatResponse: ...
```

**`ChatContext`** carries the user ID, conversation ID, recent history, and optional parameters (model, temperature, top_k).

**`ChatResponse`** carries the answer content, sources, mode, confidence, and model name.

The default `StubChatEngine` returns a message explaining that no LLM pipeline is connected. To plug in a real backend:

1. Create a new class (e.g. `OllamaEngine`) that extends `ChatEngine`
2. Update the factory in `app/engine/__init__.py` to return your implementation

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `ENV` | `development` | Runtime mode (`development` or `production`) |
| `SECRET_KEY` | `dev-secret-change-later` | JWT signing secret. **Change in production.** |
| `DATABASE_URL` | `sqlite:///./privia.db` | SQLAlchemy database URL |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins (comma-separated) |
| `API_HOST` | `0.0.0.0` | Uvicorn bind address |
| `API_PORT` | `8000` | Uvicorn bind port |

Copy `.env.example` to `.env` and adjust for your deployment.

---

## Getting started

### Prerequisites

- Python 3.12+
- pip

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Run migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at [http://localhost:8000](http://localhost:8000). Interactive docs at [http://localhost:8000/scalar](http://localhost:8000/scalar).

### Tests

```bash
pytest -v
```

### Docker

```bash
docker build -t privia-backend .

docker run -p 8000:8000 \
  -e SECRET_KEY=your-production-secret \
  -e ALLOWED_ORIGINS=https://privia.app \
  -v privia-data:/app/data \
  privia-backend
```

The container runs Alembic migrations on startup, then starts Uvicorn as a non-root user. SQLite data is stored in `/app/data/` (mount a volume for persistence).

---

## Architecture decisions

| Decision | Rationale |
|---|---|
| **Sync SQLite** | SQLite does not benefit from async drivers. Sync SQLAlchemy avoids unnecessary complexity for a single-file database. |
| **ChatEngine interface** | Decouples the API from any specific model/provider. Swap implementations without touching routes. |
| **StubChatEngine as default** | Communicates system readiness, not a fake answer. Every field of `ChatResponse` is populated end-to-end. |
| **PBKDF2 password hashing** | Standard library (`hashlib`), no external dependency. 100k iterations with random salt. |
| **JWT in Authorization header** | Stateless auth. Token also read from `auth-token` cookie for WebSocket compatibility. |
| **Alembic for migrations** | Even with SQLite, schema changes should be versioned and repeatable. |
| **Pydantic schemas separated from models** | SQLAlchemy models define storage; Pydantic schemas define the API contract. They evolve independently. |
| **Route groups** | Auth, chat, conversations, health, and docs each get their own router module for isolation. |

---

## Dependencies (key)

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.0 | ASGI framework |
| `uvicorn` | 0.38.0 | ASGI server |
| `sqlalchemy` | 2.0.35 | ORM |
| `alembic` | 1.16.1 | Schema migrations |
| `pydantic` | 2.12.3 | Data validation |
| `pydantic-settings` | 2.5.2 | Environment config |
| `python-jose` | 3.5.0 | JWT encoding/decoding |
| `httpx` | 0.27.0 | HTTP client (testing, future integrations) |
| `scalar-fastapi` | 1.0.3 | API documentation UI |

Full dependency list in `requirements.txt`.
