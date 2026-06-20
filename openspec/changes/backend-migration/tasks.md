# Tasks: Backend Migration — Exit InsForge for Custom Hono Backend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,800–2,400 (5 slices) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Slice 1 → Slice 2 → Slice 3 → Slice 4 → Slice 5 → tracker → main |
| Delivery strategy | ask-on-risk → chained PRs confirmed |
| Chain strategy | feature-branch-chain (gitflow) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base Branch |
|------|------|-----------|-------------|
| Slice 1 | Frontend service layer + stubs (frontend-only) | PR 1 | `feature/backend-migration` |
| Slice 2 | Backend core: Hono, DB, BetterAuth, migrations | PR 2 | `feature/bm-slice-1` |
| Slice 3 | Backend domain routes + OpenAPI | PR 3 | `feature/bm-slice-2` |
| Slice 4 | Frontend wiring: swap stubs for real API, remove insforge.ts | PR 4 | `feature/bm-slice-3` |
| Slice 5 | Realtime: SSE endpoints + realtimeService, remove InsForge realtime | PR 5 | `feature/bm-slice-4` |

---

## Slice 1 — Frontend Service Layer (PR 1 → `feature/backend-migration`)

### Phase 1.1: apiClient foundation

- [x] 1.1 Write failing tests `frontend/src/lib/apiClient.test.ts`: assert non-2xx responses throw `ApiError` with status/code/message, including legacy `{ message, code, details? }` and backend `{ error, code, fields? }` payloads (RED)
- [x] 1.2 Write failing test: assert `apiClient` throws config error at import when `VITE_API_URL` is undefined (RED)
- [x] 1.3 Create `frontend/src/lib/apiClient.ts`: export `api<T>(method, path, body?)` that reads `VITE_API_URL`, attaches `credentials: 'include'`, parses JSON, maps backend `error` → `ApiError.message`, maps backend `fields` → `ApiError.details`, and throws typed `ApiError` on non-2xx (GREEN for 1.1–1.2)
- [x] 1.4 Create `frontend/src/lib/errors.ts`: export `ApiError extends Error` with `status: number`, `code?: string`, `details?: unknown`
- [x] 1.5 Run `cd frontend && npx vitest run` — apiClient tests must pass; rerun after backend error-shape alignment

### Phase 1.2: Service stubs

- [x] 1.6 Write failing tests `frontend/src/services/tasksService.test.ts`: mock `apiClient`, assert `getTasksByCategory(id)` calls `GET /tasks?categoryId=id` and returns typed array (RED → GREEN)
- [x] 1.7 Create `frontend/src/services/tasksService.ts`: export `getTasksByCategory`, `createTask`, `updateTask`, `deleteTask`, `reorderTasks` — each calls `apiClient` with hook-compatible temporary signatures (RED → GREEN)
- [ ] 1.8 Create `frontend/src/services/categoriesService.ts`: export `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` — stub implementations
- [ ] 1.9 Create `frontend/src/services/authService.ts`: export `getMe`, `login`, `register`, `logout`, `verifyEmail`, `requestPasswordReset`, `verifyPasswordResetOtp`, `confirmPasswordReset`, `uploadAvatar` — stub implementations
- [ ] 1.10 Create `frontend/src/services/notesService.ts`: export `getNotesByTask`, `createNote`, `deleteNote` — stub implementations
- [ ] 1.11 Create `frontend/src/services/feedbackService.ts`: export `submitFeedback`, `getFeedback`, `updateFeedback`, `deleteFeedback` — stub implementations
- [ ] 1.12 Create `frontend/src/services/realtimeService.ts`: export `subscribe(channel, handlers): () => void` wrapping `EventSource`; stub returns no-op cleanup during Slice 1

### Phase 1.3: Hook refactor

- [ ] 1.13 Write failing test for one representative hook (e.g., `useTasks.test.ts`): mock `tasksService`, assert hook calls service, NOT `insforge` (RED)
- [ ] 1.14 Refactor `frontend/src/hooks/useTasks.ts`: replace all `insforge.database.*` calls with `tasksService.*` (GREEN for 1.13)
- [ ] 1.15 Refactor `frontend/src/hooks/useCategories.ts`: replace SDK calls with `categoriesService.*`
- [ ] 1.16 Refactor `frontend/src/hooks/useAuth.ts` (and `AuthPage.tsx` auth calls): replace SDK auth calls with `authService.*`
- [ ] 1.17 Refactor `frontend/src/hooks/useNotes.ts`: replace SDK calls with `notesService.*`
- [ ] 1.18 Refactor `frontend/src/hooks/useFeedback.ts` and `AdminUsers.tsx` feedback calls: replace with `feedbackService.*` and `authService.*`
- [ ] 1.19 Refactor remaining hook/component files that import `@insforge/sdk` or `lib/insforge` (check with `rg "@insforge/sdk|lib/insforge" src/`): wire to appropriate service
- [ ] 1.20 Run `cd frontend && npx vitest run` — all refactored hook tests must pass; zero `@insforge/sdk` imports in `src/hooks/**` and `src/pages/**`

