import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
import { config } from "../config.js";

export const DEFAULT_LOCALE = "pt-BR" as const;
export const SUPPORTED_LOCALES = ["pt-BR", "en-US"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type MessageTree = { [key: string]: string | MessageTree };

const catalogs: Record<Locale, MessageTree> = {
  "pt-BR": loadCatalog("pt-BR"),
  "en-US": loadCatalog("en-US"),
};

function loadCatalog(locale: Locale): MessageTree {
  const filePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    `${locale}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as MessageTree;
}

function lookup(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let current: string | MessageTree | undefined = tree;

  for (const part of parts) {
    if (current === undefined || typeof current === "string") {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return (
    value !== undefined &&
    value !== null &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** Translate a key; missing keys fall back to pt-BR, then to the key itself. */
export function t(locale: Locale, key: string): string {
  return (
    lookup(catalogs[locale], key) ??
    lookup(catalogs[DEFAULT_LOCALE], key) ??
    key
  );
}

export function createTranslator(locale: Locale): (key: string) => string {
  return (key: string) => t(locale, key);
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.split("=");
    const name = rawName?.trim();
    if (!name) {
      continue;
    }
    result[name] = decodeURIComponent(rest.join("=").trim());
  }
  return result;
}

function normalizeLocaleTag(tag: string): Locale | undefined {
  const trimmed = tag.trim();
  if (isLocale(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("pt")) {
    return "pt-BR";
  }
  if (lower.startsWith("en")) {
    return "en-US";
  }
  return undefined;
}

function localeFromAcceptLanguage(header: string | undefined): Locale | undefined {
  if (!header) {
    return undefined;
  }

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag?.trim() ?? "", q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const candidate of candidates) {
    const matched = normalizeLocaleTag(candidate.tag);
    if (matched) {
      return matched;
    }
  }

  return undefined;
}

function defaultLocaleFromConfig(): Locale {
  return isLocale(config.defaultLocale) ? config.defaultLocale : DEFAULT_LOCALE;
}

/**
 * Resolution order:
 * 1. `?lang=` query
 * 2. `locale` cookie
 * 3. `Accept-Language`
 * 4. `DEFAULT_LOCALE` / pt-BR
 */
export function resolveLocale(req: IncomingMessage, url: URL): Locale {
  const fromQuery = url.searchParams.get("lang");
  if (isLocale(fromQuery)) {
    return fromQuery;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (isLocale(cookies.locale)) {
    return cookies.locale;
  }

  const fromHeader = localeFromAcceptLanguage(req.headers["accept-language"]);
  if (fromHeader) {
    return fromHeader;
  }

  return defaultLocaleFromConfig();
}

export function localeCookie(locale: Locale): string {
  return `locale=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
