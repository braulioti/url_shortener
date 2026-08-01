import { renderLayout } from "./layout.js";

export function renderHomePage(): string {
  return renderLayout({
    page: "home",
    description:
      "Encurte qualquer URL válida, compartilhe o link curto e obtenha um QR Code.",
    body: `
      <section class="hero">
        <h1>Vortius</h1>
        <p class="lede">
          Transforme links longos em atalhos curtos com QR Code. Rápido para
          compartilhar, simples de lembrar.
        </p>
        <form class="shorten-form" method="post" action="/api/shorten" novalidate>
          <label for="original-url">URL original</label>
          <div class="field-row">
            <input
              id="original-url"
              name="originalUrl"
              type="url"
              inputmode="url"
              autocomplete="url"
              placeholder="https://exemplo.com/meu-link-muito-longo"
              required
            />
            <button type="submit">Encurtar</button>
          </div>
          <p class="hint">
            Visitantes podem encurtar sem conta. Códigos personalizados ficam na
            área autenticada.
          </p>
        </form>
      </section>
    `,
  });
}

export function renderLoginPage(): string {
  return renderLayout({
    page: "login",
    description: "Acesse a área de gerenciamento do Vortius.",
    body: `
      <section class="page">
        <h1>Entrar</h1>
        <p>
          Contas são provisionadas com antecedência. O formulário de autenticação
          será conectado nas próximas etapas.
        </p>
      </section>
    `,
  });
}

export function renderManagePage(): string {
  return renderLayout({
    page: "manage",
    description: "Gerencie seus links curtos no Vortius.",
    body: `
      <section class="page">
        <h1>Gerenciar links</h1>
        <p>
          Aqui você listará, editará e excluirá seus links. Esta área exigirá
          autenticação nas próximas etapas.
        </p>
        <p><a href="/entrar">Ir para Entrar</a></p>
      </section>
    `,
  });
}

export function renderNotFoundPage(): string {
  return renderLayout({
    page: "home",
    description: "Página não encontrada.",
    body: `
      <section class="page">
        <h1>Não encontrado</h1>
        <p>A página solicitada não existe.</p>
        <p><a href="/">Voltar ao início</a></p>
      </section>
    `,
  });
}
