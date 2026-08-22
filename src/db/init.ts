import { ensureAdminUser } from "./bootstrap.js";
import { ensureDatabaseExists } from "./ensure-database.js";
import { checkDbConnection } from "./pool.js";
import { runMigrations } from "./migrate.js";

export async function initializeDatabase(): Promise<void> {
  await ensureDatabaseExists();
  await checkDbConnection();
  await runMigrations();
  await ensureAdminUser();
}