---

## Slice 2 — Backend Core (PR 2 → `feature/bm-slice-1`)

### Phase 2.1: Project scaffold

- [ ] 2.1 Create `backend/package.json` with deps: `hono`, `@hono/node-server`, `drizzle-orm`, `pg`, `better-auth`, `drizzle-kit` (devDep), `vitest` (devDep)
- [ ] 2.2 Create `backend/tsconfig.json` targeting ESNext with `moduleResolution: bundler`
- [ ] 2.3 Create `backend/.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AVATAR_UPLOAD_DIR`, `FRONTEND_URL`
- [ ] 2.4 Create `backend/drizzle.config.ts`: point `schema` at `src/db/schema/index.ts`, `out` at `src/db/migrations/`

### Phase 2.2: DB schema + migrations

- [ ] 2.5 Create `backend/src/db/schema/tasks.ts`: Drizzle table `tasks` mirroring existing columns (`id`, `user_id`, `category_id`, `title`, `description`, `status_id`, `position`, `due_date`, `created_at`, `updated_at`)
- [ ] 2.6 Create `backend/src/db/schema/categories.ts`, `task-statuses.ts`, `task-notes.ts`, `feedback.ts`, `user-profiles.ts`, `admin-users.ts`, `avatars.ts`
- [ ] 2.7 Create `backend/src/db/schema/index.ts`: barrel re-exporting all schema tables
- [ ] 2.8 Run `drizzle-kit generate` to produce baseline migration; move `schema.sql` content to Drizzle definitions, verify output matches existing table structure
- [ ] 2.9 Add custom SQL migration file `backend/src/db/migrations/001_drop_rls.sql`: `DROP FUNCTION IF EXISTS current_app_user_id() CASCADE;` + drop all PostgREST RLS policies
- [ ] 2.10 Add custom SQL migration `backend/src/db/migrations/002_updated_at_trigger.sql`: create `set_updated_at()` trigger function and attach to all tables with `updated_at`
- [ ] 2.11 Add seed migration `backend/src/db/migrations/003_seed_task_statuses.sql`: upsert default `task_statuses` rows (resolves `UNIQUE(category_id, position)` race)
- [ ] 2.12 Create `backend/src/shared/db.ts`: export Drizzle client instance connected via `DATABASE_URL` using `pg` driver

### Phase 2.3: Shared infrastructure

- [ ] 2.13 Write failing test `backend/src/shared/errors.test.ts`: assert `notFound()` returns `{ error: "Not found", code: "NOT_FOUND" }` and `internalError()` does not leak stack trace (RED)
- [ ] 2.14 Create `backend/src/shared/errors.ts`: export helpers `badRequest`, `unauthorized`, `forbidden`, `notFound`, `validationError`, `internalError` — each returns typed `{ error, code }` object (GREEN for 2.13)
- [ ] 2.15 Create `backend/src/shared/middleware/requireAuth.ts`: reads BetterAuth session from cookie, sets `c.var.user`, returns 401 `{ error, code: "UNAUTHORIZED" }` if missing
- [ ] 2.16 Create `backend/src/shared/middleware/requireAdmin.ts`: calls `requireAuth`, then queries `admin_users` for session user; returns 403 `{ error, code: "FORBIDDEN" }` if absent
- [ ] 2.17 Create `backend/src/shared/middleware/ownership.ts`: verifies a fetched record's `user_id === c.var.user.id`; returns 404 if mismatch (prevents enumeration)
- [ ] 2.18 Create `backend/src/shared/auth.ts`: initialise BetterAuth with `emailAndPassword`, `emailOTP`, `socialProviders.google`, `httpOnly` cookie sessions; export `auth` instance and `getSession` helper
- [ ] 2.19 Write failing test `backend/src/shared/sse.test.ts`: assert `SSEManager.broadcast(channel, event)` calls `write` on all registered streams for that channel only (RED)
- [ ] 2.20 Create `backend/src/shared/sse.ts`: export `SSEManager` with `register(channel, stream)`, `unregister(channel, stream)`, `broadcast(channel, event)` backed by `Map<string, Set<stream>>` (GREEN for 2.19)

