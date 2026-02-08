# Privia Frontend

The Next.js frontend for **Privia** — a privacy-first AI chat workspace for teams.

Built with the App Router, TypeScript, Tailwind CSS 4, and shadcn/ui. The goal is not visual experimentation, but **clarity, consistency, and long-term maintainability**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS 4 with CSS custom properties |
| Component library | shadcn/ui (New York variant) + Radix primitives |
| State | React hooks, `useReducer` for chat |
| Real-time | WebSocket + Server-Sent Events (dual transport) |
| Auth | Cookie-based token with `proxy.ts` route guard |
| Theming | `next-themes` (dark-first, system-aware) |
| Containerization | Multi-stage Docker (Node 20 Alpine, standalone output) |

---

## Project structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public landing page
│   │   ├── layout.tsx            # Header + Footer wrapper
│   │   └── page.tsx              # Hero, Features, Privacy, Docs, Terms
│   ├── (auth)/                   # Authentication
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/app/                # Protected chat workspace
│   │   ├── layout.tsx            # Suspense boundary + client layout
│   │   ├── client-layout.tsx     # Sidebar + main area shell
│   │   └── page.tsx              # Chat page (messages, composer, settings)
│   ├── api/health/route.ts       # Health check endpoint
│   ├── globals.css               # Theme tokens (light + dark, oklch)
│   ├── layout.tsx                # Root layout (fonts, metadata, ThemeProvider)
│   └── loading.tsx               # Global loading fallback
│
├── components/
│   ├── chat/                     # Chat UI (11 components)
│   │   ├── ChatComposer.tsx      # Message input with vanishing placeholders
│   │   ├── ChatLoading.tsx       # RAG / chat loading indicators
│   │   ├── ChatMessage.tsx       # Single message (streaming, markdown, actions)
│   │   ├── ChatMessages.tsx      # Message list + empty state
│   │   ├── ChatScrollButton.tsx  # Scroll-to-bottom FAB
│   │   ├── ChatSidebar.tsx       # Conversation list, search, user info
│   │   ├── ChatSources.tsx       # Source citation badges
│   │   ├── EmptyState.tsx        # Starter prompts + welcome
│   │   ├── MarkdownRenderer.tsx  # Markdown + syntax highlighting
│   │   ├── MessageActions.tsx    # Copy, regenerate, feedback
│   │   └── SettingsModal.tsx     # Theme, RAG, model preferences
│   ├── marketing/                # Landing page (4 components)
│   │   ├── Header.tsx            # Aceternity resizable navbar
│   │   ├── Hero.tsx              # Value proposition + CTAs
│   │   ├── Features.tsx          # 4-card feature grid
│   │   └── Footer.tsx            # Links + copyright
│   ├── ui/                       # shadcn/ui primitives (67 components)
│   ├── logo.tsx                  # Brand / flower logo (theme-aware)
│   ├── theme-provider.tsx        # next-themes wrapper
│   └── theme-toggle.tsx          # Light / dark toggle button
│
├── hooks/                        # Custom React hooks
│   ├── chatReducer.ts            # Chat state reducer (messages, conversations)
│   ├── useChatSSE.ts             # SSE streaming transport
│   ├── useChatWS.ts              # WebSocket streaming transport
│   ├── useConversations.ts       # Conversation CRUD + persistence
│   ├── useUserProfile.ts         # Cached user profile from token
│   ├── use-mobile.ts             # Mobile breakpoint detection
│   └── use-toast.ts              # Toast notification hook
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Base fetch wrapper (apiFetch, ApiError)
│   │   ├── auth.ts               # login(), signup(), getProfile()
│   │   └── chat.ts               # queryChat(), chatUrls()
│   ├── auth.ts                   # Client-side token storage (get/store/clear)
│   ├── env.ts                    # Runtime env helpers (apiUrl, wsUrl)
│   └── utils.ts                  # cn() classname merge utility
│
├── types/
│   ├── auth.ts                   # UserProfile, TokenResponse
│   └── chat.ts                   # Message, Conversation, ChatState, ChatAction,
│                                 # + all component prop interfaces
│
├── public/                       # Static assets (logos, favicons)
├── proxy.ts                      # Route protection middleware
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS (Tailwind plugin)
├── components.json               # shadcn/ui registry config
├── Dockerfile.frontend           # Production container image
└── package.json
```

---

## Route protection

`proxy.ts` runs as Next.js middleware on every request.

| Route | Behavior |
|---|---|
| `/` | Public (marketing). Authenticated users redirect to `/app`. |
| `/login`, `/signup` | Public. Authenticated users redirect to `/app`. |
| `/app/*` | Protected. Unauthenticated users redirect to `/login`. |
| `/_next/*`, `/api/health`, favicons | Always pass through. |

Auth is tracked via the `auth-token` cookie, set by `lib/auth.ts` after a successful login.

---

## Theming

The design system uses **oklch** color tokens defined in `globals.css` with light and dark variants. The `ThemeProvider` (wrapping `next-themes`) is configured in the root layout:

- **`defaultTheme`**: `"dark"` (dark-first)
- **`attribute`**: `"class"` (toggles `.dark` on `<html>`)
- **`enableSystem`**: `true`

Key token groups: `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar-*`.

All components use semantic Tailwind classes (`bg-card`, `text-foreground`, `border-border`, etc.) so they adapt to both themes automatically.

---

## Real-time chat

The chat page supports two streaming transports, selectable at runtime:

| Transport | Hook | Protocol | Use case |
|---|---|---|---|
| SSE | `useChatSSE` | `EventSource` over HTTP | Default. Works behind proxies and CDNs. |
| WebSocket | `useChatWS` | `ws://` persistent connection | Lower latency when available. |

Both hooks expose the same interface: `{ isConnected, isLoading, sendMessage, stopGeneration }`.

Messages flow through a `useReducer`-based state machine (`chatReducer.ts`) that handles user messages, assistant streaming tokens, source citations, title updates, and conversation CRUD.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | Backend WebSocket base URL |

These are baked at build time (Next.js `NEXT_PUBLIC_*` convention). Override via `.env.local` or Docker build args.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 9+
- Backend API running on `localhost:8000` (see `../backend/`)

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The marketing page loads for unauthenticated users; sign up or log in to access the chat workspace.

### Production build

```bash
npm run build
npm start
```

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.privia.app \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.privia.app \
  -f Dockerfile.frontend \
  -t privia-frontend .

docker run -p 3000:3000 privia-frontend
```

The image uses a multi-stage build (deps → builder → runner) with standalone output. Final image runs as a non-root `nextjs` user on Alpine.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create optimized production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## Architecture decisions

| Decision | Rationale |
|---|---|
| **App Router with route groups** | Clean separation of `(marketing)`, `(auth)`, and `(app)` concerns without URL nesting. |
| **Server components by default** | Marketing pages and layouts are server-rendered. Client components are only used where interactivity is required (chat, auth forms, theme toggle). |
| **Centralized types** | All component prop interfaces live in `types/chat.ts` and `types/auth.ts` rather than inline in components. |
| **Dual streaming transport** | SSE works universally; WebSocket is available as a lower-latency alternative. The app can switch at runtime without UI changes. |
| **Cookie-based auth guard** | `proxy.ts` runs at the edge before page rendering, so protected routes never flash unauthenticated content. |
| **oklch color tokens** | Perceptually uniform color space for consistent contrast across light and dark themes. |
| **shadcn/ui (copy-paste model)** | Components live in the repo, not in `node_modules`. Full control over styling and behavior without library lock-in. |
| **Standalone Docker output** | Produces a minimal production image (~120 MB) without the full `node_modules` tree. |

---

## Dependencies (key)

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | Framework |
| `react` | 19.2.0 | UI library |
| `tailwindcss` | 4.1.9 | Utility-first CSS |
| `next-themes` | 0.4.6 | Dark / light / system theming |
| `motion` | 12.15.0 | Animations (navbar, chat UI) |
| `react-markdown` | 9.x | Markdown rendering in chat |
| `react-syntax-highlighter` | 15.x | Code block highlighting |
| `zod` | 3.x | Schema validation |
| `sonner` | 2.x | Toast notifications |
| `recharts` | 2.x | Charts (settings, future dashboards) |
| `@vercel/analytics` | 1.x | Page view analytics |

Full dependency list in `package.json`.
