# Spec: backend-migration

All four capability areas are NEW — no existing specs exist for these domains.
This document contains four full specs, one per new capability.

---

# 1. frontend-service-layer Specification

## Purpose

Decouple all frontend hooks and components from the InsForge SDK by introducing a thin
service layer of plain async functions. During Slice 1, service modules MAY hide the existing
InsForge client internally as compatibility adapters so the app continues to run. No hook,
page, or component may import `@insforge/sdk` or `lib/insforge.ts` directly.

## Requirements

### Requirement: API Client Module

The system MUST provide `frontend/src/lib/apiClient.ts` that wraps the native `fetch` API.
The client MUST read the backend base URL from `VITE_API_URL` (env variable) and MUST attach
`credentials: 'include'` to every request so session cookies are forwarded automatically.
The client MUST export a typed helper `api<T>(method, path, body?)` that accepts method,
path, and optional body, returns parsed JSON, and throws a typed `ApiError` on non-2xx
responses.

#### Scenario: Successful JSON request

- GIVEN the backend returns HTTP 200 with a JSON body
- WHEN a service calls `api<Task[]>('GET', '/tasks')`
- THEN the client returns the parsed JSON object
- AND no error is thrown

#### Scenario: Non-2xx response normalisation

- GIVEN the backend returns HTTP 4xx or 5xx
- WHEN the client receives the response
- THEN it throws an `ApiError` with `message`, `code`, `status`, and optional `details`
- AND backend `{ error, code, fields? }` payloads are normalized so `error` becomes `ApiError.message` and `fields` becomes `ApiError.details`
- AND legacy `{ message, code, details? }` payloads remain supported during migration
- AND the raw `Response` object is NOT propagated to the caller

#### Scenario: Missing base URL

- GIVEN `VITE_API_URL` is undefined at build time
- WHEN the app initialises
- THEN the client throws a configuration error at import time, not at call time

---

### Requirement: Service Modules

The system MUST provide the following service modules under `frontend/src/services/`:
`authService.ts`, `tasksService.ts`, `categoriesService.ts`, `taskStatusesService.ts`,
`feedbackService.ts`, `notesService.ts`, `realtimeService.ts`.
Each module MUST export only typed async functions (or, for realtime, subscription functions).
During Slice 1, service modules MAY import `lib/insforge` internally as a temporary adapter;
they MUST NOT re-export the InsForge client. By Slice 4, service modules MUST use `apiClient`
for backend calls and MUST NOT import `@insforge/sdk` or `lib/insforge`.

#### Scenario: Hook calls service, not SDK

- GIVEN a hook such as `useTasks` needs to fetch tasks for a category
- WHEN it calls `tasksService.getTasksByCategory(categoryId)`
- THEN the hook receives typed task objects
- AND no reference to `insforge.database` exists in the hook file

#### Scenario: Service error reaches hook as typed error

- GIVEN `tasksService.createTask` calls the backend and the backend returns 409
- WHEN the hook awaits the service call
- THEN the hook catches an `ApiError` with `code` and `message` fields
- AND the hook is NOT required to inspect HTTP status codes directly

---

### Requirement: Hooks Import Only Service Functions

Every file under `frontend/src/hooks/` and every component that previously imported
`insforge` MUST be refactored to import from the appropriate service module.
The import `from '@insforge/sdk'`, `from '../lib/insforge'`, or equivalent relative imports
MUST NOT appear in any hook, page, or component file after Slice 1 is applied.

#### Scenario: Zero InsForge imports after Slice 1

- GIVEN the Slice 1 PR has merged
- WHEN a static analysis scan searches for `@insforge/sdk` in `src/hooks/**` and `src/pages/**`
- THEN zero matches are found

#### Scenario: Compatibility adapter mode during Slice 1 (before backend exists)

- GIVEN the Hono backend does not yet exist (Slice 1 only)
- WHEN a service function is called during development
- THEN it MAY delegate to the existing InsForge client internally, return a hardcoded stub,
  or throw a not-implemented error depending on the flow
- AND the hook code is unchanged between compatibility-adapter and real-backend modes

---

### Requirement: Realtime Service Module

`realtimeService.ts` MUST wrap the browser's native `EventSource` API.
It MUST expose `subscribe(channel: string, handlers: EventHandlers): () => void`, where the
return value is a cleanup function that closes the `EventSource` connection.
The module MUST NOT expose the underlying `EventSource` instance to callers.

#### Scenario: Subscribe and receive event

- GIVEN a hook calls `realtimeService.subscribe('tasks:u1:cat42', handlers)`
- WHEN the server pushes a `task_created` event
- THEN `handlers.onTaskCreated(payload)` is invoked
- AND the hook does not manage the `EventSource` lifecycle directly

#### Scenario: Cleanup on unmount

