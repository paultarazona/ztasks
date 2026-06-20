# Backend API Specification

## Purpose

Define the self-hosted HTTP API replacing direct BaaS data access.

## Requirements

### Requirement: Domain HTTP API

The system MUST expose authenticated JSON endpoints for tasks, categories, task statuses, task notes, feedback, admin users, user profiles, avatars, and OpenAPI documentation.

#### Scenario: Authenticated domain request

- GIVEN a valid user session
- WHEN the client requests a user-owned domain resource
- THEN the API returns only resources owned by that user
- AND returns a typed JSON response.

#### Scenario: Missing session

- GIVEN no valid user session
- WHEN the client requests a protected endpoint
- THEN the API returns 401 with a stable error code.

### Requirement: Data ownership enforcement

The system MUST enforce user ownership in every non-admin data query and MUST NOT depend on PostgREST RLS helpers.

#### Scenario: Cross-user access attempt

- GIVEN a user requests another user's resource by id
- WHEN the API evaluates the request
- THEN it returns 404 or 403 without exposing the resource.

#### Scenario: Admin-only access

- GIVEN an authenticated non-admin user
- WHEN the user requests an admin endpoint
- THEN the API returns 403 with a stable error code.

### Requirement: Database migration compatibility

The system MUST preserve the existing table structure while replacing InsForge/PostgREST-specific behavior.

#### Scenario: Baseline migration

- GIVEN an empty PostgreSQL database
- WHEN migrations are applied
- THEN required application tables, triggers, and seed data exist.

#### Scenario: Removed RLS helper

- GIVEN migrations have run
- WHEN database functions and policies are inspected
- THEN `current_app_user_id()` and dependent PostgREST RLS policies are absent.
