# URL Shortener — Architecture

This document defines the technical architecture for the URL shortener. It complements [spec.md](./spec.md) and [business-rules.md](./business-rules.md).

## Overview

The system is a containerized web application with:

| Layer | Technology |
| --- | --- |
| Frontend | Node.js |
| Backend (API + redirect) | Node.js |
| Database | PostgreSQL |
| Runtime / packaging | Docker Compose |

Anonymous users create short links and view preview/QR pages. Authenticated users manage their own links and may define custom short codes. All services run locally (and in deployment) via Docker.

## Goals

- Keep frontend and backend as separate Node.js applications with clear boundaries
- Persist short-link and user data in PostgreSQL
- Run the full stack with Docker Compose (app services + database)
- Support public redirect and preview flows with low latency
- Enforce authentication and ownership for management features

## Non-Goals (architecture)

- Multi-region or multi-tenant infrastructure
- Separate analytics/event pipeline
- Message queues or background workers beyond what is needed for QR generation at request time
- Public self-registration infrastructure

## High-Level Architecture

```text
┌─────────────┐     ┌──────────────────────┐     ┌────────────┐
│   Browser   │────▶│  Frontend (Node.js)  │     │            │
└─────────────┘     └──────────┬───────────┘     │            │
                               │ HTTP            │ PostgreSQL │
┌─────────────┐     ┌──────────▼───────────┐     │            │
│   Clients   │────▶│  Backend (Node.js)   │────▶│            │
│ (redirect / │     │  API + redirect      │     │            │
│  QR scan)   │     └──────────────────────┘     └────────────┘
└─────────────┘
```

**Request paths:**

| Actor | Entry | Responsibility |
| --- | --- | --- |
| Anonymous / public user | Frontend + Backend | Create short URL, view preview, follow redirect |
| Authenticated user | Frontend + Backend | Sign in, manage owned URLs, custom short codes |
| QR / short URL client | Backend | Resolve short code and redirect to original URL |

## Components

### 1. Frontend (Node.js)

Responsibilities:

- Public UI to submit an original URL and display the resulting short URL + QR code
- Preview page rendering at `/v/{short_code}` (or consume backend data for that route, depending on rendering choice)
- Sign-in screen for pre-provisioned users
- Management UI: list, edit, and delete owned short links; create custom short codes

Constraints:

- Does not write directly to PostgreSQL
- Talks to the backend over HTTP (JSON API)
- Holds only session/token state needed for authenticated calls

### 2. Backend (Node.js)

Responsibilities:

- REST (or equivalent HTTP) API for create/list/edit/delete short links
- Authentication (login) and authorization checks for management endpoints
- Short-code generation (6-character `a-z0-9`) and uniqueness enforcement
- Custom short-code validation (uniqueness, reserved paths, character rules)
- Redirect resolution for short URLs
- QR code generation encoding the **short URL**
- Preview data for `/v/{short_code}`
- Persistence via PostgreSQL

Constraints:

- Single source of truth for business rules (validation, ownership, routing precedence)
- Passwords stored only as secure hashes
- Reserved routes take precedence over short-code resolution (see business rules)

### 3. PostgreSQL

Responsibilities:

- Persist `User` and `ShortLink` entities (logical model in [spec.md](./spec.md))
- Enforce uniqueness of `short_code` at the database level (unique constraint/index)
- Support optional `owner_id` for authenticated ownership

## Docker Architecture

All runtime dependencies are defined with Docker Compose.

### Services

| Service | Image / build | Role |
| --- | --- | --- |
| `frontend` | Build from frontend Node.js app | Serves the web UI |
| `backend` | Build from backend Node.js app | API, auth, redirect, QR |
| `db` | Official PostgreSQL image | Relational data store |

### Compose principles

