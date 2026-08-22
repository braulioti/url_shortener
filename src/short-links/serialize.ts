import type { ShortLinkRecord } from "./repository.js";
import { buildQrCodeUrl, buildShortUrl } from "./urls.js";

export function serializeShortLink(link: ShortLinkRecord) {
  return {
    id: link.id,
    shortCode: link.short_code,
    shortUrl: buildShortUrl(link.short_code),
    originalUrl: link.original_url,
    description: link.description,
    qrCodeUrl: buildQrCodeUrl(link.short_code),
    createdAt: link.created_at.toISOString(),
    updatedAt: link.updated_at.toISOString(),
  };
}
