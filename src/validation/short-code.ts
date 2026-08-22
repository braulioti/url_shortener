import { isReservedShortCode } from "../http/reserved.js";

export const SHORT_CODE_MIN_LENGTH = 1;
export const SHORT_CODE_MAX_LENGTH = 64;
const SHORT_CODE_PATTERN = /^[a-z0-9_-]+$/;

export type ShortCodeValidationError =
  | "required"
  | "invalid"
  | "reserved";

export type ShortCodeValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: ShortCodeValidationError };

export function normalizeShortCode(input: string): string {
  return input.trim().toLowerCase();
}

export function validateShortCode(
  input: string | null | undefined,
): ShortCodeValidationResult {
  if (input === null || input === undefined || input.trim() === "") {
    return { ok: false, error: "required" };
  }

  const normalized = normalizeShortCode(input);

  if (
    normalized.length < SHORT_CODE_MIN_LENGTH ||
    normalized.length > SHORT_CODE_MAX_LENGTH ||
    !SHORT_CODE_PATTERN.test(normalized)
  ) {
    return { ok: false, error: "invalid" };
  }

  if (isReservedShortCode(normalized)) {
    return { ok: false, error: "reserved" };
  }

  return { ok: true, value: normalized };
}

export function validateOptionalShortCode(
  input: string | null | undefined,
): ShortCodeValidationResult | { ok: true; value: null } {
  if (input === null || input === undefined || input.trim() === "") {
    return { ok: true, value: null };
  }

  return validateShortCode(input);
}
