import { pool } from "../db/pool.js";
import type { SessionUser } from "./session.js";

export type UserRecord = {
  id: number;
  username: string;
  password_hash: string;
  authorized: boolean;
  user_admin: boolean;
  must_change_password: boolean;
};

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    userId: user.id,
    username: user.username,
    authorized: user.authorized,
    userAdmin: user.user_admin,
    mustChangePassword: user.must_change_password,
  };
}

const userColumns = `id, username, password_hash, authorized, user_admin, must_change_password`;

export async function findUserByUsername(
  username: string,
): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT ${userColumns} FROM users WHERE username = $1`,
    [username],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT ${userColumns} FROM users WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createUser(input: {
  username: string;
  passwordHash: string;
  authorized?: boolean;
  userAdmin?: boolean;
  mustChangePassword?: boolean;
}): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (username, password_hash, authorized, user_admin, must_change_password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${userColumns}`,
    [
      input.username,
      input.passwordHash,
      input.authorized ?? true,
      input.userAdmin ?? false,
      input.mustChangePassword ?? true,
    ],
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string,
): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `UPDATE users
     SET password_hash = $1, must_change_password = false
     WHERE id = $2
     RETURNING ${userColumns}`,
    [passwordHash, userId],
  );

  return result.rows[0] ?? null;
}
