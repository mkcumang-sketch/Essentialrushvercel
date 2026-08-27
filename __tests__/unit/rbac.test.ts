import {
  EDGE_PROTECTED_MATCHERS,
  SUPER_ADMIN_ROLE,
  isSuperAdminRole,
} from "@/lib/rbac";

describe("RBAC edge policy", () => {
  it("allows only SUPER_ADMIN", () => {
    expect(isSuperAdminRole(SUPER_ADMIN_ROLE)).toBe(true);
    expect(isSuperAdminRole("USER")).toBe(false);
    expect(isSuperAdminRole("ADMIN")).toBe(false);
    expect(isSuperAdminRole(undefined)).toBe(false);
    expect(isSuperAdminRole(null)).toBe(false);
  });

  it("protects godmode, admin APIs, and checkout APIs", () => {
    expect(EDGE_PROTECTED_MATCHERS).toEqual([
      "/godmode/:path*",
      "/api/admin/:path*",
      "/api/checkout/:path*",
    ]);
  });
});
