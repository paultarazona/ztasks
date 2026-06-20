# Design: Backend Migration — Custom Hono + PostgreSQL

## Technical Approach

Replace `@insforge/sdk` with a custom Hono backend (Drizzle + BetterAuth + SSE) and a thin frontend service layer (plain async functions over one `fetch` wrapper). Screaming architecture: backend folders by domain, `shared/` for cross-cutting infra. No repository/IoC abstraction (rejected in exploration). Ownership enforced by middleware (`WHERE user_id = session.userId`), not RLS. 5 additive PR slices; InsForge stays live and hidden behind temporary service adapters until Slice 4 swaps service internals to the Hono API.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Service layer shape | Plain async functions per domain; Slice 1 uses temporary InsForge-backed adapters | Repository interfaces; fake SDK adapter only | Linus philosophy: zero ceremony, testable by mocking functions; hooks/components decouple first, backend swap = change service internals only |
| Drizzle schema layout | One file per domain in `db/schema/`, barrel re-export | Single `schema.ts` | Screaming architecture; matches route folders; avoids one giant file |
| RLS | Drop `current_app_user_id()` + all policies | Keep RLS as defense-in-depth | Function depends on PostgREST JWT headers absent under Hono; dead policies confuse contributors. Isolation moves to middleware |
| Migrations | Convert `schema.sql` to Drizzle schema, generate baseline migration via `drizzle-kit` | Hand-write SQL migrations | Single source of truth in TS; `drizzle-kit generate` reproduces structure incl. enum/triggers (triggers added as a custom SQL migration) |
| Auth identity | `user_id TEXT` stays decoupled; store BetterAuth `user.id` (text) | FK to BetterAuth user table | Schema already TEXT-decoupled; zero data migration; admin route JOINs explicitly |
| SSE registry | In-memory `Map<channelId, Set<stream>>` in `shared/sse` | Redis pub/sub | Single-instance self-host target; no extra dep. Documented as scale limit |
| DB provider | Drizzle + `pg` driver, connection string only | Provider-specific SDK | Neon and Railway both speak standard Postgres; `DATABASE_URL` swaps freely |

## Data Flow

    Hook ──▶ service fn ──▶ apiClient(fetch) ──▶ Hono route
                                                   │
                          auth middleware ─▶ ownership middleware ─▶ handler ─▶ Drizzle ─▶ PG
                                                   │
                          mutation ─▶ sse.broadcast(channel) ─▶ EventSource ─▶ realtimeService ─▶ hook

## File Changes

### Backend (NEW)

    backend/
      src/
        index.ts                    # Hono app, mount routes, @hono/node-server
        shared/
          db.ts                     # drizzle(pg pool) from DATABASE_URL
          auth.ts                   # BetterAuth instance + config
          middleware/
            requireAuth.ts          # session -> c.set('user')
            requireAdmin.ts         # admin_users lookup
            ownership.ts            # helper: scope query by userId
          sse.ts                    # SSEManager: Map<channel, Set<stream>>, broadcast, heartbeat
          errors.ts                 # ApiError + json error shape
        db/
          schema/
            categories.ts task-statuses.ts tasks.ts task-notes.ts
            feedback.ts admin-users.ts user-profiles.ts index.ts
          migrations/               # drizzle-kit output + triggers.sql
        categories/   { routes.ts, handlers.ts }
        task-statuses/
        tasks/        # handlers broadcast SSE on mutate
        task-notes/
        feedback/
        admin/        # users (JOIN auth user email), stats
        user-profiles/
        avatars/      # multipart upload -> disk, returns url
        realtime/     # GET /sse/:channel
      drizzle.config.ts
      docs/openapi.yaml
      .env.example                  # DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_*, VITE origin

### Frontend

| File | Action | Description |
|---|---|---|
| `frontend/src/lib/apiClient.ts` | Create | fetch wrapper: base URL, `credentials:'include'`, ApiError normalization |
| `frontend/src/services/{auth,tasks,categories,taskStatuses,notes,feedback,realtime}.ts` | Create/Modify | typed async fns per domain; Slice 1 adapters may call InsForge internally |
| `frontend/src/lib/insforge.ts` | Delete (Slice 4) | replaced by services |
| 13 hook/component files | Modify | call services, not SDK (Slice 4) |

## Interfaces / Contracts

```ts
// lib/apiClient.ts
class ApiError extends Error { status: number; code?: string; details?: unknown }
function api<T>(method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', path: string, body?: unknown): Promise<T> // throws ApiError

// services/tasks.ts (sample)
function getTasks(categoryId: string): Promise<Task[]>
function createTask(input: NewTask): Promise<Task>

// services/realtime.ts — EventSource wrapper
function subscribeToTaskChannel(
  userId: string, categoryId: string,
  handlers: { onCreated; onUpdated; onDeleted }
): () => void   // returns unsubscribe
```

Error contract: services let `ApiError` propagate; hooks/TanStack Query handle it. SSE event shape: `{ type: 'task_created'|'task_updated'|'task_deleted', payload }` — domain events standardized (feedback channel migrates off PostgREST `INSERT_feedback` naming).

BetterAuth config: `emailAndPassword`, `emailOTP` (verify + 3-step reset: send→verify→reset), `socialProviders.google`, cookie sessions (httpOnly). `requireAuth` reads session, sets `c.var.user`. Admin = `requireAuth` + `admin_users` lookup.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | apiClient error normalization, SSEManager add/remove/broadcast, ownership scoping | Vitest, mocked fetch/streams |
| Integration | route handlers + Drizzle against test PG | Vitest + Docker Postgres, per-domain |
| E2E | auth, task CRUD, realtime sync | manual/Playwright post-Slice 4 |

## Migration / Rollout

Convert `schema.sql` → Drizzle schema; `drizzle-kit generate` baseline; add `triggers.sql` (updated_at) + seed task_statuses defaults server-side (resolves `UNIQUE(category_id, position)` race). Drop `current_app_user_id()` and RLS policies — not ported. Slices 1–3 additive (InsForge untouched); Slice 4 swaps wiring + deletes `insforge.ts`; Slice 5 adds SSE. Revert Slice 4/5 to restore InsForge.

### Slice → Files

1. **Frontend service layer** (frontend only): `lib/apiClient.ts`, `errors.ts`, and domain `services/*.ts`; hooks/components call services while service internals temporarily adapt to InsForge until Slice 4.
2. **Backend core**: `index.ts`, `shared/{db,auth,sse,errors,middleware}`, `db/schema/*`, migrations, BetterAuth, drizzle.config, .env.example.
3. **Backend domain routes**: `categories/ task-statuses/ tasks/ task-notes/ feedback/ admin/ user-profiles/ avatars/`, OpenAPI.
4. **Wire frontend → backend**: replace service internals with `apiClient` calls, remove remaining InsForge service adapter code, delete `insforge.ts`.
5. **Realtime**: `realtime/` SSE route + handler broadcasts; `services/realtime.ts` EventSource; heartbeat 30s, cleanup on stream close.

## Open Questions

- [ ] Avatar storage: local disk acceptable for self-host, or env-gated S3/R2 seam now? (proposal defers S3)
- [ ] BetterAuth Google callback URL convention to confirm before Slice 4 wiring.