### Phase 2.4: Entry point

- [ ] 2.21 Create `backend/src/index.ts`: init Hono app, mount `requireAuth` globally on protected groups (stub route groups as empty routers for now), mount BetterAuth handler at `/auth`, add 404 fallback returning `{ error: "Not found", code: "NOT_FOUND" }`, start `@hono/node-server`
- [ ] 2.22 Run `cd backend && npx vitest run` — shared/errors and sse tests must pass

---

## Slice 3 — Backend Domain Routes (PR 3 → `feature/bm-slice-2`)

### Phase 3.1: Auth routes

- [ ] 3.1 Write failing test `backend/src/auth/auth.test.ts`: mock BetterAuth session, assert `GET /auth/me` returns `{ id, email, name, avatar_url }` on valid session, 401 on missing (RED)
- [ ] 3.2 Create `backend/src/auth/routes.ts`: `GET /auth/me` (requireAuth), mount BetterAuth handlers for `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/verify-email`, `/auth/google`, `/auth/google/callback` (GREEN for 3.1)
- [ ] 3.3 Create `backend/src/auth/avatar.ts`: `POST /auth/avatar` (requireAuth, multipart), validate MIME is image/*, write file to `AVATAR_UPLOAD_DIR`, update `user_profiles.avatar_url`, return `{ avatar_url }`
- [ ] 3.4 Create `backend/src/auth/reset.ts`: `POST /auth/reset-password/request` (send OTP), `/auth/reset-password/verify` (validate OTP → return short-lived token), `/auth/reset-password/confirm` (validate token → update password, mark token used)
- [ ] 3.5 Run `cd backend && npx vitest run` — auth route tests must pass

### Phase 3.2: Task routes

- [ ] 3.6 Write failing test `backend/src/tasks/tasks.test.ts`: mock Drizzle, assert `GET /tasks?categoryId=42` query includes `WHERE user_id = session.userId AND category_id = 42`; assert `POST /tasks` without session returns 401 (RED)
- [ ] 3.7 Create `backend/src/tasks/routes.ts` (requireAuth on all): `GET /tasks?categoryId`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/reorder`; every query scopes `WHERE user_id = c.var.user.id`; mutations broadcast to SSEManager channel `tasks:${userId}:${categoryId}` (GREEN for 3.6)

### Phase 3.3: Categories routes

- [ ] 3.8 Create `backend/src/categories/routes.ts` (requireAuth): `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`; scope all queries by `user_id`

### Phase 3.4: Supporting domain routes

- [ ] 3.9 Create `backend/src/task-statuses/routes.ts` (requireAuth): `GET /task-statuses`
- [ ] 3.10 Create `backend/src/task-notes/routes.ts` (requireAuth): `GET /task-notes?taskId`, `POST /task-notes`, `DELETE /task-notes/:id`; scope by `user_id` via task ownership check
- [ ] 3.11 Create `backend/src/feedback/routes.ts` (requireAuth for create, requireAdmin for read/update/delete): `POST /feedback`, `GET /feedback`, `PATCH /feedback/:id`, `DELETE /feedback/:id`; broadcast feedback SSE events on mutations
- [ ] 3.12 Create `backend/src/user-profiles/routes.ts` (requireAuth): `GET /user-profiles/me`, `PATCH /user-profiles/me`
- [ ] 3.13 Create `backend/src/admin/routes.ts` (requireAdmin): `GET /admin/users` (JOIN BetterAuth user table for email), `GET /admin/stats`
- [ ] 3.14 Mount all route groups in `backend/src/index.ts` at their canonical prefixes

### Phase 3.5: OpenAPI

- [ ] 3.15 Add `@hono/zod-openapi` (or equivalent) to `backend/package.json`; annotate each route group with schema definitions
- [ ] 3.16 Create `backend/src/docs/routes.ts`: serve `GET /docs/openapi.json` and `GET /docs` (Scalar UI); mount in `index.ts`
- [ ] 3.17 Write failing test: assert `GET /docs/openapi.json` returns 200 with `paths` containing `/tasks` and `/auth/me` (RED → GREEN inline)
- [ ] 3.18 Run `cd backend && npx vitest run` — all domain route tests must pass

---

## Slice 4 — Frontend Wiring (PR 4 → `feature/bm-slice-3`)

### Phase 4.1: Service implementations

- [ ] 4.1 Write failing test `frontend/src/services/authService.test.ts`: mock `apiClient`, assert `getMe()` calls `GET /auth/me` and returns typed user (RED)
- [ ] 4.2 Replace stub body in `authService.ts` with real `apiClient` calls; ensure all auth flows (login, register, verifyEmail, resetPassword, uploadAvatar) hit correct endpoints (GREEN for 4.1)
- [ ] 4.3 Write failing test `frontend/src/services/tasksService.test.ts`: assert real `createTask` calls `POST /tasks` and propagates `ApiError` (RED → GREEN)
- [ ] 4.4 Replace stub bodies in `tasksService.ts`, `categoriesService.ts`, `notesService.ts`, `feedbackService.ts` with real `apiClient` calls

### Phase 4.2: Remove InsForge

- [ ] 4.5 Delete `frontend/src/lib/insforge.ts`
- [ ] 4.6 Remove `@insforge/sdk` from `frontend/package.json`
- [ ] 4.7 Run `rg "@insforge/sdk|lib/insforge" frontend/src/` — must return zero matches
- [ ] 4.8 Run `cd frontend && npx vitest run` — all hook and service tests must pass with real service implementations

---

## Slice 5 — Realtime SSE (PR 5 → `feature/bm-slice-4`)

### Phase 5.1: Backend SSE endpoints

- [ ] 5.1 Write failing test `backend/src/realtime/realtime.test.ts`: mock SSEManager, assert `GET /realtime/tasks/42` without session returns 401; with session sets `Content-Type: text/event-stream` (RED)
- [ ] 5.2 Create `backend/src/realtime/routes.ts` (requireAuth): `GET /realtime/tasks/:categoryId` — registers stream in SSEManager for channel `tasks:${userId}:${categoryId}`, sends 30s heartbeat `": heartbeat"`, removes stream on request `close` event (GREEN for 5.1)
- [ ] 5.3 Add `GET /realtime/feedback` (requireAdmin): registers stream for channel `feedback:admin`, same heartbeat + cleanup pattern
- [ ] 5.4 Write failing test: assert `SSEManager.broadcast` emits `event: task_created\ndata: {...}` format only to streams on the matching channel (RED → GREEN via existing SSEManager)
- [ ] 5.5 Verify `backend/src/tasks/routes.ts` mutations call `sse.broadcast('tasks:${userId}:${categoryId}', { type: 'task_created', payload })` — add calls if missing
- [ ] 5.6 Verify `backend/src/feedback/routes.ts` mutations broadcast `feedback_created|updated|deleted` events to `feedback:admin` channel
- [ ] 5.7 Mount `/realtime` route group in `backend/src/index.ts`
- [ ] 5.8 Run `cd backend && npx vitest run` — realtime tests must pass

### Phase 5.2: Frontend realtimeService

- [ ] 5.9 Write failing test `frontend/src/services/realtimeService.test.ts`: mock `EventSource`, assert `subscribe('tasks:u1:cat42', handlers)` constructs EventSource at correct URL and maps `task_created` message to `handlers.onTaskCreated(payload)` (RED)
- [ ] 5.10 Replace stub body in `realtimeService.ts` with real `EventSource` implementation: constructs `new EventSource(${VITE_API_URL}/realtime/${channel}, { withCredentials: true })`, maps `task_created`, `task_updated`, `task_deleted`, `feedback_created|updated|deleted` events to handlers, returns cleanup fn that calls `es.close()`; on `error` event with `data.code === "SESSION_EXPIRED"` call `handlers.onSessionExpired?.()` (GREEN for 5.9)
- [ ] 5.11 Remove any InsForge WebSocket / realtime subscription code from hooks that used it; wire `useRealtime` or equivalent hook to `realtimeService.subscribe`
- [ ] 5.12 Run `cd frontend && npx vitest run` — realtimeService tests must pass

### Phase 5.3: Final verification

- [ ] 5.13 Run full test suite: `cd frontend && npx vitest run` — zero failures
- [ ] 5.14 Run `rg "@insforge/sdk|lib/insforge|insforge\.database|insforge\.realtime" frontend/src/` — must return zero matches
- [ ] 5.15 Verify `backend/src/shared/sse.ts` SSEManager cleanup: confirm `close` event handler calls `sse.unregister(channel, stream)` and `clearInterval(heartbeatTimer)` in all SSE route handlers
