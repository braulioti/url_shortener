import http from "node:http";
import { config } from "./config.js";
import { initializeDatabase } from "./db/init.js";
import { handleRequest } from "./http/router.js";

async function main(): Promise<void> {
  await initializeDatabase();

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error: unknown) => {
      console.error("Request failed:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Internal Server Error");
      }
    });
  });

  server.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
