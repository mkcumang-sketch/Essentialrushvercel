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

    const res = NextResponse.next();

    // 3. Global Hardened Security Headers
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()"
    );

    return res;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Public API routes allow guest access
        if (
          pathname.startsWith("/api/checkout") ||
          pathname.startsWith("/api/myrio/customer") ||
          pathname.startsWith("/api/products")
        ) {
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
    "/account/:path*",
  ],
};