# ztasks

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Backend-Hono-orange)](https://hono.dev)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB)](https://react.dev)

> A self-hosted task management app for university, personal, and professional work.

## What It Does

ztasks is a productivity app that organizes your work through a clean visual interface:

- **Kanban boards** — Visual columns you define (To Do, In Progress, Done, etc.)
- **Categories** — Group tasks by project or context, each with its own board
- **Task notes** — Each task has its own notes area for details, links, and context
- **Priorities** — Low, medium, high, and urgent
- **Due dates** — Keep work on schedule
- **Trash** — Delete categories or tasks without losing them permanently
- **Real-time updates** — Changes appear instantly across tabs via Server-Sent Events
- **Admin panel** — Manage users and feedback from a dedicated admin area

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styles | Tailwind CSS 3.4 |
| Client state | Zustand (auth, theme) |
| Server state | React Query + real-time SSE |
| Drag & Drop | @dnd-kit/core + sortable |
| Backend | Hono (Node.js) |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Auth | BetterAuth (email/password, sessions) |

## Prerequisites

- Node.js 22+
- PostgreSQL 15+ running locally or remotely
- npm

## Project Structure

```
ztasks/
├── backend/                   # Hono API server
│   ├── src/
│   │   ├── auth/              # BetterAuth routes (/auth/me, sign-in, sign-up)
│   │   ├── tasks/             # Task CRUD routes
│   │   ├── categories/        # Category CRUD routes
│   │   ├── task-statuses/     # Kanban column routes
│   │   ├── task-notes/        # Per-task notes routes
│   │   ├── feedback/          # User feedback routes
│   │   ├── user-profiles/     # Profile update routes
│   │   ├── admin/             # Admin-only routes
│   │   ├── realtime/          # SSE event streams
│   │   ├── db/
│   │   │   └── schema/        # Drizzle table definitions
│   │   └── shared/            # Auth, DB, middleware, errors, SSE manager
│   ├── drizzle.config.ts
│   └── package.json
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # UI components (atomic design)
│   │   │   ├── categories/    # Folder tree, category creation
│   │   │   ├── kanban/        # Kanban board, columns, drag & drop
│   │   │   ├── tasks/         # Task cards, creation, detail, list view
│   │   │   ├── settings/      # Profile and account settings
│   │   │   └── layout/        # Sidebar, ProtectedRoute
│   │   ├── hooks/             # Zustand stores + React Query hooks
│   │   ├── services/          # API service functions (one file per domain)
│   │   ├── lib/               # apiClient, errors
│   │   └── pages/             # Top-level routes (Landing, Auth, Dashboard)
│   └── index.html
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/paultarazona/ztasks.git
cd ztasks
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

## Configuration

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ztasks
BETTER_AUTH_SECRET=your-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend — `frontend/.env.local`

```env
VITE_API_URL=http://localhost:3001
```

## Database Setup

Create the database, then run Drizzle migrations:

```bash
# In psql or pgAdmin, create the database first:
# CREATE DATABASE ztasks;

cd backend
npx drizzle-kit migrate
```

## Running Locally

Start both servers in separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

## Available Scripts

### Backend

```bash
npm run dev        # Start dev server with .env auto-loaded
npm run build      # Compile TypeScript
npm test           # Run Vitest test suite
npx drizzle-kit migrate    # Apply pending migrations
npx drizzle-kit generate   # Generate migration from schema changes
```

### Frontend

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
npm test           # Run Vitest test suite
```

## Architecture

### Backend

The backend follows **Screaming Architecture** — folders are named after business domains, not technical patterns:

```
auth/ tasks/ categories/ task-statuses/ task-notes/ feedback/ admin/ realtime/
```

Each domain folder contains a `routes.ts` file with all HTTP handlers for that domain.

**Request flow:**

```
HTTP Request
  → CORS middleware
  → requireAuth / requireAdmin middleware (validates BetterAuth session cookie)
  → Route handler
  → Drizzle ORM → PostgreSQL
  → JSON response
```

**Real-time flow:**

```
Mutation (POST/PATCH/DELETE)
  → Route handler writes to DB
  → SSEManager.broadcast(channel, event)
  → All connected clients on that channel receive the event
```

### Frontend

- **`apiClient.ts`** — Single `fetch` wrapper used by all services. Sends `credentials: 'include'` so the session cookie is always attached.
- **`services/`** — One file per domain. Each service function calls `apiClient`. Hooks never touch the network directly.
- **`hooks/`** — React Query hooks wrap service functions and manage cache, loading, and error state.
- **`stores/`** — Zustand for synchronous global state (auth user, theme).

### Data Model

```
users (BetterAuth)
  └──1:N── categories
              ├──1:N── tasks ──1:N── task_notes
              └──1:N── task_statuses (Kanban columns)
```

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/sign-up/email` | Register with email + password |
| `POST` | `/auth/sign-in/email` | Sign in |
| `POST` | `/auth/sign-out` | Sign out |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/tasks` | List tasks (filter by `?categoryId=`) |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create category |
| `GET` | `/realtime/tasks/:categoryId` | SSE stream for task events |
| `GET` | `/health` | Health check |

Full OpenAPI spec available at `GET /docs/openapi.json` when the backend is running.

## Team Conventions

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add drag-and-drop to kanban
fix: prevent cross-user data access
refactor: remove dead userId params from task service
```

No AI attribution in commits.

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

### Code Style

- Strict TypeScript enabled on both frontend and backend.
- Tailwind CSS for all styling — no CSS modules or styled-components.
- Functional React components with hooks only.
- Derived state over `useEffect` — if you can compute it during render, do not put it in an effect.

## Security

- Session cookies are issued by BetterAuth and validated on every protected request via the `requireAuth` middleware.
- All data queries are scoped to the authenticated user's ID — users cannot read or modify each other's data.
- Admin routes are protected by `requireAdmin`, which checks the `admin_users` table before allowing access.
- Unhandled server errors return a generic `{ error, code }` shape — no stack traces are exposed to clients.

## Contributing

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Run both servers locally and verify the golden path works.

3. Run tests before committing:
   ```bash
   cd backend && npm test
   cd frontend && npm test
   ```

4. Commit with a conventional commit message and open a PR to `main`.

## Resources

- [Hono docs](https://hono.dev/docs) — Backend framework reference
- [Drizzle ORM docs](https://orm.drizzle.team) — Database queries and migrations
- [BetterAuth docs](https://www.better-auth.com/docs) — Authentication reference
- [React Query docs](https://tanstack.com/query/latest) — Server state management
- [Zustand docs](https://github.com/pmndrs/zustand) — Client state management
- [Tailwind CSS docs](https://tailwindcss.com/docs) — Utility classes reference