- Frontend and backend are built from project Dockerfiles
- PostgreSQL data is stored in a named Docker volume for persistence across restarts
- Services communicate on an internal Docker network
- Backend connects to Postgres using Compose service DNS (`db`)
- Environment variables configure ports, database credentials, session secrets, and public base URL (used when composing short URLs and QR content)
- Only necessary ports are published to the host (frontend, backend; database may stay internal-only in production-like setups)

### Suggested topology

```text
Docker Compose network
├── frontend  → publishes UI port (e.g. 3000)
├── backend   → publishes API/redirect port (e.g. 4000)
└── db        → PostgreSQL (internal; optional host port for local tooling)
```

Exact ports and image tags are defined at implementation time in `docker-compose.yml`.

## Application Boundaries

### Public flows (no auth)

1. **Create short link** — Frontend → `POST` backend → persist `ShortLink` → generate QR → return short URL + QR
2. **Redirect** — Client hits short URL on backend → lookup `short_code` → HTTP redirect to `original_url`
3. **Preview** — Client opens `/v/{short_code}` → backend (and/or frontend) loads link + QR → render preview (no automatic redirect)

### Authenticated flows

1. **Login** — Frontend → backend verifies credentials → issues session/token
2. **Custom create / CRUD** — Frontend → authenticated backend endpoints → ownership checks → PostgreSQL

## Routing Architecture

Routing precedence must match business rules:

1. Reserved system routes (auth, management, API, static assets, `/v/...`)
2. Preview: `/v/{short_code}`
3. Short-code redirect for remaining path segments that match an existing code

The **backend** owns redirect resolution and short-code lookup. The **frontend** owns interactive UI routes. In development and Docker, a reverse-proxy layer may be introduced later to unify a single public origin; the initial architecture allows frontend and backend on separate published ports.

## Data Architecture

### Logical entities

Aligned with the product spec:

- **User** — `id`, `username`, `password_hash`, `authorized`, `created_at`
- **ShortLink** — `id`, `short_code`, `original_url`, `owner_id` (nullable), `created_at`, `updated_at`

### Persistence rules

- `short_code` is unique globally (DB unique constraint + application checks)
- Anonymous links have `owner_id = NULL`
- Authenticated creates set `owner_id` to the current user
- Deletes remove the row permanently (code becomes available again)

### QR codes

- Generated by the backend when a short link is created or when the short code changes
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
├── docker-compose.yml
├── docs/spec/          # product + architecture docs
├── frontend/           # Node.js frontend
├── backend/            # Node.js backend (API + redirect + QR)
└── ...
```

Each app (`frontend`, `backend`) has its own `package.json`, Dockerfile, and source tree.

## Configuration

| Variable area | Examples | Used by |
| --- | --- | --- |
| Database | host, port, name, user, password | Backend |
| HTTP ports | frontend port, backend port | Compose / apps |
| Public base URL | e.g. `https://short.example` or local origin | Backend (short URL + QR payload) |
| Auth secrets | session/JWT secret | Backend |

## Quality Attributes

| Attribute | Architectural response |
| --- | --- |
| Reliability | Postgres as durable store; unique index on `short_code`; collision retry on generation |
| Performance | Redirect path is a simple keyed lookup; keep redirect handler lean |
| Security | Hashed credentials, authZ on management, reserved-path protection |
| Operability | One-command local bring-up via Docker Compose |
| Maintainability | Clear frontend/backend split; business rules enforced in backend |

## Out of Scope (for later)

- CDN / edge caching for redirects
- Read replicas or connection pooling beyond a single Postgres instance
- Horizontal scaling and load balancing details
- Observability stack (metrics, tracing) beyond basic application logs

## Acceptance Criteria (architecture)

- [ ] Stack is Docker + PostgreSQL + Node.js frontend + Node.js backend
- [ ] Full local environment starts via Docker Compose
- [ ] Backend is the only component writing to PostgreSQL
- [ ] Redirect and short-code uniqueness are enforced in the backend/data layer
- [ ] Frontend consumes backend APIs for create, preview data, auth, and management
- [ ] Secrets and DB credentials are supplied through environment configuration
