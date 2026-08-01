# URL Shortener — Issues Checklist

Checklist of development issues derived from [spec.md](./spec/spec.md), [business-rules.md](./spec/business-rules.md), [architecture.md](./spec/architecture.md), and [database.md](./spec/database.md).

Use this as the backlog for implementing the project. Check items as they are completed.

---

## Epic 1 — Project foundation

- [ ] **ISS-001** — Initialize repository layout (`frontend/`, `backend/`, `db/`, `docs/`)
- [ ] **ISS-002** — Create backend Node.js app scaffold (`package.json`, entrypoint, basic HTTP server)
- [ ] **ISS-003** — Create frontend Node.js app scaffold (`package.json`, entrypoint, basic UI shell)
- [ ] **ISS-004** — Add Dockerfiles for `frontend` and `backend`
- [ ] **ISS-005** — Add `docker-compose.yml` with services `frontend`, `backend`, and `db` (PostgreSQL)
- [ ] **ISS-006** — Configure environment variables (DB credentials, ports, public base URL, auth secrets)
- [ ] **ISS-007** — Add `.env.example` and ensure secrets are not committed
- [ ] **ISS-008** — Verify full stack starts with Docker Compose

---

## Epic 2 — Database

- [ ] **ISS-009** — Create `db/migrations/001_create_users.sql` (`users` table)
- [ ] **ISS-010** — Create `db/migrations/002_create_short_links.sql` (`short_links` table)
- [ ] **ISS-011** — Ensure unique constraint on `short_links.short_code` and index on `owner_id`
- [ ] **ISS-012** — Wire migrations into Docker Postgres bootstrap (init mount or migrate step)
- [ ] **ISS-013** — Create `db/seeds/001_authorized_users.sql` with pre-provisioned authorized users (hashed passwords only)
- [ ] **ISS-014** — Document how to generate password hashes for seeds
- [ ] **ISS-015** — Verify schema and seed apply cleanly on a fresh Compose volume

---

## Epic 3 — Backend core infrastructure

- [ ] **ISS-016** — Connect backend to PostgreSQL (connection config + health check)
- [ ] **ISS-017** — Define API error response shape (validation, conflict, not found, unauthorized)
- [ ] **ISS-018** — Implement request validation helpers for URLs and short codes
- [ ] **ISS-019** — Define reserved path segments (`v`, auth, API, management, static)
- [ ] **ISS-020** — Configure public base URL usage for composing short URLs

---

## Epic 4 — Anonymous short links

- [ ] **ISS-021** — Validate original URL on create (required, absolute, `http`/`https`) — BR-URL-001, BR-URL-002
- [ ] **ISS-022** — Normalize original URL before persistence (trim) — BR-URL-003
- [ ] **ISS-023** — Generate random 6-character short codes (`a-z`, `0-9`) — BR-CODE-002–004
- [ ] **ISS-024** — Enforce uniqueness with collision retry (and safe retry limit) — BR-CODE-005, BR-CODE-006
- [ ] **ISS-025** — Persist anonymous `ShortLink` with `owner_id = NULL` — BR-OWN-002
- [ ] **ISS-026** — Expose `POST` API endpoint to create short links anonymously
- [ ] **ISS-027** — Return short URL (and related payload) to the client on success

---

## Epic 5 — QR code

- [ ] **ISS-028** — Generate QR code encoding the **short URL** (not original) — BR-QR-001, BR-QR-002
- [ ] **ISS-029** — Include QR in create response (image bytes, data URL, or dedicated endpoint)
- [ ] **ISS-030** — Regenerate QR when an authenticated user changes the short code — BR-QR-003

---

## Epic 6 — Redirect

- [ ] **ISS-031** — Implement short-code lookup and HTTP redirect to `original_url` — BR-RED-001, BR-RED-002
- [ ] **ISS-032** — Return not found for unknown / deleted short codes — BR-RED-003
- [ ] **ISS-033** — Ensure redirect route does not require authentication — BR-RED-005
- [ ] **ISS-034** — Enforce routing precedence: reserved routes and `/v/...` before short-code redirect — BR-ROUTE-*

---

## Epic 7 — Preview page (backend + frontend)

- [ ] **ISS-035** — Backend endpoint or data for preview by `short_code` (short URL + QR) — BR-PREV-002
- [ ] **ISS-036** — Return not found for unknown short codes on preview — BR-PREV-003
- [ ] **ISS-037** — Frontend page at `/v/{short_code}` displaying short URL and QR — BR-PREV-001
- [ ] **ISS-038** — Ensure preview does **not** auto-redirect to the original URL — BR-PREV-005
- [ ] **ISS-039** — Ensure preview is publicly accessible — BR-PREV-004

