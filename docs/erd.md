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