- GIVEN a React hook subscribed via `realtimeService.subscribe`
- WHEN the component unmounts and the cleanup function is called
- THEN the underlying `EventSource` is closed
- AND no further handler callbacks fire

---

# 2. backend-api Specification

## Purpose

Provide a Hono HTTP server that replaces all PostgREST-generated REST endpoints with
explicit, domain-organised route handlers backed by Drizzle ORM and PostgreSQL.

## Requirements

### Requirement: Domain Route Groups

The server MUST organise routes into the following Hono route groups, each in its own
domain folder under `backend/src/`:
`/tasks`, `/categories`, `/task-statuses`, `/task-notes`, `/feedback`, `/admin`, `/user-profiles`, `/avatars`.
Each group MUST be mounted at its canonical prefix on the root Hono app.

#### Scenario: Route group isolation

- GIVEN the server starts
- WHEN `GET /tasks` is called
- THEN only the tasks route handler runs
- AND no category or feedback logic is executed

#### Scenario: Unknown route returns 404

- GIVEN no route matches the request path
- WHEN any HTTP method is used
- THEN the server returns HTTP 404 with `{ error: "Not found", code: "NOT_FOUND" }`

---

### Requirement: Auth Middleware on All Mutating Endpoints

Every endpoint that creates, updates, or deletes data MUST be protected by a BetterAuth
session-check middleware. The middleware MUST reject unauthenticated requests with HTTP 401
before the route handler runs.
Read (`GET`) endpoints for user data MUST also require authentication.
Only public endpoints (e.g., OAuth callbacks, health check) MAY skip auth middleware.

#### Scenario: Unauthenticated mutation rejected

- GIVEN no valid session cookie is present
- WHEN `POST /tasks` is called
- THEN the server returns HTTP 401 with `{ error: "Unauthorized", code: "UNAUTHORIZED" }`
- AND the route handler is NOT invoked

#### Scenario: Authenticated mutation succeeds

- GIVEN a valid session cookie is present
- WHEN `POST /tasks` is called with a valid body
- THEN the middleware resolves `session.userId` and passes it to the route handler
- AND the handler creates the task scoped to that user

---

### Requirement: Explicit User Scoping on All Queries

Every Drizzle query that reads or mutates user-owned data MUST include an explicit
`WHERE user_id = session.userId` clause. The server MUST NOT rely on database-level RLS
for user isolation.

#### Scenario: Cross-user data access prevented at query level

- GIVEN user A is authenticated
- WHEN `GET /tasks?categoryId=99` is called
- THEN the Drizzle query includes `.where(eq(tasks.userId, session.userId))`
- AND tasks belonging to other users are never included in the result set

---

### Requirement: Consistent Error Response Shape

All error responses from the server MUST follow the JSON shape
`{ "error": "<human-readable message>", "code": "<SCREAMING_SNAKE_CASE>" }`.
Validation errors MUST return HTTP 422 with field-level details nested under `"fields"`.
Unexpected server errors MUST return HTTP 500 with `code: "INTERNAL_ERROR"` and MUST NOT
expose stack traces or internal details.

#### Scenario: Validation error shape

- GIVEN `POST /tasks` is called with a missing `title` field
- WHEN the server validates the body
- THEN it returns HTTP 422 with `{ error: "Validation failed", code: "VALIDATION_ERROR", fields: { title: "required" } }`

#### Scenario: 500 does not leak internals

- GIVEN the database connection drops
- WHEN any endpoint is called
- THEN the server returns HTTP 500 with `{ error: "Internal server error", code: "INTERNAL_ERROR" }`
- AND no stack trace, SQL, or env values appear in the response body

---

### Requirement: OpenAPI Documentation

The server MUST generate an OpenAPI 3.x document from its Hono route definitions.
The document MUST be available at `GET /docs/openapi.json` at runtime.
A Scalar or Swagger UI explorer MUST be served at `GET /docs`.

#### Scenario: OpenAPI document reflects live routes

- GIVEN the server is running
- WHEN `GET /docs/openapi.json` is called
- THEN the response contains all registered route paths, HTTP methods, and schema definitions

---

# 3. backend-auth Specification

## Purpose

Replace InsForge auth with BetterAuth, implementing the same user-facing flows
(email/password, Google OAuth, OTP email verification, 3-step password reset, avatar upload)
via explicit HTTP endpoints protected by httpOnly session cookies.

## Requirements

### Requirement: Session via httpOnly Cookie

BetterAuth MUST issue a session token stored in an httpOnly, Secure, SameSite=Strict cookie.
The session MUST be validated on every protected request by the auth middleware.
`GET /auth/me` MUST return the current user object when a valid session exists, or HTTP 401
when it does not.

#### Scenario: Session restore on page reload

