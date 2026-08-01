# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI: build on all branches; push image to Docker Hub on `main`
- Docker packaging: `docker/Dockerfile`, root `docker-compose.yml` (app only; external PostgreSQL) (ISS-005, ISS-006, ISS-009)
- Central `config` for env vars (port, locale, public URL, DB, session) (ISS-007)

### Changed

- Architecture/docs: PostgreSQL is external; Compose does not run a `db` service

## Version 0.1.0

### Added

- Public UI shell (home, login/manage stubs, static CSS) served from the Node app (ISS-004)
- TypeScript setup (`tsconfig.json`, build/dev scripts, `src/` in `.ts`) (ISS-003)
- Repository layout is a single Node.js app: `src/`, `db/`, `docs/`, `docker/`

### Docs
- Product specification (`docs/spec/spec.md`)
- Business rules (`docs/spec/business-rules.md`)
- Architecture document (`docs/spec/architecture.md`)
- Database scripts definition (`docs/spec/database.md`)
- Implementation issues checklist (`docs/issues_checklist.md`)
- Root `README.md` and `CHANGELOG.md`
