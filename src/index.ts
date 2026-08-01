import http from "node:http";
import { config } from "./config.js";
import { handleRequest } from "./http/router.js";

const server = http.createServer(handleRequest);

server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
