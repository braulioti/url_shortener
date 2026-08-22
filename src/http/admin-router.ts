import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateUser } from "../auth/login.js";
import {
  clearSessionCookie,
  createSessionToken,
  getSessionUser,
  sessionCookie,
  type SessionUser,
} from "../auth/session.js";
import { hashPassword } from "../auth/password.js";
import {
  createUser,
  findUserByUsername,
  toSessionUser,
  updateUserPassword,
} from "../auth/users.js";
import { config } from "../config.js";
import type { Locale } from "../i18n/index.js";
import { adminRoutes, manageEditPath, postAuthRedirect } from "../routes/paths.js";
import { parseShortLinkListQuery } from "../short-links/list-query.js";
import { listShortLinksByOwner } from "../short-links/repository.js";
import { getOwnedShortLink } from "../short-links/service.js";
import {
  renderChangePasswordPage,
  renderEditLinkPage,
  renderLoginPage,
  renderManagePage,
  renderNotFoundPage,
  renderSignUpPage,
} from "../views/pages.js";
import { readFormBody } from "./body.js";
import {
  handleDeleteShortLinkRequest,
  handleUpdateShortLinkRequest,
} from "./short-links-item-handler.js";

type HtmlResponder = (res: ServerResponse, status: number, html: string) => void;

function redirectWithSession(
  res: ServerResponse,
  user: SessionUser,
  location?: string,
): void {
  res.writeHead(302, {
    Location: location ?? postAuthRedirect(user),
    "Set-Cookie": sessionCookie(createSessionToken(user)),
  });
  res.end();
}

