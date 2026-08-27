import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isSuperAdminRole } from "@/lib/rbac";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;

    if (!isSuperAdminRole(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    "/godmode/:path*",
    "/api/admin/:path*",
    "/api/checkout/:path*",
  ],
};
