# URL Shortener — Architecture

This document defines the technical architecture for the URL shortener. It complements [spec.md](./spec.md) and [business-rules.md](./business-rules.md).

## Overview

The system is a containerized web application with:

| Layer | Technology |
| --- | --- |
| Application (UI + API + redirect) | Node.js (single app) |
| Database | PostgreSQL |
| Runtime / packaging | Docker Compose |

Anonymous users create short links and view preview/QR pages. Authenticated users manage their own links and may define custom short codes. All services run locally (and in deployment) via Docker.

## Goals

- Deliver UI, API, redirect, and QR generation in **one** Node.js application
- Persist short-link and user data in an **external** PostgreSQL database
- Run the application with Docker Compose (app service only; database is not containerized here)
- Support public redirect and preview flows with low latency
- Enforce authentication and ownership for management features

## Non-Goals (architecture)

- Multi-region or multi-tenant infrastructure
- Separate analytics/event pipeline
- Message queues or background workers beyond what is needed for QR generation at request time
- Public self-registration infrastructure
- Separate frontend and backend deployable applications

## High-Level Architecture

```text
┌─────────────┐     ┌──────────────────────────────┐     ┌────────────┐
│   Browser   │────▶│  Node.js app                 │────▶│ PostgreSQL │
└─────────────┘     │  UI + API + redirect + QR    │     └────────────┘
┌─────────────┐     └──────────────────────────────┘
│   Clients   │─────────────▶ (same app)
│ (redirect / │
│  QR scan)   │
└─────────────┘
```

**Request paths:**

| Actor | Entry | Responsibility |
| --- | --- | --- |
| Anonymous / public user | Node.js app | Create short URL, view preview, follow redirect |
| Authenticated user | Node.js app | Sign in, manage owned URLs, custom short codes |
| QR / short URL client | Node.js app | Resolve short code and redirect to the original URL |

## Components

### 1. Node.js application (`src/`)

A single process serves both the web UI and the HTTP API / redirect layer.

**UI responsibilities:**

- Public form to submit an original URL and display the resulting short URL + QR code
- Preview page at `/v/{short_code}`
- Sign-in screen for pre-provisioned users
- Management UI: list, edit, and delete owned short links; create custom short codes

**API / server responsibilities:**

- REST (or equivalent HTTP) API for create/list/edit/delete short links
- Authentication (login) and authorization checks for management endpoints
- Short-code generation (6-character `a-z0-9`) and uniqueness enforcement
- Custom short-code validation (uniqueness, reserved paths, character rules)
- Redirect resolution for short URLs
- QR code generation encoding the **short URL**
- Preview data for `/v/{short_code}`
- Persistence via PostgreSQL

**Constraints:**

- Single source of truth for business rules (validation, ownership, routing precedence)
- Passwords stored only as secure hashes
- Reserved routes take precedence over short-code resolution (see business rules)
- Only this application writes to PostgreSQL

Internal module boundaries inside `src/` (e.g. `routes/`, `views/`, `services/`) may separate UI and API concerns without splitting into two apps.

### 2. PostgreSQL

Responsibilities:

- Persist `User` and `ShortLink` entities (logical model in [spec.md](./spec.md))
- Enforce uniqueness of `short_code` at the database level (unique constraint/index)
- Support optional `owner_id` for authenticated ownership

## Docker Architecture

Docker assets live under `docker/`. Compose runs the **application only**. PostgreSQL is an **external** database (managed outside this repository’s Compose file).

### Services

| Service | Image / build | Role |
| --- | --- | --- |
| `app` | Build from `docker/Dockerfile` | UI, API, auth, redirect, QR |

There is **no** `db` service in Compose. Connection details for the external Postgres instance are supplied via environment variables (`DB_*`).

### Compose principles

- The Node.js app is built from the project Dockerfile
- The app connects to an external PostgreSQL host reachable from the container network (e.g. host machine, managed cloud DB, or a DB on another Compose stack)
- Environment variables configure ports, database credentials, session secrets, and public base URL (used when composing short URLs and QR content)
- Only the app HTTP port is published to the host

