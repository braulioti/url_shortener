import type { SessionUser } from "../auth/session.js";
import { config } from "../config.js";
import type { Locale } from "../i18n/index.js";
import { createTranslator } from "../i18n/index.js";
import { adminRoutes } from "../routes/paths.js";
import { qrCodeApiPath } from "../short-links/urls.js";
import { escapeHtml } from "./html.js";
import { renderLayout } from "./layout.js";

function renderAlert(message: string): string {
  return `<p class="alert alert-error" role="alert">${escapeHtml(message)}</p>`;
}

function loginErrorKey(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === "invalid_credentials") {
    return "login.errors.invalidCredentials";
  }
  if (error === "unauthorized") {
    return "login.errors.unauthorized";
  }
  return "errors.notFound";
}

function signUpErrorKey(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === "validation") {
    return "signUp.errors.validation";
  }
  if (error === "password_mismatch") {
    return "signUp.errors.passwordMismatch";
  }
  if (error === "username_taken") {
    return "signUp.errors.usernameTaken";
  }
  return "errors.notFound";
}

function changePasswordErrorKey(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === "validation") {
    return "changePassword.errors.validation";
  }
  if (error === "password_mismatch") {
    return "changePassword.errors.passwordMismatch";
  }
  if (error === "update_failed") {
    return "changePassword.errors.updateFailed";
  }
  return "errors.notFound";
}

export function renderHomePage(
  locale: Locale,
  options: {
    error?: string | null;
    shortCode?: string;
    shortUrl?: string;
  } = {},
): string {
  const translate = createTranslator(locale);

  const errorKey =
    options.error === "required"
      ? "errors.validationRequiredUrl"
      : options.error === "invalid"
        ? "errors.validationInvalidUrl"
        : null;
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";

  const resultHtml =
    options.shortCode && options.shortUrl
      ? `
      <section class="result-card" aria-live="polite">
        <h2>${escapeHtml(translate("home.resultTitle"))}</h2>
        <p><strong>${escapeHtml(translate("home.shortUrlLabel"))}</strong>
          <a href="${escapeHtml(options.shortUrl)}">${escapeHtml(options.shortUrl)}</a>
        </p>
        <p><strong>${escapeHtml(translate("home.shortCodeLabel"))}</strong>
          <code>${escapeHtml(options.shortCode)}</code>
        </p>
        <p><strong>${escapeHtml(translate("home.qrLabel"))}</strong></p>
        <img
          class="qr-image"
          src="${escapeHtml(qrCodeApiPath(options.shortCode))}"
          width="256"
          height="256"
          alt="${escapeHtml(translate("home.qrAlt"))}"
        />
      </section>
    `
      : "";

  return renderLayout({
    page: "home",
    locale,
    description: translate("home.description"),
    body: `
      <section class="hero">
        <h1>${escapeHtml(translate("meta.brand"))}</h1>
        <p class="lede">${escapeHtml(translate("home.lede"))}</p>
        ${errorHtml}
        ${resultHtml}
        <form class="shorten-form" method="post" action="/api/shorten" novalidate>
          <label for="original-url">${escapeHtml(translate("home.urlLabel"))}</label>
          <div class="field-row">
            <input
              id="original-url"
              name="originalUrl"
              type="url"
              inputmode="url"
              autocomplete="url"
              placeholder="${escapeHtml(translate("home.urlPlaceholder"))}"
              required
            />
            <button type="submit">${escapeHtml(translate("home.submit"))}</button>
          </div>
          <p class="hint">${escapeHtml(translate("home.hint"))}</p>
        </form>
      </section>
    `,
  });
}

export function renderLoginPage(
  locale: Locale,
  options: { error?: string | null } = {},
): string {
  const translate = createTranslator(locale);
  const errorKey = loginErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";
  const signUpPrompt = config.allowExternalUserRegistration
    ? `<p class="hint">${escapeHtml(translate("login.noAccount"))} <a href="${adminRoutes.signUp}">${escapeHtml(translate("login.createAccount"))}</a></p>`
    : "";

  return renderLayout({
    page: "login",
    locale,
    description: translate("login.description"),
    body: `
      <section class="page auth-page">
        <h1>${escapeHtml(translate("login.title"))}</h1>
        <p>${escapeHtml(translate("login.lede"))}</p>
        ${errorHtml}
        <form class="auth-form" method="post" action="${adminRoutes.signIn}" novalidate>
          <label for="username">${escapeHtml(translate("login.usernameLabel"))}</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
          />
          <label for="password">${escapeHtml(translate("login.passwordLabel"))}</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
          <button type="submit">${escapeHtml(translate("login.submit"))}</button>
        </form>
        ${signUpPrompt}
      </section>
    `,
  });
}

