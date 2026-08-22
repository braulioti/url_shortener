import type { Locale } from "../i18n/index.js";
import { createTranslator } from "../i18n/index.js";
import { escapeHtml } from "./html.js";

export type PageId = "home" | "login" | "manage";

const pageTitleKeys: Record<PageId, string> = {
  home: "home.title",
  login: "login.title",
  manage: "manage.title",
};

export function renderLayout(options: {
  page: PageId;
  locale: Locale;
  body: string;
  description?: string;
  title?: string;
}): string {
  const translate = createTranslator(options.locale);
  const pageTitle = options.title ?? translate(pageTitleKeys[options.page]);
  const description =
    options.description ?? translate("meta.defaultDescription");

  return `<!DOCTYPE html>
<html lang="${options.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)} · ${escapeHtml(translate("meta.titleSuffix"))}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/">${escapeHtml(translate("meta.brand"))}</a>
      <div class="header-actions">
        <nav class="nav" aria-label="${escapeHtml(translate("nav.ariaLabel"))}">
          <a href="/"${ariaCurrent(options.page, "home")}>${escapeHtml(translate("nav.shorten"))}</a>
          <a href="/gerenciar"${ariaCurrent(options.page, "manage")}>${escapeHtml(translate("nav.manage"))}</a>
          <a href="/entrar"${ariaCurrent(options.page, "login")}>${escapeHtml(translate("nav.login"))}</a>
        </nav>
        <nav class="lang-switcher" aria-label="${escapeHtml(translate("locale.ariaLabel"))}">
          <a
            href="/locale/pt-BR"
            hreflang="pt-BR"
            ${options.locale === "pt-BR" ? 'aria-current="true"' : ""}
          >${escapeHtml(translate("locale.ptBR"))}</a>
          <a
            href="/locale/en-US"
            hreflang="en-US"
            ${options.locale === "en-US" ? 'aria-current="true"' : ""}
          >${escapeHtml(translate("locale.enUS"))}</a>
        </nav>
      </div>
    </header>
    <main>
      ${options.body}
    </main>
    <footer class="site-footer">
      <p>${escapeHtml(translate("footer.text"))}</p>
    </footer>
  </body>
</html>`;
}

function ariaCurrent(current: PageId, page: PageId): string {
  return current === page ? ' aria-current="page"' : "";
}
