/**
 * Reserved single-segment paths that cannot be used as short codes.
 * The entire `/admin/...` tree is reserved for application routes (BR-CODE-009).
 */
export const RESERVED_SHORT_CODES = new Set([
  "admin",
  "v",
  "api",
  "health",
  "locale",
]);

export function isReservedShortCode(code: string): boolean {
  return RESERVED_SHORT_CODES.has(code.toLowerCase());
}

export function isReservedPathSegment(segment: string): boolean {
  return isReservedShortCode(segment);
}
