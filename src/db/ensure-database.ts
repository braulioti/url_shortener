import pg from "pg";
import { config } from "../config.js";

const DB_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Creates the application database if it does not exist yet.
 * Connects to the default `postgres` database to run CREATE DATABASE.
 */
export async function ensureDatabaseExists(): Promise<void> {
  const { host, port, user, password, name } = config.db;

  if (!DB_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid DB_NAME for auto-create: ${name}`);
  }

  const adminPool = new pg.Pool({
    host,
    port,
    user,
    password,
    database: "postgres",
  });

  try {
    const existing = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );

    if ((existing.rowCount ?? 0) > 0) {
      return;
    }

    await adminPool.query(`CREATE DATABASE ${quoteIdent(name)}`);
    console.log(`Created database: ${name}`);
  } finally {
    await adminPool.end();
  }
}
