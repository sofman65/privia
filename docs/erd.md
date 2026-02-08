# Privia ERD

```mermaid
erDiagram
    USERS {
        string id PK "UUID"
        string email UK "unique, indexed, not null"
        string full_name "nullable"
        string password_hash "not null, default ''"
        string role "not null, default 'member'"
        string provider "nullable"
        string provider_account_id "nullable"
        string avatar_url "nullable"
    }

    CONVERSATIONS {
        string id PK "UUID"
        string user_id FK "references USERS.id"
        string title "not null"
        string status "not null, default 'empty'"
        datetime created_at "not null"
        datetime updated_at "not null"
    }

    MESSAGES {
        string id PK "UUID"
        string conversation_id FK "references CONVERSATIONS.id"
        string role "not null"
        string content "not null"
        datetime timestamp "not null"
    }

    USERS ||--o{ CONVERSATIONS : owns
    CONVERSATIONS ||--o{ MESSAGES : contains
```

## Constraints

- `USERS.email` is unique (`ix_users_email`).
- `MESSAGES.conversation_id -> CONVERSATIONS.id` has `ON DELETE CASCADE`.
- SQLite foreign keys are enforced via `PRAGMA foreign_keys=ON`.
- Partial unique index on conversations: `ix_conversations_one_empty_per_user` enforces at most one `"empty"` conversation per user.



```mermaid
flowchart LR
  %% Privia High-Level Architecture

  subgraph BROWSER["User Browser"]
    U[User]
  end

  subgraph FE["Frontend (Vercel) - Next.js App Router"]
    MW["Route Guard (proxy.ts)"]
    MKT["Marketing + Auth Pages"]
    APP["Chat Workspace UI"]
    NA["/api/auth/[...nextauth] (NextAuth)"]
  end

  subgraph BE["Backend (FastAPI)"]
    AR["API Router (/api)"]
    AU["Auth Routes (/auth/login, /signup, /me, /oauth)"]
    CH["Chat Routes (/query, /stream, /ws/chat)"]
    CV["Conversation Routes (/conversations)"]
    SC["Security (JWT + PBKDF2)"]
    CE["ChatEngine Boundary"]
    ST["StubChatEngine (default)"]
  end

  subgraph DB["Data Layer"]
    SQ[("SQLite\nusers, conversations, messages")]
  end

  subgraph EXT["External Services"]
    OP[("OAuth Providers\nGoogle / GitHub")]
    LLM[("LLM / RAG Provider\n(optional)")]
  end

  U --> MW
  MW --> MKT
  MW --> APP

  MKT --> NA
  NA <--> OP

  MKT -->|"POST /api/auth/login"| AU
  MKT -->|"POST /api/auth/oauth"| AU

  APP -->|"Bearer token + JSON"| CH
  APP -->|"Bearer token"| CV

  AU --> SC
  CH --> SC
  CV --> SC

  AU --> SQ
  CH --> SQ
  CV --> SQ

  CH --> CE
  CE --> ST
  CE -. "swap implementation" .-> LLM

  CH -->|"SSE / WS stream + done metadata"| APP
  CV -->|"list/get/update/delete conversations"| APP
```