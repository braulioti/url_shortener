# URL Shortener

A simple URL shortener that turns a long URL into a compact short link and a QR code. Opening the short URL (or scanning the QR) redirects to the original destination. Authenticated users can choose custom short codes and manage their links.

## Stack

| Layer | Technology |
| --- | --- |
| Application (UI + API + redirect) | Node.js (single app) |
| Database | PostgreSQL |
| Runtime | Docker Compose |

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
├── db/                # PostgreSQL migrations and seeds
├── docs/              # Specs and checklists
├── docker/            # Dockerfile and Compose-related assets
├── README.md
└── CHANGELOG.md
```

## Getting started

Implementation is in progress. When the stack is ready, the expected local flow is:

1. Copy environment template (e.g. `.env.example` → `.env`) and fill in values
2. Start the stack with Docker Compose
3. Open the app URL published by Compose

Exact commands will be added here once Compose and the app scaffold exist.

## License

To be defined.
