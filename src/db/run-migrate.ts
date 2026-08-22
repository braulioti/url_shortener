import "dotenv/config";
import { ensureDatabaseExists } from "./ensure-database.js";
import { runMigrations } from "./migrate.js";
import { pool } from "./pool.js";

async function main(): Promise<void> {
  await ensureDatabaseExists();
  await runMigrations();
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
