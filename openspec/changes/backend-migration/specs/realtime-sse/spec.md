# Realtime SSE Specification

## Purpose

Define server-sent realtime updates replacing InsForge WebSocket channels.

## Requirements

### Requirement: Authenticated SSE subscriptions

The system MUST provide authenticated SSE subscriptions for task-category channels and admin feedback channels.

#### Scenario: Task channel subscription

- GIVEN a valid user session and category id
- WHEN the client opens the task realtime stream
- THEN the server returns `text/event-stream` and registers the user-scoped channel.

#### Scenario: Unauthorized subscription

- GIVEN no valid session
- WHEN the client opens a realtime stream
- THEN the server returns 401 and does not register the stream.

### Requirement: Domain event delivery

The system MUST emit standardized domain events for task and feedback mutations and MUST deliver them only to matching authorized channels.

#### Scenario: Task mutation broadcast

- GIVEN a subscribed user is watching a task category
- WHEN a task is created, updated, deleted, or reordered in that category
- THEN the stream receives the corresponding task event with payload.

#### Scenario: Channel isolation

- GIVEN two users are subscribed to different channels
- WHEN one user's task changes
- THEN only that user's matching channel receives the event.

### Requirement: Stream lifecycle

The system SHOULD send heartbeat comments and MUST clean up closed SSE streams.

#### Scenario: Heartbeat

- GIVEN an open SSE connection
- WHEN the heartbeat interval elapses
- THEN the server sends a heartbeat comment.

#### Scenario: Disconnect cleanup

- GIVEN an open SSE connection
- WHEN the client disconnects
- THEN the stream is unregistered and heartbeat resources are released.
