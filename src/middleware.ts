import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

// Protected dashboard paths and their required roles
const PROTECTED: Record<string, string[]> = {
  "/dashboard/admin": ["admin"],
  "/dashboard/counsellor": ["counsellor", "admin"],
  "/dashboard/client": ["client", "counsellor", "admin"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. API Rate Limiting: 5 requests per minute per IP ──
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const isCron =
      pathname.startsWith("/api/cron/") &&
      authHeader &&
      authHeader === `Bearer ${process.env.CRON_SECRET || "inspiria_cron_secret"}`;

    if (!isCron) {
      // Extract client IP address from proxy headers
      const forwardedFor = request.headers.get("x-forwarded-for");
      const clientIp =
        (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
        request.headers.get("x-real-ip") ||
        "global_api_client";

      const rateLimitKey = `api_${clientIp}`;
      const rate = checkRateLimit(rateLimitKey, 5, 60 * 1000); // 5 requests / 60 seconds

      if (!rate.success) {
        return NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Maximum 5 requests per minute allowed.",
            messageHi:
              "अनुरोध सीमा समाप्त: प्रति मिनट अधिकतम 5 अनुरोध अनुमत हैं। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
            retryAfterSeconds: rate.resetSeconds,
            status: 429,
          },
          {
            status: 429,
            headers: {
              "Retry-After": rate.resetSeconds.toString(),
              "X-RateLimit-Limit": rate.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rate.resetTime.toString(),
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Pass forward with rate limit transparency headers
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", rate.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rate.remaining.toString());
      response.headers.set("X-RateLimit-Reset", rate.resetTime.toString());
      return response;
    }
  }

  // ── 2. Role-Based Route Guards for Dashboards ──
  const requiredRoles = Object.entries(PROTECTED).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (requiredRoles) {
    const roleCookie = request.cookies.get("ic_user_role")?.value;
    if (!roleCookie || !requiredRoles.includes(roleCookie)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
