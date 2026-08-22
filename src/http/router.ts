import type { IncomingMessage, ServerResponse } from "node:http";
import { checkDbConnection } from "../db/pool.js";
import {
  isLocale,
  localeCookie,
  resolveLocale,
  type Locale,
} from "../i18n/index.js";
import { isAdminPath } from "../routes/paths.js";
import { renderHomePage, renderNotFoundPage } from "../views/pages.js";
import { handleAdminRequest } from "./admin-router.js";
import { handleQrCodeRequest } from "./qr-handler.js";
import { handleShortCodeRedirect } from "./redirect-handler.js";
import { sendJson } from "./errors.js";
import { handleCreateShortLinkRequest } from "./short-links-create-handler.js";
import {
  handleDeleteShortLinkRequest,
  handleGetShortLinkRequest,
  handleUpdateShortLinkRequest,
} from "./short-links-item-handler.js";
import { handleListShortLinksRequest } from "./short-links-list-handler.js";
import { adminRoutes } from "../routes/paths.js";
import { handleShortenRequest } from "./shorten-handler.js";
import { tryServeStatic } from "./static.js";

function sendHtml(res: ServerResponse, status: number, html: string): void {
  const body = Buffer.from(html, "utf8");
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

function safeRedirectTarget(req: IncomingMessage): string {
  const referer = req.headers.referer;
  if (!referer) {
    return "/";
  }

  try {
    const refererUrl = new URL(referer);
    const host = req.headers.host;
    if (host && refererUrl.host === host) {
      return `${refererUrl.pathname}${refererUrl.search}` || "/";
    }
  } catch {
    return "/";
  }

  return "/";
}

function homePageOptions(url: URL): {
  error?: string | null;
  shortCode?: string;
  shortUrl?: string;
} {
  return {
    error: url.searchParams.get("error"),
    shortCode: url.searchParams.get("shortCode") ?? undefined,
    shortUrl: url.searchParams.get("shortUrl") ?? undefined,
  };
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = requestUrl(req);
  const pathname = url.pathname;
  const locale = resolveLocale(req, url);

  if (req.method === "GET" && pathname === "/health") {
    let db: "ok" | "error" = "error";
    try {
      db = (await checkDbConnection()) ? "ok" : "error";
    } catch {
      db = "error";
    }

    const status = db === "ok" ? 200 : 503;
    sendJson(res, status, { status: db === "ok" ? "ok" : "degraded", db });
    return;
  }

  if (tryServeStatic(req, res)) {
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/locale/")) {
    const requested = pathname.slice("/locale/".length);
    const nextLocale: Locale = isLocale(requested) ? requested : "pt-BR";
    res.writeHead(302, {
      Location: safeRedirectTarget(req),
      "Set-Cookie": localeCookie(nextLocale),
    });
    res.end();
    return;
  }

  if (isAdminPath(pathname) || pathname === "/entrar" || pathname === "/gerenciar") {
    const handled = await handleAdminRequest(
      req,
      res,
      pathname,
      locale,
      sendHtml,
    );
    if (handled) {
      return;
    }
  }

  if (req.method === "GET" && pathname === "/") {
    sendHtml(res, 200, renderHomePage(locale, homePageOptions(url)));
    return;
  }

  if (req.method === "POST" && pathname === "/api/shorten") {
    await handleShortenRequest(req, res, locale);
    return;
  }

  if (req.method === "GET" && pathname === "/api/short-links") {
    await handleListShortLinksRequest(req, res, locale);
    return;
  }

  if (req.method === "POST" && pathname === "/api/short-links") {
    await handleCreateShortLinkRequest(req, res, locale);
    return;
  }

  const shortLinkMatch = pathname.match(/^\/api\/short-links\/(\d+)$/);
  if (shortLinkMatch) {
    const linkId = Number.parseInt(shortLinkMatch[1]!, 10);
    if (req.method === "GET") {
      await handleGetShortLinkRequest(req, res, locale, linkId);
      return;
    }
    if (req.method === "PUT") {
      await handleUpdateShortLinkRequest(
        req,
        res,
        locale,
        linkId,
        adminRoutes.manage,
      );
      return;
    }
    if (req.method === "DELETE") {
      await handleDeleteShortLinkRequest(
        req,
        res,
        locale,
        linkId,
        adminRoutes.manage,
      );
      return;
    }
  }

  const qrMatch = pathname.match(/^\/api\/qr\/([^/]+)$/);
  if (req.method === "GET" && qrMatch) {
    await handleQrCodeRequest(res, decodeURIComponent(qrMatch[1]!), locale);
    return;
  }

  const redirectResult = await handleShortCodeRedirect(req, res, pathname);
  if (redirectResult === "redirected") {
    return;
  }
  if (redirectResult === "not_found") {
    sendHtml(res, 404, renderNotFoundPage(locale));
    return;
  }

  sendHtml(res, 404, renderNotFoundPage(locale));
}
