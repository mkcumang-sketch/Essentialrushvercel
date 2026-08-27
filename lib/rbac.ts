export const SUPER_ADMIN_ROLE = "SUPER_ADMIN" as const;

export const EDGE_PROTECTED_MATCHERS = [
  "/godmode/:path*",
  "/api/admin/:path*",
  "/api/checkout/:path*",
] as const;

export function isSuperAdminRole(
  role: string | null | undefined
): boolean {
  return role === SUPER_ADMIN_ROLE;
}
