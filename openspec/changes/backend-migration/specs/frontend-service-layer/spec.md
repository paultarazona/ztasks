# Frontend Service Layer Specification

## Purpose

Define the frontend transport boundary that decouples hooks and UI from backend implementation details.

## Requirements

### Requirement: API client boundary

The system MUST route Hono backend HTTP calls through one API client that uses the configured backend URL, includes credentials, parses JSON, and normalizes errors. The client MUST expose `api<T>(method, path, body?)`.

#### Scenario: Successful request

- GIVEN a configured API base URL
- WHEN a service performs a successful request
- THEN the API client returns typed response data.

#### Scenario: Error response

- GIVEN the backend returns a non-2xx JSON error shaped as `{ error, code, fields? }`
- WHEN a service performs the request
- THEN the API client throws a typed `ApiError` with `status`, `code`, and `message`
- AND the backend `error` field becomes `ApiError.message`
- AND backend validation `fields` become `ApiError.details`.

#### Scenario: Legacy error compatibility

- GIVEN a temporary or legacy endpoint returns `{ message, code, details? }`
- WHEN a service performs the request
- THEN the API client still throws `ApiError` using `message`, `code`, and optional `details`.

### Requirement: Domain services

The system MUST expose domain service modules for auth, tasks, categories, task statuses, notes, feedback, avatar/profile flows, and realtime; hooks and UI MUST call services instead of the InsForge SDK.

#### Scenario: Hook uses service

- GIVEN a hook needs task data
- WHEN it loads or mutates tasks
- THEN it calls the task service and does not import InsForge.

#### Scenario: Slice 1 SDK boundary verification

- GIVEN Slice 1 frontend service-layer wiring is complete
- WHEN hook, page, and component imports are searched
- THEN no hook, page, or component imports `@insforge/sdk` or `lib/insforge`
- AND any remaining InsForge usage is confined to temporary service adapter internals.

#### Scenario: Final SDK removal verification

- GIVEN Slice 4 frontend backend wiring is complete
- WHEN all frontend source imports are searched
- THEN no file under `frontend/src/` imports `@insforge/sdk` or `lib/insforge`.

### Requirement: Realtime service wrapper

The system MUST wrap EventSource subscriptions behind a realtime service that returns an unsubscribe function.

#### Scenario: Subscribe and cleanup

- GIVEN a caller subscribes to a realtime channel
- WHEN the returned cleanup function is called
- THEN the underlying EventSource is closed.

#### Scenario: Session expiry event

- GIVEN a realtime stream reports session expiry
- WHEN the service receives the event
- THEN it invokes the configured session-expired handler when present.