- GIVEN the user previously logged in and a valid session cookie exists
- WHEN the frontend calls `GET /auth/me` on app initialisation
- THEN the server returns `{ id, email, name, avatar_url }` with HTTP 200

#### Scenario: Expired or missing session

- GIVEN no session cookie or an expired cookie is sent
- WHEN `GET /auth/me` is called
- THEN the server returns HTTP 401 with `{ error: "Unauthorized", code: "UNAUTHORIZED" }`

---

### Requirement: Email/Password Registration with OTP Verification

New users MUST register with email and password. Upon successful registration the server
MUST send a 6-digit OTP to the provided email address. The account MUST NOT be considered
verified until `POST /auth/verify-email` is called with the correct OTP.

#### Scenario: Successful registration triggers OTP

- GIVEN valid email and password are submitted to `POST /auth/register`
- WHEN the server processes the request
- THEN it creates the user, sends an OTP email, and returns `{ requiresEmailVerification: true }`

#### Scenario: OTP verification activates account

- GIVEN a registration OTP was sent
- WHEN `POST /auth/verify-email` is called with `{ email, otp }`
- THEN the account is marked verified and a session cookie is issued

#### Scenario: Wrong OTP rejected

- GIVEN a registration OTP was sent
- WHEN `POST /auth/verify-email` is called with an incorrect OTP
- THEN the server returns HTTP 400 with `code: "INVALID_OTP"`

---

### Requirement: Email/Password Login

`POST /auth/login` MUST authenticate users with email and password.
On success the server MUST issue a session cookie. On failure it MUST return HTTP 401.

#### Scenario: Valid credentials

- GIVEN a verified user account exists
- WHEN `POST /auth/login` is called with correct credentials
- THEN the server issues a session cookie and returns the user object

#### Scenario: Invalid credentials

- GIVEN incorrect email or password
- WHEN `POST /auth/login` is called
- THEN the server returns HTTP 401 with `code: "INVALID_CREDENTIALS"`
- AND no session cookie is set

---

### Requirement: Google OAuth

`GET /auth/google` MUST initiate the OAuth flow by redirecting to Google's consent screen.
`GET /auth/google/callback` MUST handle the OAuth callback, create or link the user account,
and issue a session cookie before redirecting to `/dashboard`.

#### Scenario: Successful OAuth login

- GIVEN the user approves Google consent
- WHEN Google redirects to `/auth/google/callback` with a valid code
- THEN the server creates or updates the user, sets a session cookie, and redirects to `/dashboard`

#### Scenario: OAuth cancellation

- GIVEN the user cancels Google consent
- WHEN Google redirects to the callback with an error parameter
- THEN the server redirects to `/login` with an error query param

---

### Requirement: 3-Step Password Reset

The password reset flow MUST consist of exactly three steps matching the current UX:
1. `POST /auth/reset-password/request` — sends OTP to the user's email.
2. `POST /auth/reset-password/verify` — validates OTP and returns a short-lived reset token.
3. `POST /auth/reset-password/confirm` — accepts the reset token and new password, updates credentials.

#### Scenario: Full reset flow succeeds

- GIVEN a valid user email
- WHEN all three steps are completed with valid inputs in order
- THEN the user's password is updated and they can log in with the new password

#### Scenario: Reset token cannot be reused

- GIVEN a reset token was issued and used in step 3
- WHEN `POST /auth/reset-password/confirm` is called again with the same token
- THEN the server returns HTTP 400 with `code: "TOKEN_EXPIRED_OR_USED"`

#### Scenario: OTP expiry

- GIVEN a reset OTP was issued
- WHEN `POST /auth/reset-password/verify` is called after the OTP TTL has elapsed
- THEN the server returns HTTP 400 with `code: "OTP_EXPIRED"`

---

### Requirement: Avatar Upload

`POST /auth/avatar` MUST accept a multipart form upload with a single image file.
The server MUST store the file to local disk (path configurable via env) and MUST return
`{ avatar_url: "<public URL>" }`. The returned URL MUST be publicly accessible without auth.
The user's profile MUST be updated with the new `avatar_url` atomically with the file write.

#### Scenario: Successful avatar upload

- GIVEN the user is authenticated and submits a valid image file
- WHEN `POST /auth/avatar` is called
- THEN the file is saved to disk, the user profile is updated, and `{ avatar_url }` is returned

#### Scenario: Non-image file rejected

- GIVEN the user submits a file with MIME type that is not an image
- WHEN `POST /auth/avatar` is called
- THEN the server returns HTTP 422 with `code: "INVALID_FILE_TYPE"`
- AND no file is written to disk

---

### Requirement: Admin Check

A user is an admin if a row exists in the `admin_users` table with their `user_id`.
An `isAdmin` middleware MUST be available and MUST return HTTP 403 when the session user
is not present in `admin_users`. Admin routes MUST apply this middleware after the base
auth middleware.

