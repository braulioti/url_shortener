import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { migrationsDir } from "./paths.js";
import { pool } from "./pool.js";

const MIGRATIONS_TABLE = "schema_migrations";

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function isMigrationApplied(filename: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE filename = $1
     ) AS exists`,
    [filename],
  );

  return result.rows[0]?.exists ?? false;
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const dir = migrationsDir();
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (await isMigrationApplied(file)) {
      continue;
    }

    const sql = readFileSync(path.join(dir, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
        [file],
      );
      await client.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
