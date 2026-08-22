export const DESCRIPTION_MAX_LENGTH = 255;

export type DescriptionValidationError = "too_long";

export type DescriptionValidationResult =
  | { ok: true; value: string | null }
  | { ok: false; error: DescriptionValidationError };

export function normalizeDescription(
  input: string | null | undefined,
): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  const trimmed = input.trim();
  return trimmed === "" ? null : trimmed;
}

export function validateDescription(
  input: string | null | undefined,
): DescriptionValidationResult {
  const normalized = normalizeDescription(input);

  if (normalized !== null && normalized.length > DESCRIPTION_MAX_LENGTH) {
    return { ok: false, error: "too_long" };
  }

  return { ok: true, value: normalized };
}
