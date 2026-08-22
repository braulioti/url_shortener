import type { Locale } from "../i18n/index.js";
import { t } from "../i18n/index.js";
import type { DescriptionValidationError } from "../validation/description.js";
import type { ShortCodeValidationError } from "../validation/short-code.js";
import type { UrlValidationError } from "../validation/url.js";

export type ShortLinkServiceError =
  | UrlValidationError
  | DescriptionValidationError
  | ShortCodeValidationError
  | "collision_limit"
  | "conflict"
  | "not_found";

export function shortLinkErrorMessage(
  locale: Locale,
  error: ShortLinkServiceError,
): string {
  switch (error) {
    case "required":
      return t(locale, "errors.validationRequiredUrl");
    case "invalid":
      return t(locale, "errors.validationInvalidShortCode");
    case "reserved":
      return t(locale, "errors.validationReservedShortCode");
    case "conflict":
      return t(locale, "errors.conflictShortCode");
    case "too_long":
      return t(locale, "errors.validationDescriptionTooLong");
    case "collision_limit":
      return t(locale, "errors.shortCodeCollision");
    case "not_found":
      return t(locale, "errors.notFound");
    default:
      return t(locale, "errors.validationInvalidUrl");
  }
}

export function shortLinkErrorStatus(error: ShortLinkServiceError): number {
  if (error === "not_found") {
    return 404;
  }
  if (error === "conflict") {
    return 409;
  }
  if (error === "collision_limit") {
    return 503;
  }
  return 400;
}

export function shortLinkErrorCode(
  error: ShortLinkServiceError,
): "validation_error" | "conflict" | "not_found" | "internal_error" {
  if (error === "not_found") {
    return "not_found";
  }
  if (error === "conflict") {
    return "conflict";
  }
  if (error === "collision_limit") {
    return "internal_error";
  }
  return "validation_error";
}
