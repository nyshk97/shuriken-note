import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LANDING_PATH } from "@/lib/constants";

// Routes that are public (no authentication required)
const publicRoutes = ["/p", "/articles"];

// Routes that should redirect to default landing if already authenticated
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.get("has_refresh_token")?.value === "1";

  // Check if the route is public (explicitly allowed without auth)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Public routes and root page bypass authentication check
  if (isPublicRoute || pathname === "/") {
    return NextResponse.next();
  }

  // Check if the route is an auth route (login, etc.)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAuthRoute) {
    // Redirect to default landing if already authenticated
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL(DEFAULT_LANDING_PATH, request.url));
    }
    // Allow unauthenticated users to access auth routes (login page, etc.)
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
