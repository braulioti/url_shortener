import type { IncomingMessage, ServerResponse } from "node:http";
import { findShortLinkByCode } from "../short-links/repository.js";
import { isReservedPathSegment } from "./reserved.js";

export type ShortCodeRedirectResult = "skip" | "not_found" | "redirected";

function extractShortCodeSegment(pathname: string): string | null {
  if (!pathname.startsWith("/") || pathname.length <= 1) {
    return null;
  }

  const segment = pathname.slice(1);
  if (segment.includes("/")) {
    return null;
  }

  return segment;
}

export async function handleShortCodeRedirect(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<ShortCodeRedirectResult> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return "skip";
  }

  const shortCode = extractShortCodeSegment(pathname);
  if (!shortCode) {
    return "skip";
  }

  if (isReservedPathSegment(shortCode)) {
    return "skip";
  }

  const shortLink = await findShortLinkByCode(shortCode);
  if (!shortLink) {
    return "not_found";
  }

  res.writeHead(302, { Location: shortLink.original_url });
  res.end();
  return "redirected";
}
