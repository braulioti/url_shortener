# URL Shortener

A simple URL shortener that turns a long URL into a compact short link and a QR code. Opening the short URL (or scanning the QR) redirects to the original destination. Authenticated users can choose custom short codes and manage their links.

## Stack

| Layer | Technology |
| --- | --- |
| Application (UI + API + redirect) | Node.js + TypeScript (single app) |
| Database | External PostgreSQL |
| Runtime | Docker Compose (app only) |

## Features

- Create short URLs anonymously (6-character codes: `a-z` / `0-9`)
- QR code for every short URL
- HTTP redirect from short URL to original URL
- Public preview page at `/v/{short_code}`
- Sign-in for pre-provisioned authorized users
- Custom short codes and CRUD for owned links

## Documentation

| Document | Description |
| --- | --- |
| [docs/spec/spec.md](docs/spec/spec.md) | Product specification |
| [docs/spec/business-rules.md](docs/spec/business-rules.md) | Business rules |
| [docs/spec/architecture.md](docs/spec/architecture.md) | Technical architecture |
| [docs/spec/database.md](docs/spec/database.md) | Database scripts definition |
| [docs/issues_checklist.md](docs/issues_checklist.md) | Implementation backlog |
| [CHANGELOG.md](CHANGELOG.md) | Project changelog |

## Project layout

```text
/
├── src/               # Single Node.js app (UI + API + redirect + QR)
│   ├── public/        # Static assets (CSS, etc.)
│   ├── views/         # HTML page templates
│   └── http/          # Request routing and static serving
├── db/                # PostgreSQL migrations and seeds
├── docs/              # Specs and checklists
├── docker/            # Dockerfile
├── docker-compose.yml # App service only (external DB)
├── .env.example
├── README.md
└── CHANGELOG.md
```

## Getting started

### Local (without Docker)

Requires Node.js 20+.

```bash
cp .env.example .env
npm install
npm run build
npm start
```

The server listens on `http://localhost:4000` by default (`PORT` in `.env`).  
`GET /health` returns `{ "status": "ok" }`.

For development with TypeScript auto-reload:

```bash
npm run dev
```

Type-check without emitting:

```bash
npm run typecheck
```

### Docker Compose

PostgreSQL is **not** started by Compose. Point `DB_*` in `.env` at your external database. From the app container on Docker Desktop, use `DB_HOST=host.docker.internal` to reach Postgres on the host machine.

```bash
cp .env.example .env
docker compose up --build -d
```

App: `http://localhost:4000` (or your `PORT`).  
Health: `GET /health`.

Stop:

```bash
docker compose down
```

## Continuous integration

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Event | Behavior |
| --- | --- |
| Push / PR on any branch other than deploy path | `npm` typecheck + build, Docker image build (no push) |
| Push to `main` (e.g. after merge) | Same build, then push image to Docker Hub |

### Docker Hub secrets

Configure repository secrets:

| Secret | Description |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (or password) |

Published tags on `main`:

- `{DOCKERHUB_USERNAME}/url-shortener:latest`
- `{DOCKERHUB_USERNAME}/url-shortener:{git-sha}`

## License

To be defined.