#### Scenario: Admin access granted

- GIVEN the session user has a row in `admin_users`
- WHEN an admin-only route is called
- THEN the request proceeds to the route handler

#### Scenario: Non-admin access rejected

- GIVEN the session user has no row in `admin_users`
- WHEN an admin-only route is called
- THEN the server returns HTTP 403 with `code: "FORBIDDEN"`

---

# 4. realtime-sse Specification

## Purpose

Replace the InsForge WebSocket realtime with Server-Sent Events (SSE) endpoints that push
domain events to authenticated clients. The frontend receives events via the native
`EventSource` API wrapped in `realtimeService.ts`.

## Requirements

### Requirement: SSE Endpoints

The server MUST expose the following SSE endpoints:
- `GET /realtime/tasks/:categoryId` — streams task domain events for a given category.
- `GET /realtime/feedback` — streams feedback domain events (admin only).

Both endpoints MUST require a valid session cookie; the session MUST be validated on the
initial SSE connection request. Unauthenticated SSE connection attempts MUST return HTTP 401
before upgrading to SSE.

#### Scenario: Authenticated SSE connection established

- GIVEN a valid session cookie is present
- WHEN `GET /realtime/tasks/42` is called
- THEN the server responds with `Content-Type: text/event-stream` and keeps the connection open

#### Scenario: Unauthenticated SSE connection rejected

- GIVEN no session cookie is present
- WHEN `GET /realtime/tasks/42` is called
- THEN the server returns HTTP 401 and does NOT upgrade to SSE

---

### Requirement: Domain Events

The server MUST emit the following standardised domain events over SSE:

| Endpoint | Event name | Trigger |
|---|---|---|
| `/realtime/tasks/:categoryId` | `task_created` | A task is created in the category |
| `/realtime/tasks/:categoryId` | `task_updated` | A task in the category is updated |
| `/realtime/tasks/:categoryId` | `task_deleted` | A task in the category is deleted |
| `/realtime/feedback` | `feedback_created` | A new feedback record is inserted |
| `/realtime/feedback` | `feedback_updated` | A feedback record is updated |
| `/realtime/feedback` | `feedback_deleted` | A feedback record is deleted |

Each SSE event MUST use the `event:` field set to the domain event name and `data:` set to
a JSON-serialised payload containing at minimum the affected record's `id`.

#### Scenario: Task creation triggers SSE event

- GIVEN a client is subscribed to `/realtime/tasks/42`
- WHEN `POST /tasks` creates a task in category 42
- THEN the SSE stream emits `event: task_created` with `data: { id, categoryId, ... }`

#### Scenario: Events are user-scoped

- GIVEN user A and user B are both subscribed to `/realtime/tasks/42`
- WHEN user A creates a task in category 42
- THEN only user A's SSE stream receives the `task_created` event
- AND user B's stream receives nothing

---

### Requirement: Heartbeat

The server MUST send a heartbeat SSE comment (`: heartbeat`) or keep-alive event every 30
seconds on every open SSE connection to prevent proxy and load-balancer timeouts.

#### Scenario: Heartbeat sent at 30-second interval

- GIVEN an SSE connection has been open for 30 seconds without events
- WHEN the server's heartbeat timer fires
- THEN a `: heartbeat` SSE comment is written to the response stream

---

### Requirement: Server-Side Connection Cleanup

When a client disconnects (TCP close or browser navigation), the server MUST detect the
disconnect via the request's `close` event and MUST release all server-side resources
(timers, event listeners) associated with that SSE connection.

#### Scenario: Client disconnects — server cleans up

- GIVEN a client is subscribed to `/realtime/tasks/42`
- WHEN the client closes the browser tab
- THEN the server's `close` handler fires, clears the heartbeat timer, and removes the
  connection from any in-memory subscriber registry

---

### Requirement: Client-Side Auto-Reconnect

The frontend's `realtimeService.ts` MUST rely on the browser's native `EventSource`
auto-reconnect behaviour. The service MUST NOT implement custom reconnection logic.
If the server closes the SSE connection intentionally (e.g., session expiry), it MUST
send `data: { code: "SESSION_EXPIRED" }` before closing so the client can redirect to login.

#### Scenario: Network blip — automatic reconnect

- GIVEN the SSE connection drops due to a transient network issue
- WHEN the browser's `EventSource` retries the connection
- THEN the server accepts the reconnect and resumes streaming (no client code needed)

#### Scenario: Session expiry communicated before close

- GIVEN the user's session expires while an SSE connection is open
- WHEN the server detects the expiry on the next heartbeat tick
- THEN the server sends `event: error` with `data: { code: "SESSION_EXPIRED" }` and closes the stream
- AND the frontend `onError` handler can redirect the user to `/login`
