# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version 0.2.0

### Added

- Anonymous short link creation: URL validation, random 6-character codes, collision retry, `POST /api/shorten`, and home-page success feedback (Epic 4)
- Public redirect: `GET /{short_code}` resolves to the stored original URL (Epic 4, ISS-101)
- QR code generation encoding the short URL, `GET /api/qr/{short_code}` PNG endpoint, and `qrCodeUrl` in create response (Epic 5)
- Paginated, sorted list of owned short links via `GET /api/short-links` and `/admin/manage` (Epic 9, ISS-102)
- Optional description field on owned short links with `POST /api/short-links` (Epic 9, ISS-103)
- Full CRUD for owned short links: create (optional custom code), read, update, delete via API and `/admin/manage` UI (Epic 9 / Epic 11)
- Configurable branding via `APP_DISPLAY_NAME` and `APP_THEME_COLOR`; locale switcher with flag icons (Epic 13)
- API error response shape and URL validation helpers (Epic 3)
- Public base URL helper for composing short URLs (`PUBLIC_BASE_URL`)
- `users` table migration with `user_admin` flag; default admin user (`admin` / hashed password) created on startup
- `short_links` migration and tracked schema migrations (`schema_migrations`, `npm run migrate`)
- PostgreSQL connection pool, migrations on startup, and DB status in `/health`
- i18n with `src/i18n/pt-BR.json` and `en-US.json` (default `pt-BR`, language switcher, fallback) (Epic 1b)

## Version 0.1.0

### Added

- Public UI shell (home, login/manage stubs, static CSS) served from the Node app (ISS-004)
- TypeScript setup (`tsconfig.json`, build/dev scripts, `src/` in `.ts`) (ISS-003)
- Repository layout is a single Node.js app: `src/`, `db/`, `docs/`, `docker/`
- Architecture/docs: PostgreSQL is external; Compose does not run a `db` service
- GitHub Actions CI: build on all branches; push image to Docker Hub on `main`
- Docker packaging: `docker/Dockerfile`, root `docker-compose.yml` (app only; external PostgreSQL) (ISS-005, ISS-006, ISS-009)
- Central `config` for env vars (port, locale, public URL, DB, session) (ISS-007)

### Docs
- Product specification (`docs/spec/spec.md`)
- Business rules (`docs/spec/business-rules.md`)
- Architecture document (`docs/spec/architecture.md`)
- Database scripts definition (`docs/spec/database.md`)
- Implementation issues checklist (`docs/issues_checklist.md`)
- Root `README.md` and `CHANGELOG.md`
