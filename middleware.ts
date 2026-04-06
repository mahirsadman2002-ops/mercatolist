import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Protected dashboard routes
  const isDashboardRoute =
    pathname.startsWith("/my-listings") ||
    pathname.startsWith("/inquiries") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/saved-searches") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/public-profile") ||
    pathname.startsWith("/clients");

  // Protected admin routes
  const isAdminRoute = pathname.startsWith("/admin");

  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|og-default.jpg|icons).*)",
  ],
};