### Suggested topology

```text
Docker Compose
└── app  → publishes HTTP port (e.g. 4000)
         → connects to external PostgreSQL (DB_HOST / DB_PORT / …)
```

Compose file: `docker-compose.yml` at the repository root (build context uses `docker/Dockerfile`).

## Application Boundaries

### Public flows (no auth)

1. **Create short link** — UI → API handler → persist `ShortLink` → generate QR → return short URL + QR
2. **Redirect** — Client hits short URL → lookup `short_code` → HTTP redirect to `original_url`
3. **Preview** — Client opens `/v/{short_code}` → load link + QR → render preview (no automatic redirect)

### Authenticated flows

1. **Login** — UI → verify credentials → issue session/token
2. **Custom create / CRUD** — Authenticated endpoints → ownership checks → PostgreSQL

## Routing Architecture

Routing precedence must match business rules:

1. Reserved system routes (auth, management, API, static assets, `/v/...`)
2. Preview: `/v/{short_code}`
3. Short-code redirect for remaining path segments that match an existing code

The Node.js app owns both UI routes and redirect resolution.

## Data Architecture

### Logical entities

Aligned with the product spec:

- **User** — `id`, `username`, `password_hash`, `authorized`, `user_admin`, `created_at`
- **ShortLink** — `id`, `short_code`, `original_url`, `owner_id` (nullable), `created_at`, `updated_at`

### Persistence rules

- `short_code` is unique globally (DB unique constraint + application checks)
- Anonymous links have `owner_id = NULL`
- Authenticated creates set `owner_id` to the current user
- Deletes remove the row permanently (code becomes available again)

### QR codes

- Generated when a short link is created or when the short code changes
- Encode the public short URL (not the original URL)
- May be returned as image bytes, data URL, or a dedicated endpoint; storage of binary QR blobs in the database is optional (regeneration from short URL is acceptable)

## Security Architecture

| Concern | Approach |
| --- | --- |
| Passwords | Hashed at rest (e.g. bcrypt/argon2); never plain text |
| Management API | Requires authenticated + authorized user |
| Ownership | List/edit/delete limited to `owner_id` match |
| Secrets | DB credentials, session secrets via environment / Compose secrets — not committed |
| Transport | HTTPS at deployment edge (local Docker may use HTTP) |

## Suggested Repository Layout

```text
/
├── src/                # Single Node.js application
├── db/                 # PostgreSQL migrations and seeds
├── docs/               # Product + architecture docs
├── docker/             # Dockerfile and Compose-related assets
├── README.md
└── CHANGELOG.md
```

One `package.json` at the repository root (or under `src/` if preferred at implementation time). Docker build context points at the single app.

## Configuration

| Variable area | Examples | Used by |
| --- | --- | --- |
| Database | host, port, name, user, password | App |
| HTTP port | app listen port | Compose / app |
| Public base URL | e.g. `https://short.example` or local origin | App (short URL + QR payload) |
| Auth secrets | session/JWT secret | App |

## Quality Attributes

| Attribute | Architectural response |
| --- | --- |
| Reliability | Postgres as durable store; unique index on `short_code`; collision retry on generation |
| Performance | Redirect path is a simple keyed lookup; keep redirect handler lean |
| Security | Hashed credentials, authZ on management, reserved-path protection |
| Operability | One-command local bring-up via Docker Compose |
| Maintainability | Single app with clear internal modules; business rules enforced in the server layer |

## Out of Scope (for later)

- CDN / edge caching for redirects
- Read replicas or connection pooling beyond a single Postgres instance
- Horizontal scaling and load balancing details
- Observability stack (metrics, tracing) beyond basic application logs

## Acceptance Criteria (architecture)

- [ ] Stack is Docker (app) + external PostgreSQL + a single Node.js application
- [ ] App local environment starts via Docker Compose (without a Postgres container)
- [ ] Only the Node.js app writes to PostgreSQL
- [ ] Redirect and short-code uniqueness are enforced in the app/data layer
- [ ] UI and API live in the same application
- [ ] Secrets and DB credentials are supplied through environment configuration
