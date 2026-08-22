import type { ServerResponse } from "node:http";

export type ApiErrorCode =
  | "validation_error"
  | "conflict"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "internal_error"
  | "not_implemented";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
  details?: Record<string, string>;
};

export function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

export function sendApiError(
  res: ServerResponse,
  status: number,
  error: ApiErrorCode,
  message: string,
  details?: Record<string, string>,
): void {
  const payload: ApiErrorBody = { error, message };
  if (details) {
    payload.details = details;
  }
  sendJson(res, status, payload);
}
