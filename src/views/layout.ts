export type PageId = "home" | "login" | "manage";

const titles: Record<PageId, string> = {
  home: "Encurtador de URL",
  login: "Entrar",
  manage: "Gerenciar links",
};

export function renderLayout(options: {
  page: PageId;
  body: string;
  description?: string;
}): string {
  const title = titles[options.page];
  const description =
    options.description ??
    "Encurte links, gere QR Code e gerencie suas URLs.";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} · Vortius</title>
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
      <a class="brand" href="/">Vortius</a>
      <nav class="nav" aria-label="Principal">
        <a href="/"${ariaCurrent(options.page, "home")}>Encurtar</a>
        <a href="/gerenciar"${ariaCurrent(options.page, "manage")}>Gerenciar</a>
        <a href="/entrar"${ariaCurrent(options.page, "login")}>Entrar</a>
      </nav>
    </header>
    <main>
      ${options.body}
    </main>
    <footer class="site-footer">
      <p>Vortius · encurtador de URL · idioma padrão pt-BR</p>
    </footer>
  </body>
</html>`;
}

function ariaCurrent(current: PageId, page: PageId): string {
  return current === page ? ' aria-current="page"' : "";
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
