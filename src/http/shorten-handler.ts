import type { IncomingMessage, ServerResponse } from "node:http";
import { createAnonymousShortLink } from "../short-links/service.js";
import type { Locale } from "../i18n/index.js";
import { t } from "../i18n/index.js";
import { buildQrCodeUrl } from "../short-links/urls.js";
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

async function readOriginalUrl(req: IncomingMessage): Promise<string | null> {
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw.trim()) {
      return null;
    }
    const body = JSON.parse(raw) as { originalUrl?: string; url?: string };
    return body.originalUrl ?? body.url ?? null;
  }

  const form = await readFormBody(req);
  return form.get("originalUrl") ?? form.get("url");
}

function validationMessage(locale: Locale, error: "required" | "invalid"): string {
  return error === "required"
    ? t(locale, "errors.validationRequiredUrl")
    : t(locale, "errors.validationInvalidUrl");
}

export async function handleShortenRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
): Promise<void> {
  let originalUrl: string | null = null;

  try {
    originalUrl = await readOriginalUrl(req);
  } catch {
    sendApiError(
      res,
      400,
      "validation_error",
      t(locale, "errors.validationInvalidUrl"),
    );
    return;
  }

  const result = await createAnonymousShortLink(originalUrl);

  if (!result.ok) {
    if (result.error === "collision_limit") {
      sendApiError(res, 503, "internal_error", t(locale, "errors.shortCodeCollision"));
      return;
    }

    const message = validationMessage(locale, result.error);

    if (wantsHtmlResponse(req)) {
      res.writeHead(302, {
        Location: `/?error=${result.error}`,
      });
      res.end();
      return;
    }

    sendApiError(res, 400, "validation_error", message, {
      originalUrl: result.error,
    });
    return;
  }

  const payload = {
    shortCode: result.shortLink.short_code,
    shortUrl: result.shortUrl,
    originalUrl: result.shortLink.original_url,
    qrCodeUrl: buildQrCodeUrl(result.shortLink.short_code),
  };

  if (wantsHtmlResponse(req)) {
    const params = new URLSearchParams({
      shortCode: payload.shortCode,
      shortUrl: payload.shortUrl,
    });
    res.writeHead(302, { Location: `/?${params.toString()}` });
    res.end();
    return;
  }

  sendJson(res, 201, payload);
}
