import type { IncomingMessage, ServerResponse } from "node:http";
import { tryServeStatic } from "./static.js";
import {
  renderHomePage,
  renderLoginPage,
  renderManagePage,
  renderNotFoundPage,
} from "../views/pages.js";

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

export function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const pathname = (req.url ?? "/").split("?")[0] ?? "/";

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (tryServeStatic(req, res)) {
    return;
  }

  if (req.method === "GET" && pathname === "/") {
    sendHtml(res, 200, renderHomePage());
    return;
  }

  if (req.method === "GET" && pathname === "/entrar") {
    sendHtml(res, 200, renderLoginPage());
    return;
  }

  if (req.method === "GET" && pathname === "/gerenciar") {
    sendHtml(res, 200, renderManagePage());
    return;
  }

  if (req.method === "POST" && pathname === "/api/shorten") {
    sendJson(res, 501, {
      error: "not_implemented",
      message: "A criação de links curtos será implementada em breve.",
    });
    return;
  }

  sendHtml(res, 404, renderNotFoundPage());
}