---

## Epic 8 — Authentication & authorization

- [ ] **ISS-040** — Implement login with username + password against `users` — BR-AUTH-002
- [ ] **ISS-041** — Verify password against stored hash (never store plain text) — BR-AUTH-006
- [ ] **ISS-042** — Issue session or token after successful login
- [ ] **ISS-043** — Protect management endpoints (require authentication) — BR-AUTH-005
- [ ] **ISS-044** — Deny management actions for authenticated but unauthorized accounts — BR-AUTH-003, BR-AUTH-004
- [ ] **ISS-045** — Frontend sign-in page for pre-provisioned users — BR-AUTH-001
- [ ] **ISS-046** — Persist and send auth credentials/token from frontend on management calls
- [ ] **ISS-047** — Implement logout (invalidate session / clear client auth state)

---

## Epic 9 — Authenticated short links & management (backend)

- [ ] **ISS-048** — Allow authenticated authorized users to create links with custom short codes — BR-CODE-007
- [ ] **ISS-049** — Validate custom short codes (non-empty, no `/`, no whitespace, length/charset rules) — BR-CODE-010
- [ ] **ISS-050** — Reject custom codes that collide with reserved paths — BR-CODE-009
- [ ] **ISS-051** — Reject custom codes that already exist (conflict) — BR-CODE-008
- [ ] **ISS-052** — If authenticated user omits custom code, generate random 6-char code — BR-CODE-011
- [ ] **ISS-053** — Set `owner_id` on authenticated creates — BR-OWN-001
- [ ] **ISS-054** — List endpoint: return only links owned by the current user — BR-OWN-003
- [ ] **ISS-055** — Edit endpoint: update `original_url` and/or `short_code` for owned links — BR-OWN-004, BR-OWN-006
- [ ] **ISS-056** — Re-validate original URL and short code on edit — BR-URL-004, BR-OWN-007
- [ ] **ISS-057** — Delete endpoint: hard-delete owned link; code becomes reusable — BR-OWN-005, BR-OWN-008
- [ ] **ISS-058** — Deny edit/delete of links not owned by the user — BR-OWN-004, BR-OWN-005
- [ ] **ISS-059** — Do not expose anonymous links in management list — BR-OWN-009

---

## Epic 10 — Frontend public UX

- [ ] **ISS-060** — Home/create form: submit original URL
- [ ] **ISS-061** — Show validation errors for invalid/missing URLs
- [ ] **ISS-062** — Display resulting short URL and QR code after successful create
- [ ] **ISS-063** — Allow copying the short URL (optional UX nicety)
- [ ] **ISS-064** — Handle API/network errors gracefully on public create flow

---

## Epic 11 — Frontend management UX

- [ ] **ISS-065** — Management area accessible only when signed in (and authorized)
- [ ] **ISS-066** — Create form with optional custom short code field
- [ ] **ISS-067** — List owned short links
- [ ] **ISS-068** — Edit owned short link (original URL and/or short code)
- [ ] **ISS-069** — Delete owned short link with confirmation
- [ ] **ISS-070** — Surface conflict/validation errors for custom codes and reserved paths
- [ ] **ISS-071** — Redirect unauthenticated users to sign-in when accessing management

---

## Epic 12 — Integration, quality & acceptance

- [ ] **ISS-072** — End-to-end: anonymous create → redirect works
- [ ] **ISS-073** — End-to-end: QR encodes short URL and leads to same redirect
- [ ] **ISS-074** — End-to-end: `/v/{short_code}` shows short URL + QR; unknown code → not found
- [ ] **ISS-075** — End-to-end: authorized user login → custom code → list/edit/delete
- [ ] **ISS-076** — End-to-end: deleted code no longer redirects or previews
- [ ] **ISS-077** — Backend automated tests for URL validation, code generation, uniqueness, authZ, ownership
- [ ] **ISS-078** — Basic README: how to run with Docker Compose
- [ ] **ISS-079** — Final pass against product acceptance criteria in [spec.md](./spec/spec.md)

---

## Suggested implementation order

1. Epic 1 → Epic 2 (foundation + database)
2. Epic 3 → Epic 4 → Epic 5 → Epic 6 (backend public core)
3. Epic 7 + Epic 10 (preview + public UI)
4. Epic 8 → Epic 9 → Epic 11 (auth + management)
5. Epic 12 (integration and acceptance)

## Out of scope (do not open as project issues yet)

- Click analytics / dashboards
- Public self-registration and password recovery
- Bulk import/export
- Link expiration
- Rate limiting / abuse prevention policies
- Multi-tenant organizations
