import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { config } from "../config.js";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  userId: number;
  username: string;
  authorized: boolean;
  userAdmin: boolean;
  mustChangePassword: boolean;
};

type SessionPayload = SessionUser & {
  exp: number;
};

function sign(data: string): string {
  return createHmac("sha256", config.sessionSecret)
    .update(data)
    .digest("base64url");
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.split("=");
    const name = rawName?.trim();
    if (!name) {
      continue;
    }
    result[name] = decodeURIComponent(rest.join("=").trim());
  }
  return result;
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const expected = sign(data);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      authorized: payload.authorized,
      userAdmin: payload.userAdmin,
      mustChangePassword: payload.mustChangePassword,
    };
  } catch {
    return null;
  }
}

export function getSessionUser(req: IncomingMessage): SessionUser | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }
  return parseSessionToken(token);
}

export function sessionCookie(token: string): string {
  const maxAgeSeconds = Math.floor(SESSION_MAX_AGE_MS / 1000);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
