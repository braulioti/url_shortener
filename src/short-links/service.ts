import { generateUniqueShortCode } from "./code-generator.js";
import {
  deleteShortLinkForOwner,
  findShortLinkByIdForOwner,
  insertShortLink,
  shortCodeExists,
  shortCodeExistsForOtherLink,
  updateShortLinkForOwner,
  type ShortLinkRecord,
} from "./repository.js";
import { buildQrCodeUrl, buildShortUrl } from "./urls.js";
import {
  validateDescription,
  type DescriptionValidationError,
} from "../validation/description.js";
import {
  validateOptionalShortCode,
  validateShortCode,
  type ShortCodeValidationError,
} from "../validation/short-code.js";
import {
  validateOriginalUrl,
  type UrlValidationError,
} from "../validation/url.js";

export type ShortLinkMutationError =
  | UrlValidationError
  | DescriptionValidationError
  | ShortCodeValidationError
  | "collision_limit"
  | "conflict"
  | "not_found";

type ShortLinkSuccess = {
  ok: true;
  shortLink: ShortLinkRecord;
  shortUrl: string;
  qrCodeUrl: string;
};

export type CreateAnonymousShortLinkResult =
  | { ok: true; shortLink: ShortLinkRecord; shortUrl: string }
  | { ok: false; error: UrlValidationError }
  | { ok: false; error: "collision_limit" };

export type CreateOwnedShortLinkResult =
  | ShortLinkSuccess
  | { ok: false; error: ShortLinkMutationError };

export type UpdateOwnedShortLinkResult =
  | ShortLinkSuccess
  | { ok: false; error: ShortLinkMutationError };

export type DeleteOwnedShortLinkResult =
  | { ok: true }
  | { ok: false; error: "not_found" };

export type GetOwnedShortLinkResult =
  | { ok: true; shortLink: ShortLinkRecord }
  | { ok: false; error: "not_found" };

async function resolveShortCode(
  shortCodeInput: string | null | undefined,
): Promise<
  | { ok: true; value: string }
  | { ok: false; error: ShortCodeValidationError | "collision_limit" | "conflict" }
> {
  const validated = validateOptionalShortCode(shortCodeInput);
  if (!validated.ok) {
    return validated;
  }

  if (validated.value === null) {
    try {
      return { ok: true, value: await generateUniqueShortCode() };
    } catch {
      return { ok: false, error: "collision_limit" };
    }
  }

  if (await shortCodeExists(validated.value)) {
    return { ok: false, error: "conflict" };
  }

  return { ok: true, value: validated.value };
}

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
    description: null,
  });

  return {
    ok: true,
    shortLink,
    shortUrl: buildShortUrl(shortLink.short_code),
  };
}

export async function createOwnedShortLink(
  ownerId: number,
  originalUrlInput: string | null | undefined,
  descriptionInput?: string | null,
  shortCodeInput?: string | null,
): Promise<CreateOwnedShortLinkResult> {
  const validatedUrl = validateOriginalUrl(originalUrlInput);
  if (!validatedUrl.ok) {
    return validatedUrl;
  }

  const validatedDescription = validateDescription(descriptionInput);
  if (!validatedDescription.ok) {
    return validatedDescription;
  }

  const resolvedCode = await resolveShortCode(shortCodeInput);
  if (!resolvedCode.ok) {
    return resolvedCode;
  }

  const shortLink = await insertShortLink({
    shortCode: resolvedCode.value,
    originalUrl: validatedUrl.value,
    ownerId,
    description: validatedDescription.value,
  });

  return {
    ok: true,
    shortLink,
    shortUrl: buildShortUrl(shortLink.short_code),
    qrCodeUrl: buildQrCodeUrl(shortLink.short_code),
  };
}

export async function getOwnedShortLink(
  ownerId: number,
  linkId: number,
): Promise<GetOwnedShortLinkResult> {
  const shortLink = await findShortLinkByIdForOwner(linkId, ownerId);
  if (!shortLink) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true, shortLink };
}

export async function updateOwnedShortLink(
  ownerId: number,
  linkId: number,
  input: {
    originalUrl: string | null | undefined;
    shortCode: string | null | undefined;
    description?: string | null;
  },
): Promise<UpdateOwnedShortLinkResult> {
  const existing = await findShortLinkByIdForOwner(linkId, ownerId);
  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  const validatedUrl = validateOriginalUrl(input.originalUrl);
  if (!validatedUrl.ok) {
    return validatedUrl;
  }

  const validatedDescription = validateDescription(input.description);
  if (!validatedDescription.ok) {
    return validatedDescription;
  }

  const validatedCode = validateShortCode(input.shortCode);
  if (!validatedCode.ok) {
    return validatedCode;
  }

  if (
    validatedCode.value !== existing.short_code &&
    (await shortCodeExistsForOtherLink(validatedCode.value, linkId))
  ) {
    return { ok: false, error: "conflict" };
  }

  const shortLink = await updateShortLinkForOwner({
    linkId,
    ownerId,
    shortCode: validatedCode.value,
    originalUrl: validatedUrl.value,
    description: validatedDescription.value,
  });

  if (!shortLink) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    shortLink,
    shortUrl: buildShortUrl(shortLink.short_code),
    qrCodeUrl: buildQrCodeUrl(shortLink.short_code),
  };
}

export async function deleteOwnedShortLink(
  ownerId: number,
  linkId: number,
): Promise<DeleteOwnedShortLinkResult> {
  const deleted = await deleteShortLinkForOwner(linkId, ownerId);
  if (!deleted) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true };
}
