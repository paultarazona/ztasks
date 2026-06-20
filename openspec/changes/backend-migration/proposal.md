# Proposal: Backend Migration — Exit InsForge for a Custom Hono Backend

## Intent

TaskForge depends on the InsForge BaaS SDK (`@insforge/sdk`) as its only backend. This couples 13 frontend files directly to a proprietary SDK (PostgREST builder chains, WS realtime), blocking self-hosting and open-source contribution. Replace InsForge with a custom, well-documented Hono + PostgreSQL backend and decouple the frontend behind a thin service layer.

## Scope

### In Scope
- Hono backend (TypeScript, Drizzle ORM, PostgreSQL, BetterAuth, SSE) with screaming architecture (folders by domain).
- Frontend service layer: `lib/apiClient.ts` + domain service modules (`auth`, `tasks`, `categories`, `task-statuses`, `notes`, `feedback`, `realtime`); hooks/components call services, never the SDK directly.
- SQL migrations (Drizzle Kit) preserving existing table structure; drop PostgREST `current_app_user_id()` RLS function.
- Realtime via SSE (replaces InsForge WS channels), standardized on domain events.
- Avatar upload endpoint replacing `storage.uploadAuto`.
- OpenAPI contract docs under `backend/docs/`.

### Out of Scope
- New product features or UI redesign.
- Hexagonal/repository interface abstraction (Approach 2 rejected — over-abstraction).
- Object-storage provider migration (S3/R2) — local/disk avatar storage for now.
- Schema redesign — table structure stays intact.

## Capabilities

### New Capabilities
- `backend-api`: Hono server, DB client, middleware, domain routes (tasks, categories, task-statuses, task-notes, feedback, admin, user-profiles, avatars).
- `backend-auth`: BetterAuth session auth (httpOnly cookies, OAuth Google, OTP verify, 3-step password reset).
- `realtime-sse`: SSE endpoints + frontend `realtimeService` (EventSource wrapper).
- `frontend-service-layer`: `apiClient` + service modules decoupling hooks/components from transport. Slice 1 may keep InsForge hidden inside service adapters so the app keeps working until Slice 4 swaps service internals to the Hono API.

### Modified Capabilities
- None (no existing spec covers backend behavior).

## Approach

Thin service layer of plain async functions (exploration Approach 1) over a single `fetch` wrapper (`credentials: 'include'`). Backend organized by domain folder, each owning routes/queries/types; `shared/` holds db client, middleware, utils. Delivered as 5 chained PR slices to stay within review budget:

| Slice | Scope | Backend? |
|-------|-------|----------|
| 1 | Frontend service layer (`apiClient` + InsForge-backed service adapters, tests) | No |
| 2 | Backend core (Hono, DB, BetterAuth, migrations) | Yes |
| 3 | Backend domain routes (tasks, categories, notes, feedback, admin) | Yes |
| 4 | Frontend → real backend wiring (swap stubs) | No |
| 5 | Realtime (SSE endpoints + realtimeService) | Yes |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/` | New | Entire Hono backend |
| `frontend/src/lib/insforge.ts` | Removed | Replaced by `apiClient.ts` |
| `frontend/src/services/` | New/Modified | Domain service modules: auth, tasks, categories, task-statuses, notes, feedback, realtime |
| `frontend/src/hooks/*`, `pages/AuthPage.tsx`, `components/settings/SettingsDialog.tsx`, `components/admin/AdminUsers.tsx` | Modified | Call services, not SDK (13 files) |
| `migrations/` | New | Drizzle SQL; drop RLS function |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BetterAuth OAuth (Google) redirect/callback differs from InsForge | High | Align callback + `redirectTo` in Slice 2; validate before frontend wiring |
| OTP 3-step password reset semantics differ | Med | Map send→verify→reset to BetterAuth; adjust `SettingsDialog` UX in Slice 4 |
| `user_profiles_with_email` VIEW needs JOIN to BetterAuth user schema | High | Dedicated `/admin/users` route with explicit JOIN; map BetterAuth schema |
| Avatar storage (multipart) | Med | Hono file-upload endpoint, disk storage; S3/R2 deferred |
| `UNIQUE(category_id, position)` seeding race | Med | Server-side seed in migration/upsert, not client-triggered |
| RLS removal weakens defense-in-depth | Med | Enforce ownership in middleware: `WHERE user_id = session.userId` everywhere |

## Rollback Plan

Each slice is an independent PR. Slices 1–3 add code without removing InsForge, so the app keeps working on the SDK until Slice 4 swaps wiring. Revert Slice 4 (and 5) to restore InsForge instantly; keep `lib/insforge.ts` until Slice 4 merges. Backend slices (2,3,5) are additive and revertible without frontend impact.

## Dependencies

- PostgreSQL instance (local Docker for dev).
- BetterAuth, Drizzle ORM, Hono, `@hono/node-server`.
- Google OAuth client credentials.

## Success Criteria

- [ ] Zero imports of `@insforge/sdk` outside the temporary service adapter boundary; after Slice 4, zero frontend imports of `@insforge/sdk` or `lib/insforge` anywhere under `frontend/src/`.
- [ ] All existing flows (auth, tasks, categories, notes, feedback, admin, realtime) work against the Hono backend.
- [ ] Each slice ships as an independently reviewable, revertible PR.
- [ ] Backend documented with an OpenAPI contract; self-hostable from the repo.
