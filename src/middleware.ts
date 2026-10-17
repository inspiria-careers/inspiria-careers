import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected paths and their required roles
const PROTECTED: Record<string, string[]> = {
  "/dashboard/admin": ["admin"],
  "/dashboard/counsellor": ["counsellor", "admin"],
  "/dashboard/client": ["client", "counsellor", "admin"],
};

// Note: Firebase Auth token verification in Edge Runtime requires firebase-admin.
// For simplicity, we do a lightweight redirect check using a cookie set on login.
// Full server-side token verification should be added with firebase-admin if needed.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path needs protection
  const requiredRoles = Object.entries(PROTECTED).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (!requiredRoles) return NextResponse.next();

  // Check role cookie (set by client after login)
  const roleCookie = request.cookies.get("ic_user_role")?.value;

  if (!roleCookie || !requiredRoles.includes(roleCookie)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
