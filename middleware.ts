import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isSuperAdminRole } from "@/lib/rbac";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token?.role as string) || "USER";
    const pathname = req.nextUrl.pathname;

    // 1. Strict SUPER_ADMIN protection for Godmode UI & APIs
    if (
      (pathname.startsWith("/godmode") || pathname.startsWith("/api/godmode")) &&
      !isSuperAdminRole(role)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Staff/Agent Dashboard Access Guard
    if (
      pathname.startsWith("/agent") &&
      !["AGENT", "STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/agent", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/api/checkout")) {
          return true;
        }
        return Boolean(token);
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/godmode/:path*",
    "/api/godmode/:path*",
    "/agent/:path*",
  ],
};