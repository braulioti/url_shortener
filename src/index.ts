import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "./config.js";

function requestHandler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("URL Shortener");
}

const server = http.createServer(requestHandler);

server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
