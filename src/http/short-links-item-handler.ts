import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionUser } from "../auth/session.js";
import type { Locale } from "../i18n/index.js";
import { t } from "../i18n/index.js";
import {
  shortLinkErrorCode,
  shortLinkErrorMessage,
  shortLinkErrorStatus,
} from "../short-links/errors.js";
import { serializeShortLink } from "../short-links/serialize.js";
import {
  deleteOwnedShortLink,
  getOwnedShortLink,
  updateOwnedShortLink,
} from "../short-links/service.js";
import { readFormBody } from "./body.js";
import { sendApiError, sendJson } from "./errors.js";

function wantsHtmlResponse(req: IncomingMessage): boolean {
  const accept = req.headers.accept ?? "";
  const contentType = req.headers["content-type"] ?? "";
  return (
    accept.includes("text/html") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

async function readMutationPayload(req: IncomingMessage): Promise<{
  originalUrl: string | null;
  shortCode: string | null;
  description: string | null;
}> {
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw.trim()) {
      return { originalUrl: null, shortCode: null, description: null };
    }
    const body = JSON.parse(raw) as {
      originalUrl?: string;
      url?: string;
      shortCode?: string;
      description?: string;
    };
    return {
      originalUrl: body.originalUrl ?? body.url ?? null,
      shortCode: body.shortCode ?? null,
      description: body.description ?? null,
    };
  }

  const form = await readFormBody(req);
  return {
    originalUrl: form.get("originalUrl") ?? form.get("url"),
    shortCode: form.get("shortCode"),
    description: form.get("description"),
  };
}

function requireSession(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
) {
  const session = getSessionUser(req);
  if (!session) {
    sendApiError(res, 401, "unauthorized", t(locale, "errors.unauthorized"));
    return null;
  }
  return session;
}

export async function handleGetShortLinkRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
  linkId: number,
): Promise<void> {
  const session = requireSession(req, res, locale);
  if (!session) {
    return;
  }

  const result = await getOwnedShortLink(session.userId, linkId);
  if (!result.ok) {
    sendApiError(
      res,
      shortLinkErrorStatus(result.error),
      shortLinkErrorCode(result.error),
      shortLinkErrorMessage(locale, result.error),
    );
    return;
  }

  sendJson(res, 200, serializeShortLink(result.shortLink));
}

export async function handleUpdateShortLinkRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
  linkId: number,
  redirectLocation: string,
): Promise<void> {
  const session = requireSession(req, res, locale);
  if (!session) {
    return;
  }

  let payload: {
    originalUrl: string | null;
    shortCode: string | null;
    description: string | null;
  };
  try {
    payload = await readMutationPayload(req);
  } catch {
    sendApiError(
      res,
      400,
      "validation_error",
      t(locale, "errors.validationInvalidUrl"),
    );
    return;
  }

  const result = await updateOwnedShortLink(session.userId, linkId, payload);
  if (!result.ok) {
    if (wantsHtmlResponse(req)) {
      const params = new URLSearchParams({ error: result.error });
      res.writeHead(302, { Location: `${redirectLocation}?${params.toString()}` });
      res.end();
      return;
    }

    sendApiError(
      res,
      shortLinkErrorStatus(result.error),
      shortLinkErrorCode(result.error),
      shortLinkErrorMessage(locale, result.error),
    );
    return;
  }

  if (wantsHtmlResponse(req)) {
    res.writeHead(302, { Location: redirectLocation });
    res.end();
    return;
  }

  sendJson(res, 200, serializeShortLink(result.shortLink));
}

function sendNoContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

export async function handleDeleteShortLinkRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
  linkId: number,
  redirectLocation: string,
): Promise<void> {
  const session = requireSession(req, res, locale);
  if (!session) {
    return;
  }

  const result = await deleteOwnedShortLink(session.userId, linkId);
  if (!result.ok) {
    if (wantsHtmlResponse(req)) {
      const params = new URLSearchParams({ error: result.error });
      res.writeHead(302, { Location: `${redirectLocation}?${params.toString()}` });
      res.end();
      return;
    }

    sendApiError(
      res,
      shortLinkErrorStatus(result.error),
      shortLinkErrorCode(result.error),
      shortLinkErrorMessage(locale, result.error),
    );
    return;
  }

  if (wantsHtmlResponse(req)) {
    res.writeHead(302, { Location: redirectLocation });
    res.end();
    return;
  }

  sendNoContent(res);
}
