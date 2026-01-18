import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LANDING_PATH } from "@/lib/constants";

// Routes that require authentication
const protectedRoutes = ["/"];

// Routes that are public (no authentication required)
const publicRoutes = ["/p"];

// Routes that should redirect to default landing if already authenticated
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.get("has_refresh_token")?.value === "1";

  // Check if the route is public (explicitly allowed without auth)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Public routes bypass authentication check
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if the route is an auth route (login, etc.)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to default landing if accessing auth route while authenticated
  if (isAuthRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL(DEFAULT_LANDING_PATH, request.url));
  }

  // Redirect root to default landing page
  if (pathname === "/" && hasRefreshToken) {
    return NextResponse.redirect(new URL(DEFAULT_LANDING_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
