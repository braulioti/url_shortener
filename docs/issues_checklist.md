# URL Shortener — Issues Checklist

Checklist of development issues derived from [spec.md](./spec/spec.md), [business-rules.md](./spec/business-rules.md), [architecture.md](./spec/architecture.md), and [database.md](./spec/database.md).

Use this as the backlog for implementing the project. Check items as they are completed.

---

## Epic 1 — Project foundation

- [x] **ISS-001** — Initialize repository layout (`src/`, `db/`, `docs/`, `docker/`)
- [x] **ISS-002** — Create single Node.js app scaffold (`package.json`, entrypoint, basic HTTP server in `src/`)
- [x] **ISS-003** — Implement the Node.js application with TypeScript (`tsconfig`, build/run scripts, convert `src/` to `.ts`)
- [x] **ISS-004** — Add UI shell within the same Node.js app (public pages served from `src/`)
- [x] **ISS-005** — Add Dockerfile for the Node.js app under `docker/`
- [x] **ISS-006** — Add `docker-compose.yml` with service `app` (Node.js); PostgreSQL is external (no `db` service)
- [x] **ISS-007** — Configure environment variables (DB credentials, ports, public base URL, auth secrets)
- [x] **ISS-008** — Add `.env.example` and ensure secrets are not committed
- [x] **ISS-009** — Verify app starts with Docker Compose

---

## Epic 1b — Internationalization (i18n)

- [x] **ISS-081** — Add i18n infrastructure (message catalogs / locale loader) with default locale `pt-BR`
- [x] **ISS-082** — Provide `pt-BR` translations for all user-facing UI strings and messages
- [x] **ISS-083** — Provide at least one additional locale (e.g. `en`) for the same string set
- [x] **ISS-084** — Resolve active locale (user choice and/or request preference) with fallback to `pt-BR`
- [x] **ISS-085** — Expose a language switcher (or equivalent) on public and authenticated UI
- [x] **ISS-086** — Ensure missing keys fall back to `pt-BR` without breaking the page
- [x] **ISS-087** — Localize validation and error messages shown to users

---

## Epic 2 — Database

- [x] **ISS-010** — Create `db/migrations/001_create_users.sql` (`users` table with `user_admin`)
- [x] **ISS-011** — Create `db/migrations/002_create_short_links.sql` (`short_links` table)
- [x] **ISS-012** — Ensure unique constraint on `short_links.short_code` and index on `owner_id`
- [x] **ISS-013** — Apply migrations to the external PostgreSQL (on app startup and `npm run migrate`)
- [x] **ISS-014** — Auto-create database if missing (`ensureDatabaseExists`) before migrations
- [x] **ISS-015** — Track applied migrations in `schema_migrations` (idempotent runner)
- [x] **ISS-016** — Bootstrap default admin user on startup (`admin`, `user_admin=true`, hashed password)

---

## Epic 2b — Login & user registration (UI)

All authenticated application routes live under the `/admin` prefix (e.g. `/admin/sign-in`, `/admin/sign-up`, `/admin/manage`). The short code `admin` is reserved and cannot be used for URLs.

- [x] **ISS-089** — Add `ALLOW_EXTERNAL_USER_REGISTRATION` env flag (`true` / `false`) in `config`, `.env.example`, and docs
- [x] **ISS-090** — Login page UI at `/admin/sign-in` (username + password form)
- [x] **ISS-091** — Login flow: authenticate against `users`, verify password hash, issue session cookie — BR-AUTH-002, BR-AUTH-006
- [x] **ISS-092** — User registration page UI at `/admin/sign-up` (username + password + confirmation)
- [x] **ISS-093** — Registration handler: create user with hashed password; external users get `authorized=true`, `user_admin=false`
- [x] **ISS-094** — When `ALLOW_EXTERNAL_USER_REGISTRATION=false`, hide registration link and return not found on `/admin/sign-up`
- [x] **ISS-095** — When `ALLOW_EXTERNAL_USER_REGISTRATION=true`, expose registration link from login page and allow `/admin/sign-up`
- [x] **ISS-096** — i18n for login and registration screens and validation errors (pt-BR + en-US)
- [x] **ISS-097** — Logout via `POST /admin/sign-out` clears session and returns to sign-in
- [x] **ISS-099** — Require password change on first login at `/admin/change-password` (`must_change_password` on new users)

