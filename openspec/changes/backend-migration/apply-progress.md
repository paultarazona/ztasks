# Apply Progress: backend-migration

Last updated: 2026-06-20

## Current phase

`apply` is ready and has started for Slice 1. Planning artifacts are complete:

- proposal: `openspec/changes/backend-migration/proposal.md`
- specs: `openspec/changes/backend-migration/spec.md` and `openspec/changes/backend-migration/specs/*/spec.md`
- design: `openspec/changes/backend-migration/design.md`
- tasks: `openspec/changes/backend-migration/tasks.md`

## Completed apply work

### Slice 1 / Phase 1.1 — apiClient foundation

Completed tasks:

- 1.1 apiClient non-2xx error tests.
- 1.2 config error test for missing `VITE_API_URL`.
- 1.3 `api<T>(method, path, body?)` implementation.
- 1.4 `ApiError` type.
- 1.5 Vitest validation.

Additional synchronization completed:

- Aligned frontend and OpenSpec error contract:
  - backend `{ error, code, fields? }` maps to `ApiError.message`, `ApiError.code`, and `ApiError.details`.
  - legacy `{ message, code, details? }` remains supported during migration.
- Clarified that Slice 1 service modules may temporarily hide InsForge behind service adapters until Slice 4 replaces service internals with Hono `apiClient` calls.
- Tracked OpenSpec artifacts in git by removing `openspec/` from `.gitignore` and staging `openspec/`.

## Validation evidence

Commands run:

```bash
cd frontend && npx vitest run src/lib/apiClient.test.ts
```

Result: passed — 1 test file, 7 tests.

```bash
cd frontend && npm run test:run
```

Result: passed — 5 test files, 23 tests.

```text
lsp_diagnostics(frontend/src/lib/apiClient.ts, frontend/src/lib/apiClient.test.ts)
```

Result: zero diagnostics.

## Current known gaps

- `verify-report.md` and `sync-report.md` do not exist yet; verify/sync/archive are not ready.
- `frontend/src/services/tasksService.test.ts` now satisfies task 1.6 by mocking `apiClient` and asserting `getTasksByCategory(categoryId)` calls `GET /tasks?categoryId=...`.
- Remaining service modules/functions still need task-aligned apiClient-backed tests and implementations before their checkboxes can be marked complete.
- Engram search/context endpoints are unavailable in this session; memory writes worked only when `project: "task"` was supplied explicitly.

## Latest apply step: 1.6

Task 1.6 completed with strict TDD evidence:

1. RED: `cd frontend && npx vitest run src/services/tasksService.test.ts` failed because `getTasksByCategory('category-1')` still used the old InsForge path and returned `undefined` instead of the typed task array.
2. GREEN: `frontend/src/services/tasksService.ts` now routes `getTasksByCategory(categoryId)` through `api<Task[]>('GET', '/tasks?categoryId=...')` while preserving a two-argument overload for existing hook compatibility until task 1.14.
3. Validation passed:

```bash
cd frontend && npx vitest run src/services/tasksService.test.ts
cd frontend && npm run test:run
```

## Next task

Continue strict TDD at:

```text
1.7 Complete tasksService apiClient-backed functions: createTask, updateTask, deleteTask, and reorderTasks.
```

Do not proceed to verify/sync/archive until apply tasks are complete and a verify report exists.
