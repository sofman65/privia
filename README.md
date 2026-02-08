# Privia

A privacy-first AI chat workspace for teams. Built with FastAPI, Next.js, SQLite, and a pluggable inference engine.

---

## Repository layout

```
privia/
├── backend/          # FastAPI REST + WebSocket API
│   ├── app/          # Application code (routes, models, engine, schemas)
│   ├── alembic/      # Database migrations
│   ├── tests/        # pytest suite
│   ├── Dockerfile
│   └── README.md     # Backend-specific docs
├── frontend/         # Next.js 16 App Router
│   ├── app/          # Route groups: (marketing), (auth), (app)
│   ├── components/   # Chat, marketing, UI primitives
│   ├── hooks/        # SSE, WebSocket, conversation state
│   ├── Dockerfile.frontend
│   └── README.md     # Frontend-specific docs
└── README.md         # This file
```

See `backend/README.md` and `frontend/README.md` for detailed architecture, API reference, and design decisions.

---

## Tech stack

| Component | Technology |
|---|---|
| Backend API | FastAPI 0.115, Python 3.12, SQLAlchemy 2.0, Alembic |
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Database | SQLite (FK-enforced, Alembic-managed) |
| Auth | JWT (PBKDF2 hashing, Bearer + cookie) |
| Chat engine | Pluggable `ChatEngine` interface (stub by default) |
| Real-time | SSE + WebSocket (dual transport) |
| UI components | shadcn/ui (New York) + Aceternity navbar |
| Theming | next-themes (dark-first, system-aware, oklch tokens) |
| Containerization | Docker (multi-stage builds, non-root) |

---

## Quick start (full stack)

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm 9+

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment config
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/scalar`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend is now running at `http://localhost:3000`.

---

## Testing the full flow

### Step 1 — Verify both servers are running

Backend health check:

```bash
curl http://localhost:8000/api/health
```

Expected:

```json
{"status": "ok", "version": "0.1.0", "env": "development", "uptime": ..., "timestamp": "..."}
```

Frontend: open `http://localhost:3000` in a browser. You should see the marketing landing page.

### Step 2 — Create an account

**Option A: Browser**

Click "Request access" on the landing page, fill in the signup form, then log in.

**Option B: curl**

```bash
# Sign up
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@privia.app", "password": "test1234", "full_name": "Test User"}'

# Log in (returns a JWT)
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=test@privia.app&password=test1234"
```

Save the `access_token` from the login response.

### Step 3 — Verify auth

```bash
TOKEN="<paste access_token here>"

curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected: your user profile with `id`, `email`, `full_name`, `role`.

### Step 4 — Send a chat message

```bash
# REST (complete answer)
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Privia?"}'

# SSE stream
curl -X POST http://localhost:8000/api/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Privia?"}' \
  --no-buffer
```

Both will return the stub engine message explaining that no LLM pipeline is connected. This is intentional — it proves the full request/response chain works end-to-end.

### Step 5 — Conversation CRUD

```bash
# List conversations (should include the one created by /query)
curl http://localhost:8000/api/conversations \
  -H "Authorization: Bearer $TOKEN"

# Get a specific conversation (use an id from the list)
curl http://localhost:8000/api/conversations/<ID> \
  -H "Authorization: Bearer $TOKEN"

# Rename it
curl -X PATCH http://localhost:8000/api/conversations/<ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My first conversation"}'

# Delete it
curl -X DELETE http://localhost:8000/api/conversations/<ID> \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6 — Full browser flow

1. Open `http://localhost:3000`
2. Click **Sign in** or **Request access**
3. Create an account and log in
4. You land in the chat workspace
5. Type a message — the stub engine responds
6. Use the sidebar to switch conversations, delete, or create new ones
7. Open **Preferences** (gear icon in sidebar) to toggle theme or adjust settings

### Step 7 — Run automated tests

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && npm run lint
```

---

## Docker

### Backend

```bash
cd backend
docker build -t privia-backend .
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -v privia-data:/app/data \
  privia-backend
```

### Frontend

```bash
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:8000 \
  -f Dockerfile.frontend \
  -t privia-frontend .
docker run -p 3000:3000 privia-frontend
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `ENV` | `development` | `development` or `production` |
| `SECRET_KEY` | `dev-secret-change-later` | JWT signing key |
| `DATABASE_URL` | `sqlite:///./privia.db` | SQLAlchemy database URL |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins |
| `API_HOST` | `0.0.0.0` | Bind address |
| `API_PORT` | `8000` | Bind port |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | Backend WebSocket URL |

---

## Plugging in a real LLM

The `StubChatEngine` is a placeholder. To connect a real inference backend:

1. Create a new class extending `ChatEngine` in `backend/app/engine/`
2. Implement `answer()`, `stream()`, and `last_response()`
3. Update the factory in `backend/app/engine/__init__.py`

The API endpoints, SSE streaming, WebSocket transport, and conversation persistence all work unchanged — only the engine implementation changes.

---

## License

Private. All rights reserved.
