import type { IncomingMessage, ServerResponse } from "node:http";
import {
  isLocale,
  localeCookie,
  resolveLocale,
  t,
  type Locale,
} from "../i18n/index.js";
import {
  renderHomePage,
  renderLoginPage,
  renderManagePage,
  renderNotFoundPage,
} from "../views/pages.js";
import { tryServeStatic } from "./static.js";

function sendHtml(res: ServerResponse, status: number, html: string): void {
  const body = Buffer.from(html, "utf8");
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
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

export function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = requestUrl(req);
  const pathname = url.pathname;
  const locale = resolveLocale(req, url);

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
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

  if (req.method === "GET" && pathname === "/") {
    sendHtml(res, 200, renderHomePage(locale));
    return;
  }

  if (req.method === "GET" && pathname === "/entrar") {
    sendHtml(res, 200, renderLoginPage(locale));
    return;
  }

  if (req.method === "GET" && pathname === "/gerenciar") {
    sendHtml(res, 200, renderManagePage(locale));
    return;
  }

  if (req.method === "POST" && pathname === "/api/shorten") {
    sendJson(res, 501, {
      error: "not_implemented",
      message: t(locale, "errors.shortenNotImplemented"),
    });
    return;
  }

  sendHtml(res, 404, renderNotFoundPage(locale));
}
