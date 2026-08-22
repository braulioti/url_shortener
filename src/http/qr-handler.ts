import type { ServerResponse } from "node:http";
import { t, type Locale } from "../i18n/index.js";
import { generateQrCodePng } from "../qr/generate.js";
import { findShortLinkByCode } from "../short-links/repository.js";
import { buildShortUrl } from "../short-links/urls.js";
import { sendApiError } from "./errors.js";

function sendPng(res: ServerResponse, body: Buffer): void {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": body.length,
    "Cache-Control": "public, max-age=86400",
  });
  res.end(body);
}

export async function handleQrCodeRequest(
  res: ServerResponse,
  shortCode: string,
  locale: Locale,
): Promise<void> {
  const shortLink = await findShortLinkByCode(shortCode);
  if (!shortLink) {
    sendApiError(res, 404, "not_found", t(locale, "errors.notFound"));
    return;
  }

  const png = await generateQrCodePng(buildShortUrl(shortLink.short_code));
  sendPng(res, png);
}
