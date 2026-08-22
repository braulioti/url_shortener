/** Application routes under the `/admin` prefix. */
export const adminRoutes = {
  signIn: "/admin/sign-in",
  signUp: "/admin/sign-up",
  signOut: "/admin/sign-out",
  changePassword: "/admin/change-password",
  manage: "/admin/manage",
} as const;

export function manageEditPath(linkId: number): string {
  return `/admin/manage/edit/${linkId}`;
}

export function postAuthRedirect(user: {
  mustChangePassword: boolean;
}): string {
  return user.mustChangePassword
    ? adminRoutes.changePassword
    : adminRoutes.manage;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
