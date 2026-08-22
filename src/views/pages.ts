import type { SessionUser } from "../auth/session.js";
import { config } from "../config.js";
import { resolveDisplayName } from "../branding/theme.js";
import type { Locale } from "../i18n/index.js";
import { createTranslator } from "../i18n/index.js";
import { adminRoutes, manageEditPath } from "../routes/paths.js";
import type { PaginatedShortLinks, ShortLinkRecord } from "../short-links/repository.js";
import {
  buildShortLinkListQueryString,
  type ParsedShortLinkListQuery,
  type ShortLinkSortField,
} from "../short-links/list-query.js";
import { buildShortUrl, qrCodeApiPath } from "../short-links/urls.js";
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

function linkFormErrorKey(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === "required") {
    return "errors.validationRequiredUrl";
  }
  if (error === "invalid") {
    return "errors.validationInvalidUrl";
  }
  if (error === "reserved") {
    return "errors.validationReservedShortCode";
  }
  if (error === "conflict") {
    return "errors.conflictShortCode";
  }
  if (error === "too_long") {
    return "errors.validationDescriptionTooLong";
  }
  if (error === "not_found") {
    return "errors.notFound";
  }
  return null;
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
  const displayName = resolveDisplayName(config.appDisplayName);

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
        <h1>${escapeHtml(displayName)}</h1>
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
  options: { error?: string | null; forced?: boolean } = {},
): string {
  const translate = createTranslator(locale);
  const errorKey = changePasswordErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";
  const forced = options.forced ?? false;
  const title = forced
    ? translate("changePassword.title")
    : translate("changePassword.menuTitle");
  const lede = forced
    ? translate("changePassword.lede")
    : translate("changePassword.voluntaryLede");
  const description = forced
    ? translate("changePassword.description")
    : translate("changePassword.voluntaryDescription");
  const backLink = forced
    ? ""
    : `<p><a href="${adminRoutes.manage}">${escapeHtml(translate("manage.backToList"))}</a></p>`;

  return renderLayout({
    page: "changePassword",
    locale,
    title,
    description,
    body: `
      <section class="page auth-page">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(lede)}</p>
        ${backLink}
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

export function renderManagePage(
  locale: Locale,
  session: SessionUser,
  options: {
    links: PaginatedShortLinks;
    query: ParsedShortLinkListQuery;
    error?: string | null;
  },
): string {
  const translate = createTranslator(locale);
  const { links, query } = options;

  const errorKey = linkFormErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "pt-BR" ? "pt-BR" : "en-US",
    { dateStyle: "short", timeStyle: "short" },
  );

  function manageUrl(nextQuery: ParsedShortLinkListQuery): string {
    return `${adminRoutes.manage}?${buildShortLinkListQueryString(nextQuery)}`;
  }

  function sortLink(field: ShortLinkSortField, label: string): string {
    const nextOrder =
      query.sortBy === field && query.sortOrder === "desc" ? "asc" : "desc";
    const href = manageUrl({
      ...query,
      page: 1,
      sortBy: field,
      sortOrder: nextOrder,
    });
    const indicator =
      query.sortBy === field
        ? query.sortOrder === "desc"
          ? " ↓"
          : " ↑"
        : "";
    return `<a href="${escapeHtml(href)}">${escapeHtml(label)}${indicator}</a>`;
  }

  const rowsHtml =
    links.items.length === 0
      ? `<tr><td colspan="6">${escapeHtml(translate("manage.emptyList"))}</td></tr>`
      : links.items
          .map((link) => {
            const shortUrl = buildShortUrl(link.short_code);
            const description = link.description ?? translate("manage.noDescription");
            const editPath = manageEditPath(link.id);
            const deletePath = `/admin/manage/delete/${link.id}`;
            const deleteConfirm = translate("manage.deleteConfirm").replace(/'/g, "\\'");
            return `
              <tr>
                <td><code>${escapeHtml(link.short_code)}</code></td>
                <td class="text-cell" title="${escapeHtml(description)}">${escapeHtml(description)}</td>
                <td class="url-cell">
                  <a href="${escapeHtml(shortUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortUrl)}</a>
                </td>
                <td class="url-cell" title="${escapeHtml(link.original_url)}">${escapeHtml(link.original_url)}</td>
                <td>${escapeHtml(dateFormatter.format(link.created_at))}</td>
                <td class="actions-cell">
                  <a href="${escapeHtml(editPath)}">${escapeHtml(translate("manage.edit"))}</a>
                  <form method="post" action="${escapeHtml(deletePath)}" class="inline-form" onsubmit="return confirm('${deleteConfirm}')">
                    <button type="submit" class="link-button">${escapeHtml(translate("manage.delete"))}</button>
                  </form>
                </td>
              </tr>
            `;
          })
          .join("");

  const paginationHtml =
    links.totalPages > 1
      ? `
        <nav class="pagination" aria-label="${escapeHtml(translate("manage.paginationLabel"))}">
          ${
            query.page > 1
              ? `<a href="${escapeHtml(manageUrl({ ...query, page: query.page - 1 }))}">${escapeHtml(translate("manage.paginationPrevious"))}</a>`
              : `<span class="pagination-disabled">${escapeHtml(translate("manage.paginationPrevious"))}</span>`
          }
          <span class="pagination-info">${escapeHtml(
            translate("manage.paginationInfo")
              .replace("{page}", String(query.page))
              .replace("{totalPages}", String(links.totalPages))
              .replace("{total}", String(links.total)),
          )}</span>
          ${
            query.page < links.totalPages
              ? `<a href="${escapeHtml(manageUrl({ ...query, page: query.page + 1 }))}">${escapeHtml(translate("manage.paginationNext"))}</a>`
              : `<span class="pagination-disabled">${escapeHtml(translate("manage.paginationNext"))}</span>`
          }
        </nav>
      `
      : links.total > 0
        ? `<p class="pagination-summary">${escapeHtml(
            translate("manage.totalLinks").replace("{total}", String(links.total)),
          )}</p>`
        : "";

  return renderLayout({
    page: "manage",
    locale,
    description: translate("manage.description"),
    body: `
      <section class="page manage-page">
        <h1>${escapeHtml(translate("manage.title"))}</h1>
        <p>${escapeHtml(translate("manage.signedInAs"))} <strong>${escapeHtml(session.username)}</strong></p>

        <section class="manage-create-section" aria-labelledby="manage-create-heading">
          <h2 id="manage-create-heading">${escapeHtml(translate("manage.createTitle"))}</h2>
          ${errorHtml}
          <form class="shorten-form manage-create-form" method="post" action="/api/short-links" novalidate>
            <label for="manage-original-url">${escapeHtml(translate("manage.urlLabel"))}</label>
            <input
              id="manage-original-url"
              name="originalUrl"
              type="url"
              inputmode="url"
              autocomplete="url"
              placeholder="${escapeHtml(translate("home.urlPlaceholder"))}"
              required
            />
            <label for="manage-description">${escapeHtml(translate("manage.descriptionLabel"))}</label>
            <input
              id="manage-description"
              name="description"
              type="text"
              maxlength="255"
              placeholder="${escapeHtml(translate("manage.descriptionPlaceholder"))}"
            />
            <label for="manage-short-code">${escapeHtml(translate("manage.shortCodeLabel"))}</label>
            <input
              id="manage-short-code"
              name="shortCode"
              type="text"
              maxlength="64"
              pattern="[A-Za-z0-9_-]+"
              placeholder="${escapeHtml(translate("manage.shortCodePlaceholder"))}"
            />
            <p class="hint">${escapeHtml(translate("manage.shortCodeHint"))}</p>
            <button type="submit">${escapeHtml(translate("manage.createSubmit"))}</button>
          </form>
        </section>

        <section class="link-list-section" aria-labelledby="manage-list-heading">
          <h2 id="manage-list-heading">${escapeHtml(translate("manage.listTitle"))}</h2>
          <div class="table-wrap">
            <table class="link-table">
              <thead>
                <tr>
                  <th scope="col">${sortLink("short_code", translate("manage.columnShortCode"))}</th>
                  <th scope="col">${sortLink("description", translate("manage.columnDescription"))}</th>
                  <th scope="col">${escapeHtml(translate("manage.columnShortUrl"))}</th>
                  <th scope="col">${escapeHtml(translate("manage.columnOriginalUrl"))}</th>
                  <th scope="col">${sortLink("created_at", translate("manage.columnCreatedAt"))}</th>
                  <th scope="col">${escapeHtml(translate("manage.columnActions"))}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
          ${paginationHtml}
        </section>

        <form method="post" action="${adminRoutes.signOut}" class="manage-sign-out">
          <button type="submit" class="button-secondary">${escapeHtml(translate("manage.signOut"))}</button>
        </form>
      </section>
    `,
  });
}

export function renderEditLinkPage(
  locale: Locale,
  session: SessionUser,
  options: {
    link: ShortLinkRecord;
    error?: string | null;
  },
): string {
  const translate = createTranslator(locale);
  const { link } = options;
  const errorKey =
    options.error === "invalid"
      ? "errors.validationInvalidShortCode"
      : linkFormErrorKey(options.error);
  const errorHtml = errorKey ? renderAlert(translate(errorKey)) : "";
  const editPath = manageEditPath(link.id);
  const shortUrl = buildShortUrl(link.short_code);

  const qrPreviewHtml = `
        <section class="result-card edit-qr-preview" aria-labelledby="edit-qr-heading">
          <h2 id="edit-qr-heading">${escapeHtml(translate("manage.qrPreviewTitle"))}</h2>
          <p><strong>${escapeHtml(translate("manage.columnShortUrl"))}</strong>
            <a href="${escapeHtml(shortUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortUrl)}</a>
          </p>
          <p><strong>${escapeHtml(translate("home.qrLabel"))}</strong></p>
          <img
            class="qr-image"
            src="${escapeHtml(qrCodeApiPath(link.short_code))}"
            width="256"
            height="256"
            alt="${escapeHtml(translate("home.qrAlt"))}"
          />
        </section>
      `;

  return renderLayout({
    page: "manage",
    locale,
    description: translate("manage.editDescription"),
    body: `
      <section class="page manage-page">
        <h1>${escapeHtml(translate("manage.editTitle"))}</h1>
        <p>${escapeHtml(translate("manage.signedInAs"))} <strong>${escapeHtml(session.username)}</strong></p>
        <p><a href="${adminRoutes.manage}">${escapeHtml(translate("manage.backToList"))}</a></p>

        <section class="manage-create-section" aria-labelledby="manage-edit-heading">
          <h2 id="manage-edit-heading">${escapeHtml(translate("manage.editTitle"))}</h2>
          ${errorHtml}
          <form class="shorten-form manage-create-form" method="post" action="${escapeHtml(editPath)}" novalidate>
            <label for="edit-short-code">${escapeHtml(translate("manage.shortCodeLabel"))}</label>
            <input
              id="edit-short-code"
              name="shortCode"
              type="text"
              maxlength="64"
              pattern="[A-Za-z0-9_-]+"
              value="${escapeHtml(link.short_code)}"
              required
            />
            <label for="edit-original-url">${escapeHtml(translate("manage.urlLabel"))}</label>
            <input
              id="edit-original-url"
              name="originalUrl"
              type="url"
              inputmode="url"
              autocomplete="url"
              value="${escapeHtml(link.original_url)}"
              required
            />
            <label for="edit-description">${escapeHtml(translate("manage.descriptionLabel"))}</label>
            <input
              id="edit-description"
              name="description"
              type="text"
              maxlength="255"
              value="${escapeHtml(link.description ?? "")}"
              placeholder="${escapeHtml(translate("manage.descriptionPlaceholder"))}"
            />
            <button type="submit">${escapeHtml(translate("manage.save"))}</button>
          </form>
        </section>
        ${qrPreviewHtml}
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
