# URL Shortener — Issues Checklist

Checklist of development issues derived from [spec.md](./spec/spec.md), [business-rules.md](./spec/business-rules.md), [architecture.md](./spec/architecture.md), and [database.md](./spec/database.md).

Use this as the backlog for implementing the project. Check items as they are completed.

---

## Epic 1 — Project foundation

- [x] **ISS-001** — Initialize repository layout (`src/`, `db/`, `docs/`, `docker/`)
- [x] **ISS-002** — Create single Node.js app scaffold (`package.json`, entrypoint, basic HTTP server in `src/`)
- [x] **ISS-003** — Implement the Node.js application with TypeScript (`tsconfig`, build/run scripts, convert `src/` to `.ts`)
- [x] **ISS-004** — Add UI shell within the same Node.js app (public pages served from `src/`)
- [ ] **ISS-005** — Add Dockerfile for the Node.js app under `docker/`
- [ ] **ISS-006** — Add `docker-compose.yml` with services `app` (Node.js) and `db` (PostgreSQL)
- [ ] **ISS-007** — Configure environment variables (DB credentials, ports, public base URL, auth secrets)
- [x] **ISS-008** — Add `.env.example` and ensure secrets are not committed
- [ ] **ISS-009** — Verify full stack starts with Docker Compose

---

## Epic 1b — Internationalization (i18n)

- [ ] **ISS-081** — Add i18n infrastructure (message catalogs / locale loader) with default locale `pt-BR`
- [ ] **ISS-082** — Provide `pt-BR` translations for all user-facing UI strings and messages
- [ ] **ISS-083** — Provide at least one additional locale (e.g. `en`) for the same string set
- [ ] **ISS-084** — Resolve active locale (user choice and/or request preference) with fallback to `pt-BR`
- [ ] **ISS-085** — Expose a language switcher (or equivalent) on public and authenticated UI
- [ ] **ISS-086** — Ensure missing keys fall back to `pt-BR` without breaking the page
- [ ] **ISS-087** — Localize validation and error messages shown to users

---

## Epic 2 — Database

- [ ] **ISS-010** — Create `db/migrations/001_create_users.sql` (`users` table)
- [ ] **ISS-011** — Create `db/migrations/002_create_short_links.sql` (`short_links` table)
- [ ] **ISS-012** — Ensure unique constraint on `short_links.short_code` and index on `owner_id`
- [ ] **ISS-013** — Wire migrations into Docker Postgres bootstrap (init mount or migrate step)
- [ ] **ISS-014** — Create `db/seeds/001_authorized_users.sql` with pre-provisioned authorized users (hashed passwords only)
- [ ] **ISS-015** — Document how to generate password hashes for seeds
- [ ] **ISS-016** — Verify schema and seed apply cleanly on a fresh Compose volume

---

## Epic 3 — App core infrastructure

- [ ] **ISS-017** — Connect the Node.js app to PostgreSQL (connection config + health check)
- [ ] **ISS-018** — Define API error response shape (validation, conflict, not found, unauthorized)
- [ ] **ISS-019** — Implement request validation helpers for URLs and short codes
- [ ] **ISS-020** — Define reserved path segments (`v`, auth, API, management, static)
- [ ] **ISS-021** — Configure public base URL usage for composing short URLs

---

## Epic 4 — Anonymous short links

- [ ] **ISS-022** — Validate original URL on create (required, absolute, `http`/`https`) — BR-URL-001, BR-URL-002
- [ ] **ISS-023** — Normalize original URL before persistence (trim) — BR-URL-003
- [ ] **ISS-024** — Generate random 6-character short codes (`a-z`, `0-9`) — BR-CODE-002–004
- [ ] **ISS-025** — Enforce uniqueness with collision retry (and safe retry limit) — BR-CODE-005, BR-CODE-006
- [ ] **ISS-026** — Persist anonymous `ShortLink` with `owner_id = NULL` — BR-OWN-002
- [ ] **ISS-027** — Expose `POST` API endpoint to create short links anonymously
- [ ] **ISS-028** — Return short URL (and related payload) to the client on success

---

## Epic 5 — QR code

- [ ] **ISS-029** — Generate QR code encoding the **short URL** (not original) — BR-QR-001, BR-QR-002
- [ ] **ISS-030** — Include QR in create response (image bytes, data URL, or dedicated endpoint)
- [ ] **ISS-031** — Regenerate QR when an authenticated user changes the short code — BR-QR-003

---

## Epic 6 — Redirect

- [ ] **ISS-032** — Implement short-code lookup and HTTP redirect to `original_url` — BR-RED-001, BR-RED-002
- [ ] **ISS-033** — Return not found for unknown / deleted short codes — BR-RED-003
- [ ] **ISS-034** — Ensure redirect route does not require authentication — BR-RED-005
- [ ] **ISS-035** — Enforce routing precedence: reserved routes and `/v/...` before short-code redirect — BR-ROUTE-*

