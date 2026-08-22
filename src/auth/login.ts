import { findUserByUsername, toSessionUser } from "./users.js";
import { verifyPassword } from "./password.js";
import type { SessionUser } from "./session.js";

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid_credentials" | "unauthorized" };

export async function authenticateUser(
  username: string,
  password: string,
): Promise<LoginResult> {
  const user = await findUserByUsername(username.trim());

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (!user.authorized) {
    return { ok: false, reason: "unauthorized" };
  }

  return {
    ok: true,
    user: toSessionUser(user),
  };
}
