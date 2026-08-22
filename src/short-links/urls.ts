import { config } from "../config.js";

export function buildShortUrl(shortCode: string): string {
  const base = config.publicBaseUrl.replace(/\/+$/, "");
  return `${base}/${shortCode}`;
}

export function buildQrCodeUrl(shortCode: string): string {
  const base = config.publicBaseUrl.replace(/\/+$/, "");
  return `${base}/api/qr/${encodeURIComponent(shortCode)}`;
}

export function qrCodeApiPath(shortCode: string): string {
  return `/api/qr/${encodeURIComponent(shortCode)}`;
}
