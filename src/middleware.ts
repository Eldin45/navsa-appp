// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// PUBLIC / SHARED PATH GROUPS
// ============================================================

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/unauthorized",
  "/forgot-password",
  "/reset-password",
  "/suppliers/apply",
  "/api/auth",
  "/api/suppliers/apply",
  "/_next",
  "/favicon.ico",
];

const SHARED_DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/wallet",
  "/dashboard/notifications",
  "/dashboard/profile",
];

const ROLE_DASHBOARD_ACCESS: Record<string, string[]> = {
  ADMIN: [
    "/dashboard/farmers",
    "/dashboard/farms",
    "/dashboard/farm-groups",
    "/dashboard/input-requests",
    "/dashboard/inputs",
    "/dashboard/inventory",
    "/dashboard/orders",
    "/dashboard/reports",
  ],
  ORG_ADMIN: [
    "/dashboard/farmers",
    "/dashboard/farms",
    "/dashboard/farm-groups",
    "/dashboard/input-requests",
    "/dashboard/inputs",
    "/dashboard/inventory",
    "/dashboard/orders",
    "/dashboard/reports",
  ],
  FARMER: [
    "/dashboard/farms",
    "/dashboard/inputs",
    "/dashboard/input-requests",
    "/dashboard/weather",
  ],
  SUPPLIER: ["/dashboard/inventory", "/dashboard/orders"],
};

// ============================================================
// HELPERS
// ============================================================

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isSharedDashboard(pathname: string): boolean {
  return SHARED_DASHBOARD_PATHS.some((p) =>
    p === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(p)
  );
}

function roleCanAccessDashboard(pathname: string, role: string): boolean {
  if (isSharedDashboard(pathname)) return true;
  if (pathname === "/dashboard") return true;
  const allowed = ROLE_DASHBOARD_ACCESS[role] ?? [];
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// ============================================================
// MIDDLEWARE — wrapped with withAuth (matches reference project)
// ============================================================

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // 1. Skip static assets
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.startsWith("/public") ||
      pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$/)
    ) {
      return NextResponse.next();
    }

    // 2. Public paths
    if (isPublic(pathname)) {
      return NextResponse.next();
    }

    // 3. Only gate /dashboard/* and /admin/*
    const isDashboard = pathname.startsWith("/dashboard");
    const isAdmin = pathname.startsWith("/admin");
    if (!isDashboard && !isAdmin) {
      return NextResponse.next();
    }

    // 4. No token → redirect to sign-in with callback
    if (!token) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string) ?? "";
    const knownRoles = [
      "SUPER_ADMIN",
      "PLATFORM_ADMIN",
      "ADMIN",
      "ORG_ADMIN",
      "FARMER",
      "SUPPLIER",
    ];

    if (!knownRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // 5. /admin/* — SUPER_ADMIN and PLATFORM_ADMIN only
    if (isAdmin) {
      if (role !== "SUPER_ADMIN" && role !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // 6. /dashboard/* — role-scoped (platform admins can view)
    if (isDashboard) {
      if (role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") {
        return NextResponse.next();
      }
      if (!roleCanAccessDashboard(pathname, role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Always return true so the middleware above handles all redirects
        return true;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};