---

## Epic 7 — Preview page

- [ ] **ISS-036** — Endpoint or data for preview by `short_code` (short URL + QR) — BR-PREV-002
- [ ] **ISS-037** — Return not found for unknown short codes on preview — BR-PREV-003
- [ ] **ISS-038** — Page at `/v/{short_code}` displaying short URL and QR — BR-PREV-001
- [ ] **ISS-039** — Ensure preview does **not** auto-redirect to the original URL — BR-PREV-005
- [ ] **ISS-040** — Ensure preview is publicly accessible — BR-PREV-004

---

## Epic 8 — Authentication & authorization

- [ ] **ISS-041** — Implement login with username + password against `users` — BR-AUTH-002
- [ ] **ISS-042** — Verify password against stored hash (never store plain text) — BR-AUTH-006
- [ ] **ISS-043** — Issue session or token after successful login
- [ ] **ISS-044** — Protect management endpoints (require authentication) — BR-AUTH-005
- [ ] **ISS-045** — Deny management actions for authenticated but unauthorized accounts — BR-AUTH-003, BR-AUTH-004
- [ ] **ISS-046** — Sign-in page for pre-provisioned users — BR-AUTH-001
- [ ] **ISS-047** — Persist and send auth credentials/token on management calls
- [ ] **ISS-048** — Implement logout (invalidate session / clear client auth state)

---

## Epic 9 — Authenticated short links & management (API)

- [ ] **ISS-049** — Allow authenticated authorized users to create links with custom short codes — BR-CODE-007
- [ ] **ISS-050** — Validate custom short codes (non-empty, no `/`, no whitespace, length/charset rules) — BR-CODE-010
- [ ] **ISS-051** — Reject custom codes that collide with reserved paths — BR-CODE-009
- [ ] **ISS-052** — Reject custom codes that already exist (conflict) — BR-CODE-008
- [ ] **ISS-053** — If authenticated user omits custom code, generate random 6-char code — BR-CODE-011
- [ ] **ISS-054** — Set `owner_id` on authenticated creates — BR-OWN-001
- [ ] **ISS-055** — List endpoint: return only links owned by the current user — BR-OWN-003
- [ ] **ISS-056** — Edit endpoint: update `original_url` and/or `short_code` for owned links — BR-OWN-004, BR-OWN-006
- [ ] **ISS-057** — Re-validate original URL and short code on edit — BR-URL-004, BR-OWN-007
- [ ] **ISS-058** — Delete endpoint: hard-delete owned link; code becomes reusable — BR-OWN-005, BR-OWN-008
- [ ] **ISS-059** — Deny edit/delete of links not owned by the user — BR-OWN-004, BR-OWN-005
- [ ] **ISS-060** — Do not expose anonymous links in management list — BR-OWN-009

---

## Epic 10 — Public UX

- [ ] **ISS-061** — Home/create form: submit original URL
- [ ] **ISS-062** — Show validation errors for invalid/missing URLs
- [ ] **ISS-063** — Display resulting short URL and QR code after successful create
- [ ] **ISS-064** — Allow copying the short URL (optional UX nicety)
- [ ] **ISS-065** — Handle API/network errors gracefully on public create flow

---

## Epic 11 — Management UX

- [ ] **ISS-066** — Management area accessible only when signed in (and authorized)
- [ ] **ISS-067** — Create form with optional custom short code field
- [ ] **ISS-068** — List owned short links
- [ ] **ISS-069** — Edit owned short link (original URL and/or short code)
- [ ] **ISS-070** — Delete owned short link with confirmation
- [ ] **ISS-071** — Surface conflict/validation errors for custom codes and reserved paths
- [ ] **ISS-072** — Redirect unauthenticated users to sign-in when accessing management

---

## Epic 12 — Integration, quality & acceptance

- [ ] **ISS-073** — End-to-end: anonymous create → redirect works
- [ ] **ISS-074** — End-to-end: QR encodes short URL and leads to same redirect
- [ ] **ISS-075** — End-to-end: `/v/{short_code}` shows short URL + QR; unknown code → not found
- [ ] **ISS-076** — End-to-end: authorized user login → custom code → list/edit/delete
- [ ] **ISS-077** — End-to-end: deleted code no longer redirects or previews
- [ ] **ISS-078** — Automated tests for URL validation, code generation, uniqueness, authZ, ownership
- [ ] **ISS-079** — Basic README: how to run with Docker Compose
- [ ] **ISS-080** — Final pass against product acceptance criteria in [spec.md](./spec/spec.md)
- [ ] **ISS-088** — End-to-end: default UI language is `pt-BR`; switching locale updates UI strings

---

## Suggested implementation order

1. Epic 1 → Epic 1b → Epic 2 (foundation + i18n + database)
2. Epic 3 → Epic 4 → Epic 5 → Epic 6 (public core)
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
