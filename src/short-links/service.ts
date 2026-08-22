import { generateUniqueShortCode } from "./code-generator.js";
import { insertShortLink, type ShortLinkRecord } from "./repository.js";
import { buildShortUrl } from "./urls.js";
import {
  validateOriginalUrl,
  type UrlValidationError,
} from "../validation/url.js";

export type CreateAnonymousShortLinkResult =
  | {
      ok: true;
      shortLink: ShortLinkRecord;
      shortUrl: string;
    }
  | { ok: false; error: UrlValidationError }
  | { ok: false; error: "collision_limit" };

export async function createAnonymousShortLink(
  originalUrlInput: string | null | undefined,
): Promise<CreateAnonymousShortLinkResult> {
  const validated = validateOriginalUrl(originalUrlInput);
  if (!validated.ok) {
    return validated;
  }

  let shortCode: string;
  try {
    shortCode = await generateUniqueShortCode();
  } catch {
    return { ok: false, error: "collision_limit" };
  }

  const shortLink = await insertShortLink({
    shortCode,
    originalUrl: validated.value,
    ownerId: null,
  });

  return {
    ok: true,
    shortLink,
    shortUrl: buildShortUrl(shortLink.short_code),
  };
}
