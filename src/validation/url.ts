export type UrlValidationError = "required" | "invalid";

export type UrlValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: UrlValidationError };

export function normalizeOriginalUrl(input: string): string {
  return input.trim();
}

export function validateOriginalUrl(
  input: string | null | undefined,
): UrlValidationResult {
  if (input === null || input === undefined || input.trim() === "") {
    return { ok: false, error: "required" };
  }

  const normalized = normalizeOriginalUrl(input);

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "invalid" };
    }
    return { ok: true, value: normalized };
  } catch {
    return { ok: false, error: "invalid" };
  }
}
