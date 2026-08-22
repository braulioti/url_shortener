import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionUser } from "../auth/session.js";
import type { Locale } from "../i18n/index.js";
import { t } from "../i18n/index.js";
import { parseShortLinkListQuery } from "../short-links/list-query.js";
import { listShortLinksByOwner } from "../short-links/repository.js";
import { serializeShortLink } from "../short-links/serialize.js";
import { sendApiError, sendJson } from "./errors.js";

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

export async function handleListShortLinksRequest(
  req: IncomingMessage,
  res: ServerResponse,
  locale: Locale,
): Promise<void> {
  const session = getSessionUser(req);
  if (!session) {
    sendApiError(res, 401, "unauthorized", t(locale, "errors.unauthorized"));
    return;
  }

  const query = parseShortLinkListQuery(requestUrl(req).searchParams);
  const result = await listShortLinksByOwner(session.userId, query);

  sendJson(res, 200, {
    items: result.items.map(serializeShortLink),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });
}
