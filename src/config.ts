import "dotenv/config";

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  return value === "true" || value === "1";
}

export const config = {
  port: Number(optional("PORT", "3000")),
  nodeEnv: optional("NODE_ENV", "development"),
  defaultLocale: optional("DEFAULT_LOCALE", "pt-BR"),
  publicBaseUrl: optional("PUBLIC_BASE_URL", "http://localhost:4000"),
  sessionSecret: optional("SESSION_SECRET", "dev-only-change-me"),
  allowExternalUserRegistration: optionalBoolean(
    "ALLOW_EXTERNAL_USER_REGISTRATION",
    false,
  ),
  db: {
    host: optional("DB_HOST", "localhost"),
    port: Number(optional("DB_PORT", "5432")),
    name: optional("DB_NAME", "url_shortener"),
    user: optional("DB_USER", "postgres"),
    password: optional("DB_PASSWORD", "postgres"),
  },
} as const;