---

## Epic 3 — App core infrastructure

- [x] **ISS-017** — Connect the Node.js app to PostgreSQL (connection config + health check)
- [x] **ISS-018** — Define API error response shape (validation, conflict, not found, unauthorized)
- [x] **ISS-019** — Implement request validation helpers for URLs and short codes
- [x] **ISS-020** — Define reserved path segments (`admin`, `v`, auth/API routes); block `admin` as short code — BR-CODE-009
- [x] **ISS-021** — Configure public base URL usage for composing short URLs

---

## Epic 4 — Anonymous short links

- [x] **ISS-022** — Validate original URL on create (required, absolute, `http`/`https`) — BR-URL-001, BR-URL-002
- [x] **ISS-023** — Normalize original URL before persistence (trim) — BR-URL-003
- [x] **ISS-024** — Generate random 6-character short codes (`a-z`, `0-9`) — BR-CODE-002–004
- [x] **ISS-025** — Enforce uniqueness with collision retry (and safe retry limit) — BR-CODE-005, BR-CODE-006
- [x] **ISS-026** — Persist anonymous `ShortLink` with `owner_id = NULL` — BR-OWN-002
- [x] **ISS-027** — Expose `POST` API endpoint to create short links anonymously
- [x] **ISS-028** — Return short URL (and related payload) to the client on success
- [x] **ISS-101** — Public redirect: `GET /{short_code}` looks up link and redirects to `original_url`; unknown codes → not found; no auth — BR-RED-001, BR-RED-002, BR-RED-003, BR-RED-005, BR-ROUTE-*

---

## Epic 5 — QR code

- [x] **ISS-029** — Generate QR code encoding the **short URL** (not original) — BR-QR-001, BR-QR-002
- [x] **ISS-030** — Include QR in create response (image bytes, data URL, or dedicated endpoint)
- [x] **ISS-031** — Regenerate QR when an authenticated user changes the short code — BR-QR-003 *(on-the-fly generation from current short URL)*

---

## Epic 6 — Redirect

Implemented in Epic 4 (**ISS-101**).

- [x] **ISS-032** — Implement short-code lookup and HTTP redirect to `original_url` — BR-RED-001, BR-RED-002
- [x] **ISS-033** — Return not found for unknown / deleted short codes — BR-RED-003
- [x] **ISS-034** — Ensure redirect route does not require authentication — BR-RED-005
- [x] **ISS-035** — Enforce routing precedence: reserved routes (`/admin/...`, `/v/...`) before short-code redirect — BR-ROUTE-*

---

## Epic 7 — Preview page

- [x] **ISS-036** — Endpoint or data for preview by `short_code` (short URL + QR) — BR-PREV-002
- [x] **ISS-037** — Return not found for unknown short codes on preview — BR-PREV-003
- [x] **ISS-038** — Page at `/v/{short_code}` displaying short URL and QR — BR-PREV-001
- [x] **ISS-039** — Ensure preview does **not** auto-redirect to the original URL — BR-PREV-005
- [x] **ISS-040** — Ensure preview is publicly accessible — BR-PREV-004

---

## Epic 8 — Authentication & authorization

- [x] **ISS-041** — Implement login with username + password against `users` — BR-AUTH-002
- [x] **ISS-042** — Verify password against stored hash (never store plain text) — BR-AUTH-006
- [x] **ISS-043** — Issue session cookie after successful login
- [ ] **ISS-044** — Protect management endpoints (require authentication) — BR-AUTH-005
- [ ] **ISS-045** — Deny management actions for authenticated but unauthorized accounts — BR-AUTH-003, BR-AUTH-004
- [x] **ISS-046** — Sign-in page at `/admin/sign-in` — BR-AUTH-001
- [ ] **ISS-047** — Persist and send auth credentials/token on management calls
- [x] **ISS-048** — Implement logout (`POST /admin/sign-out` clears session)

