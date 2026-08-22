import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionUser } from "../auth/session.js";
import type { Locale } from "../i18n/index.js";
import { t } from "../i18n/index.js";
import { adminRoutes } from "../routes/paths.js";
import {
  shortLinkErrorCode,
  shortLinkErrorMessage,
  shortLinkErrorStatus,
} from "../short-links/errors.js";
import { serializeShortLink } from "../short-links/serialize.js";
import { createOwnedShortLink } from "../short-links/service.js";
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

async function readCreatePayload(req: IncomingMessage): Promise<{
  originalUrl: string | null;
  description: string | null;
  shortCode: string | null;
}> {
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw.trim()) {
      return { originalUrl: null, description: null, shortCode: null };
    }
    const body = JSON.parse(raw) as {
      originalUrl?: string;
      url?: string;
      description?: string;
      shortCode?: string;
    };
    return {
      originalUrl: body.originalUrl ?? body.url ?? null,
      description: body.description ?? null,
      shortCode: body.shortCode ?? null,
    };
  }

  const form = await readFormBody(req);
  return {
    originalUrl: form.get("originalUrl") ?? form.get("url"),
    description: form.get("description"),
    shortCode: form.get("shortCode"),
  };
}

export async function handleCreateShortLinkRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
): Promise<void> {
  const session = getSessionUser(req);
  if (!session) {
    sendApiError(res, 401, "unauthorized", t(locale, "errors.unauthorized"));
    return;
  }

  let payload: {
    originalUrl: string | null;
    description: string | null;
    shortCode: string | null;
  };
  try {
    payload = await readCreatePayload(req);
  } catch {
    sendApiError(
      res,
      400,
      "validation_error",
      t(locale, "errors.validationInvalidUrl"),
    );
    return;
  }

  const result = await createOwnedShortLink(
    session.userId,
    payload.originalUrl,
    payload.description,
    payload.shortCode,
  );

  if (!result.ok) {
    if (wantsHtmlResponse(req)) {
      const params = new URLSearchParams({ error: result.error });
      res.writeHead(302, { Location: `${adminRoutes.manage}?${params.toString()}` });
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
    res.writeHead(302, { Location: adminRoutes.manage });
    res.end();
    return;
  }

  sendJson(res, 201, serializeShortLink(result.shortLink));
}
