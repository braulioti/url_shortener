import path from "node:path";
import { fileURLToPath } from "node:url";

export function projectRoot(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function migrationsDir(): string {
  return path.join(projectRoot(), "db", "migrations");
}