---

## Epic 9 — Authenticated short links & management (API)

- [x] **ISS-049** — Allow authenticated authorized users to create links with custom short codes — BR-CODE-007
- [x] **ISS-050** — Validate custom short codes (non-empty, no `/`, no whitespace, length/charset rules) — BR-CODE-010
- [x] **ISS-051** — Reject custom codes that collide with reserved paths (including `admin`) — BR-CODE-009
- [x] **ISS-052** — Reject custom codes that already exist (conflict) — BR-CODE-008
- [x] **ISS-053** — If authenticated user omits custom code, generate random 6-char code — BR-CODE-011
- [x] **ISS-054** — Set `owner_id` on authenticated creates — BR-OWN-001
- [x] **ISS-055** — List endpoint: return only links owned by the current user — BR-OWN-003
- [x] **ISS-056** — Edit endpoint: update `original_url` and/or `short_code` for owned links — BR-OWN-004, BR-OWN-006
- [x] **ISS-057** — Re-validate original URL and short code on edit — BR-URL-004, BR-OWN-007
- [x] **ISS-058** — Delete endpoint: hard-delete owned link; code becomes reusable — BR-OWN-005, BR-OWN-008
- [x] **ISS-059** — Deny edit/delete of links not owned by the user — BR-OWN-004, BR-OWN-005
- [x] **ISS-060** — Do not expose anonymous links in management list — BR-OWN-009
- [x] **ISS-102** — Paginated, sorted list of the authenticated user's short links (`GET /api/short-links` + management UI) — BR-OWN-003
- [x] **ISS-103** — Optional description field on owned short links (DB column, create API, management form and list) — BR-OWN-003

---

## Epic 10 — Public UX

- [ ] **ISS-061** — Home/create form: submit original URL
- [ ] **ISS-062** — Show validation errors for invalid/missing URLs
- [ ] **ISS-063** — Display resulting short URL and QR code after successful create
- [ ] **ISS-064** — Allow copying the short URL (optional UX nicety)
- [ ] **ISS-065** — Handle API/network errors gracefully on public create flow

---

## Epic 11 — Management UX

- [x] **ISS-066** — Management area at `/admin/manage` accessible only when signed in (and authorized)
- [x] **ISS-067** — Create form with optional custom short code field
- [x] **ISS-068** — List owned short links
- [x] **ISS-069** — Edit owned short link (original URL and/or short code)
- [x] **ISS-070** — Delete owned short link with confirmation
- [x] **ISS-071** — Surface conflict/validation errors for custom codes and reserved paths
- [x] **ISS-072** — Redirect unauthenticated users to `/admin/sign-in` when accessing management

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

## Epic 13 — Improvements

Optional UX and polish items after core features are stable.

- [ ] **ISS-098** — Replace language text links in the header with flag icons (pt-BR / en-US), keeping accessible labels and current locale selection behavior
- [ ] **ISS-100** — Allow branding via environment variables: configurable display name and primary/theme color (e.g. `APP_DISPLAY_NAME`, `APP_THEME_COLOR`), applied across public and admin UI

---

## Suggested implementation order

1. Epic 1 → Epic 1b → Epic 2 (foundation + i18n + database)
2. Epic 2b → Epic 3 (login/registration UI + app core)
3. Epic 4 → Epic 5 → Epic 6 (public core)
4. Epic 7 + Epic 10 (preview + public UI)
5. Epic 8 → Epic 9 → Epic 11 (auth backend overlap + management)
6. Epic 12 (integration and acceptance)
7. Epic 13 (improvements / polish)

## Out of scope (do not open as project issues yet)

- Click analytics / dashboards
- Password recovery flows
- Bulk import/export
- Link expiration
- Rate limiting / abuse prevention policies
- Multi-tenant organizations
