# URL Shortener — Database Scripts

This document defines the database script files for the URL shortener. It complements [spec.md](./spec.md), [business-rules.md](./business-rules.md), and [architecture.md](./architecture.md).

The database is **PostgreSQL**. Scripts are the source of truth for schema creation, constraints, and optional seed data. The backend is the only application component that connects to the database.

## Goals

- Version and organize SQL scripts in a predictable layout
- Materialize the logical entities `User` and `ShortLink` as physical tables
- Enforce uniqueness of `short_code` and ownership integrity at the database level
- Support local and Docker-based bootstrap of an empty or seeded database

## Non-Goals

- Click / analytics event tables
- Soft-delete or historical audit tables (unless introduced later)
- Multi-schema tenancy
- Storing QR code binary blobs (regeneration from short URL is acceptable; see architecture)

## Script Layout

Suggested location under the repository root:

```text
/
├── db/
│   ├── README.md                 # optional local notes (how to run scripts)
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_short_links.sql
│   │   └── 003_indexes_and_constraints.sql   # if not already in 001/002
│   └── seeds/
│       └── 001_authorized_users.sql
└── ...
```

### Naming conventions

| Rule | Description |
| --- | --- |
| Numbered prefix | Use zero-padded sequential numbers (`001_`, `002_`, …) so scripts apply in order |
| Snake case | File names use lowercase snake_case after the prefix |
| One concern per file | Prefer create-table / seed / index concerns separated when clarity improves |
| Idempotency | Prefer `IF NOT EXISTS` (and safe seed patterns) where practical for local re-runs |

Exact migration tooling (raw SQL via Compose init, Flyway, node-pg-migrate, etc.) is chosen at implementation time. Regardless of tool, the **logical script set** below must be covered.

## Script Catalog

### 1. `migrations/001_create_users.sql`

Creates the `users` table for pre-provisioned accounts.

| Column | Type (suggested) | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `UUID` or `BIGSERIAL` | `PRIMARY KEY` | Stable identifier |
| `username` | `VARCHAR` / `TEXT` | `NOT NULL`, `UNIQUE` | Login identifier |
| `password_hash` | `TEXT` | `NOT NULL` | Never store plain-text passwords (BR-AUTH-006) |
| `authorized` | `BOOLEAN` | `NOT NULL`, default `false` | Management access flag (BR-AUTH-003) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Creation timestamp |

**Responsibilities:**

- Persist credentials only as secure hashes
- Support lookup by `username` for login
- Distinguish authorized vs unauthorized accounts

### 2. `migrations/002_create_short_links.sql`

Creates the `short_links` table for anonymous and owned short URLs.

| Column | Type (suggested) | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `UUID` or `BIGSERIAL` | `PRIMARY KEY` | Stable identifier |
| `short_code` | `VARCHAR` | `NOT NULL`, `UNIQUE` | Global unique public code (BR-CODE-005) |
| `original_url` | `TEXT` | `NOT NULL` | Destination URL |
| `owner_id` | same as `users.id` | `NULL` allowed, `FOREIGN KEY → users(id)` | `NULL` = anonymous (BR-OWN-002) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Updated on edit |

**Responsibilities:**

- Store mapping short code → original URL
- Optional ownership for authenticated creates
- Support list/edit/delete scoped by `owner_id`

**Foreign key behavior (suggested):**

- `ON DELETE RESTRICT` (or `SET NULL`) on `owner_id` — choose at implementation; prefer not to silently orphan management history without an explicit product decision
- Deleting a short link removes the row permanently (BR-OWN-008); the short code then becomes available again

### 3. `migrations/003_indexes_and_constraints.sql` (optional split)

If indexes/constraints are not declared inline in `001` / `002`, this script must guarantee at least:

| Object | Purpose |
| --- | --- |
| Unique constraint / unique index on `short_links.short_code` | Collision safety at DB level |
| Unique constraint / unique index on `users.username` | Login integrity |
| Index on `short_links.owner_id` | Efficient “list my URLs” queries |

Application-level validation remains required; database constraints are the last line of defense for uniqueness and referential integrity.

### 4. `seeds/001_authorized_users.sql`

Seeds **pre-provisioned** users. There is no public registration (BR-AUTH-001).

**Responsibilities:**

- Insert one or more authorized accounts for local/dev (and optionally controlled environments)
- Store only password hashes, never plain passwords in the repository
- Document how hashes are generated in project docs or seed comments (tooling/command), without committing real production secrets

Seed files for production must not contain shared or weak credentials. Environment-specific seeds may live outside the default tracked seed or be injected via secure configuration.

## Physical Model Summary

```text
users
├── id (PK)
├── username (UNIQUE)
├── password_hash
├── authorized
└── created_at

short_links
├── id (PK)
├── short_code (UNIQUE)
├── original_url
├── owner_id → users.id (nullable)
├── created_at
└── updated_at
```

## Bootstrap with Docker

Aligned with [architecture.md](./architecture.md):

- The `db` Compose service runs the official PostgreSQL image
- On first volume initialization, Postgres can mount `db/migrations/` (and optionally `db/seeds/`) into `/docker-entrypoint-initdb.d/` **or** migrations can be applied by a dedicated migrate step started by Compose / CI
- Data persists in a named Docker volume across container restarts
- Re-running init scripts only applies automatically on an empty data directory; subsequent schema changes require ordered migrations

## Persistence Rules (normative)

1. `short_code` is unique globally — enforced by a unique constraint
2. Anonymous short links have `owner_id IS NULL`
3. Authenticated creates set `owner_id` to the creating user
4. Hard delete of a short link removes the row; redirect and preview for that code become not found
5. Passwords are stored only as `password_hash`
6. QR images are not required as database columns

## Out of Scope (for later)

- Expiration columns for short links
- Click counters / analytics tables
- Password-reset tokens
- Migration history table specifics beyond what the chosen migration tool requires

## Acceptance Criteria

- [ ] Script layout under `db/` (or equivalent) is documented and implemented
- [ ] `users` and `short_links` tables match the logical model in the product spec
- [ ] `short_code` uniqueness is enforced in the database
- [ ] `owner_id` is nullable and references `users` when set
- [ ] Seed path exists for pre-provisioned authorized users without plain-text passwords in git
- [ ] Database can be brought up via Docker Compose with schema applied
