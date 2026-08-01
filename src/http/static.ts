import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export function tryServeStatic(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }

  const requestUrl = req.url ?? "/";
  const pathname = decodeURIComponent(requestUrl.split("?")[0] ?? "/");

  if (pathname.includes("\0") || pathname.includes("..")) {
    return false;
  }

  const relativePath =
    pathname === "/styles.css" ? "styles.css" : pathname.replace(/^\//, "");

  if (!relativePath || relativePath.endsWith("/")) {
    return false;
  }

  const filePath = path.normalize(path.join(publicDir, relativePath));
  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    return false;
  }

  const stats = statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }

  const ext = path.extname(filePath);
  const contentType = contentTypes[ext] ?? "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stats.size,
    "Cache-Control": "public, max-age=300",
  });

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}
