import { config } from "../config.js";

export function buildShortUrl(shortCode: string): string {
  const base = config.publicBaseUrl.replace(/\/+$/, "");
  return `${base}/${shortCode}`;
}
