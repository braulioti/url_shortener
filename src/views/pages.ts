import type { Locale } from "../i18n/index.js";
import { createTranslator } from "../i18n/index.js";
import { escapeHtml } from "./html.js";
import { renderLayout } from "./layout.js";

export function renderHomePage(locale: Locale): string {
  const translate = createTranslator(locale);

  return renderLayout({
    page: "home",
    locale,
    description: translate("home.description"),
    body: `
      <section class="hero">
        <h1>${escapeHtml(translate("meta.brand"))}</h1>
        <p class="lede">${escapeHtml(translate("home.lede"))}</p>
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

export function renderLoginPage(locale: Locale): string {
  const translate = createTranslator(locale);

  return renderLayout({
    page: "login",
    locale,
    description: translate("login.description"),
    body: `
      <section class="page">
        <h1>${escapeHtml(translate("login.title"))}</h1>
        <p>${escapeHtml(translate("login.body"))}</p>
      </section>
    `,
  });
}

export function renderManagePage(locale: Locale): string {
  const translate = createTranslator(locale);

  return renderLayout({
    page: "manage",
    locale,
    description: translate("manage.description"),
    body: `
      <section class="page">
        <h1>${escapeHtml(translate("manage.title"))}</h1>
        <p>${escapeHtml(translate("manage.body"))}</p>
        <p><a href="/entrar">${escapeHtml(translate("manage.goToLogin"))}</a></p>
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
