# Database migrations

SQL migrations live in `migrations/`. They are applied automatically when the app starts, or manually with:

```bash
npm run migrate
```

Requires a reachable PostgreSQL instance and `DB_*` variables in `.env`.

If `DB_NAME` does not exist yet, the migrate command (and app startup) creates it automatically using a connection to the default `postgres` database.

## Files

| Migration | Purpose |
| --- | --- |
| `001_create_users.sql` | `users` table (`user_admin`, `authorized`, …) |
| `002_create_short_links.sql` | `short_links` table |
| `004_add_must_change_password.sql` | `must_change_password` flag on `users` |

Applied migrations are recorded in `schema_migrations`.
