import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin";
const BCRYPT_ROUNDS = 10;

export async function ensureAdminUser(): Promise<void> {
  const existing = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE username = $1",
    [DEFAULT_ADMIN_USERNAME],
  );

  if ((existing.rowCount ?? 0) > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO users (username, password_hash, authorized, user_admin)
     VALUES ($1, $2, true, true)`,
    [DEFAULT_ADMIN_USERNAME, passwordHash],
  );

  console.log(
    `Default admin user created (username: ${DEFAULT_ADMIN_USERNAME})`,
  );
}
