import type { IncomingMessage } from "node:http";

export async function readFormBody(
  req: IncomingMessage,
): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}