export async function handleAdminRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  locale: Locale,
  sendHtml: HtmlResponder,
): Promise<boolean> {
  if (pathname === "/admin") {
    res.writeHead(302, { Location: adminRoutes.signIn });
    res.end();
    return true;
  }

  if (pathname === "/entrar") {
    res.writeHead(301, { Location: adminRoutes.signIn });
    res.end();
    return true;
  }

  if (pathname === "/gerenciar") {
    res.writeHead(301, { Location: adminRoutes.manage });
    res.end();
    return true;
  }

  if (pathname === adminRoutes.signIn && req.method === "GET") {
    const error = new URL(req.url ?? adminRoutes.signIn, "http://localhost")
      .searchParams.get("error");
    sendHtml(res, 200, renderLoginPage(locale, { error }));
    return true;
  }

  if (pathname === adminRoutes.signIn && req.method === "POST") {
    const body = await readFormBody(req);
    const username = body.get("username") ?? "";
    const password = body.get("password") ?? "";
    const result = await authenticateUser(username, password);

    if (!result.ok) {
      res.writeHead(302, {
        Location: `${adminRoutes.signIn}?error=${result.reason}`,
      });
      res.end();
      return true;
    }

    redirectWithSession(res, result.user);
    return true;
  }

  if (pathname === adminRoutes.signOut && req.method === "POST") {
    res.writeHead(302, {
      Location: adminRoutes.signIn,
      "Set-Cookie": clearSessionCookie(),
    });
    res.end();
    return true;
  }

  if (pathname === adminRoutes.signUp && req.method === "GET") {
    if (!config.allowExternalUserRegistration) {
      sendHtml(res, 404, renderNotFoundPage(locale));
      return true;
    }

    const error = new URL(req.url ?? adminRoutes.signUp, "http://localhost")
      .searchParams.get("error");
    sendHtml(res, 200, renderSignUpPage(locale, { error }));
    return true;
  }

  if (pathname === adminRoutes.signUp && req.method === "POST") {
    if (!config.allowExternalUserRegistration) {
      sendHtml(res, 404, renderNotFoundPage(locale));
      return true;
    }

    const body = await readFormBody(req);
    const username = (body.get("username") ?? "").trim();
    const password = body.get("password") ?? "";
    const passwordConfirm = body.get("passwordConfirm") ?? "";

    if (!username || !password) {
      res.writeHead(302, {
        Location: `${adminRoutes.signUp}?error=validation`,
      });
      res.end();
      return true;
    }

    if (password !== passwordConfirm) {
      res.writeHead(302, {
        Location: `${adminRoutes.signUp}?error=password_mismatch`,
      });
      res.end();
      return true;
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      res.writeHead(302, {
        Location: `${adminRoutes.signUp}?error=username_taken`,
      });
      res.end();
      return true;
    }

    const user = await createUser({
      username,
      passwordHash: await hashPassword(password),
      authorized: true,
      userAdmin: false,
      mustChangePassword: true,
    });

    redirectWithSession(res, toSessionUser(user));
    return true;
  }

  if (pathname === adminRoutes.changePassword && req.method === "GET") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    if (!session.mustChangePassword) {
      res.writeHead(302, { Location: adminRoutes.manage });
      res.end();
      return true;
    }

    const error = new URL(
      req.url ?? adminRoutes.changePassword,
      "http://localhost",
    ).searchParams.get("error");
    sendHtml(res, 200, renderChangePasswordPage(locale, { error }));
    return true;
  }

  if (pathname === adminRoutes.changePassword && req.method === "POST") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    const body = await readFormBody(req);
    const password = body.get("password") ?? "";
    const passwordConfirm = body.get("passwordConfirm") ?? "";

    if (!password) {
      res.writeHead(302, {
        Location: `${adminRoutes.changePassword}?error=validation`,
      });
      res.end();
      return true;
    }

    if (password !== passwordConfirm) {
      res.writeHead(302, {
        Location: `${adminRoutes.changePassword}?error=password_mismatch`,
      });
      res.end();
      return true;
    }

    const updated = await updateUserPassword(
      session.userId,
      await hashPassword(password),
    );

    if (!updated) {
      res.writeHead(302, {
        Location: `${adminRoutes.changePassword}?error=update_failed`,
      });
      res.end();
      return true;
    }

    redirectWithSession(res, toSessionUser(updated), adminRoutes.manage);
    return true;
  }

  if (pathname === adminRoutes.manage && req.method === "GET") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    if (session.mustChangePassword) {
      res.writeHead(302, { Location: adminRoutes.changePassword });
      res.end();
      return true;
    }

    const manageUrl = new URL(req.url ?? adminRoutes.manage, "http://localhost");
    const query = parseShortLinkListQuery(manageUrl.searchParams);
    const links = await listShortLinksByOwner(session.userId, query);
    const error = manageUrl.searchParams.get("error");

    sendHtml(
      res,
      200,
      renderManagePage(locale, session, { links, query, error }),
    );
    return true;
  }

  const editMatch = pathname.match(/^\/admin\/manage\/edit\/(\d+)$/);
  if (editMatch && req.method === "GET") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    if (session.mustChangePassword) {
      res.writeHead(302, { Location: adminRoutes.changePassword });
      res.end();
      return true;
    }

    const linkId = Number.parseInt(editMatch[1]!, 10);
    const linkResult = await getOwnedShortLink(session.userId, linkId);
    if (!linkResult.ok) {
      sendHtml(res, 404, renderNotFoundPage(locale));
      return true;
    }

    const editUrl = new URL(req.url ?? manageEditPath(linkId), "http://localhost");
    sendHtml(
      res,
      200,
      renderEditLinkPage(locale, session, {
        link: linkResult.shortLink,
        error: editUrl.searchParams.get("error"),
      }),
    );
    return true;
  }

  if (editMatch && req.method === "POST") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    const linkId = Number.parseInt(editMatch[1]!, 10);
    await handleUpdateShortLinkRequest(
      req,
      res,
      locale,
      linkId,
      manageEditPath(linkId),
    );
    return true;
  }

  const deleteMatch = pathname.match(/^\/admin\/manage\/delete\/(\d+)$/);
  if (deleteMatch && req.method === "POST") {
    const session = getSessionUser(req);
    if (!session) {
      res.writeHead(302, { Location: adminRoutes.signIn });
      res.end();
      return true;
    }

    const linkId = Number.parseInt(deleteMatch[1]!, 10);
    await handleDeleteShortLinkRequest(
      req,
      res,
      locale,
      linkId,
      adminRoutes.manage,
    );
    return true;
  }

  if (pathname.startsWith("/admin/")) {
    sendHtml(res, 404, renderNotFoundPage(locale));
    return true;
  }

  return false;
}