export function renderSignUpPage(
  locale: Locale,
  options: { error?: string | null } = {},
): string {
  const translate = createTranslator(locale);
  const errorKey = signUpErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";

  return renderLayout({
    page: "signUp",
    locale,
    description: translate("signUp.description"),
    body: `
      <section class="page auth-page">
        <h1>${escapeHtml(translate("signUp.title"))}</h1>
        <p>${escapeHtml(translate("signUp.lede"))}</p>
        ${errorHtml}
        <form class="auth-form" method="post" action="${adminRoutes.signUp}" novalidate>
          <label for="signup-username">${escapeHtml(translate("signUp.usernameLabel"))}</label>
          <input
            id="signup-username"
            name="username"
            type="text"
            autocomplete="username"
            required
          />
          <label for="signup-password">${escapeHtml(translate("signUp.passwordLabel"))}</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
          />
          <label for="signup-password-confirm">${escapeHtml(translate("signUp.passwordConfirmLabel"))}</label>
          <input
            id="signup-password-confirm"
            name="passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
          />
          <button type="submit">${escapeHtml(translate("signUp.submit"))}</button>
        </form>
        <p class="hint">${escapeHtml(translate("signUp.haveAccount"))} <a href="${adminRoutes.signIn}">${escapeHtml(translate("signUp.signInLink"))}</a></p>
      </section>
    `,
  });
}

export function renderChangePasswordPage(
  locale: Locale,
  options: { error?: string | null } = {},
): string {
  const translate = createTranslator(locale);
  const errorKey = changePasswordErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";

  return renderLayout({
    page: "changePassword",
    locale,
    description: translate("changePassword.description"),
    body: `
      <section class="page auth-page">
        <h1>${escapeHtml(translate("changePassword.title"))}</h1>
        <p>${escapeHtml(translate("changePassword.lede"))}</p>
        ${errorHtml}
        <form class="auth-form" method="post" action="${adminRoutes.changePassword}" novalidate>
          <label for="new-password">${escapeHtml(translate("changePassword.passwordLabel"))}</label>
          <input
            id="new-password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
          />
          <label for="new-password-confirm">${escapeHtml(translate("changePassword.passwordConfirmLabel"))}</label>
          <input
            id="new-password-confirm"
            name="passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
          />
          <button type="submit">${escapeHtml(translate("changePassword.submit"))}</button>
        </form>
      </section>
    `,
  });
}

export function renderManagePage(locale: Locale, session: SessionUser): string {
  const translate = createTranslator(locale);

  return renderLayout({
    page: "manage",
    locale,
    description: translate("manage.description"),
    body: `
      <section class="page">
        <h1>${escapeHtml(translate("manage.title"))}</h1>
        <p>${escapeHtml(translate("manage.signedInAs"))} <strong>${escapeHtml(session.username)}</strong></p>
        <p>${escapeHtml(translate("manage.body"))}</p>
        <form method="post" action="${adminRoutes.signOut}">
          <button type="submit" class="button-secondary">${escapeHtml(translate("manage.signOut"))}</button>
        </form>
      </section>
    `,
  });
}

export function renderNotFoundPage(locale: Locale): string {
  const translate = createTranslator(locale);

  return renderLayout({
    page: "home",
    locale,
    title: translate("notFound.title"),
    description: translate("notFound.description"),
    body: `
      <section class="page">
        <h1>${escapeHtml(translate("notFound.title"))}</h1>
        <p>${escapeHtml(translate("notFound.body"))}</p>
        <p><a href="/">${escapeHtml(translate("notFound.backHome"))}</a></p>
      </section>
    `,
  });
}
