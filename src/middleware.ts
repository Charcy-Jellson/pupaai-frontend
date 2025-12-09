import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

// Public routes that don't require authentication (with locale prefix)
const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/pricing",
  "/:locale/about",
  "/:locale/contact",
  "/:locale/privacy",
  "/:locale/terms",
  "/api(.*)",
]);

// Routes that should skip i18n middleware (API routes, static files)
const isApiRoute = (pathname: string) => {
  return pathname.startsWith("/api/") || pathname.startsWith("/_next/");
};

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip i18n middleware for API routes
  if (isApiRoute(pathname)) {
    // Still allow public access to webhooks and health endpoints
    if (pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/health")) {
      return;
    }
    // API routes don't need protection for frontend-to-API calls
    return;
  }

  // Handle internationalization for non-API routes
  const intlResponse = intlMiddleware(req);
  
  // If intl middleware returns a redirect, follow it
  if (intlResponse.headers.get("x-middleware-rewrite") || intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return intlResponse;
  }

  // Protect all other routes - this will redirect to sign-in if not authenticated
  await auth.protect();
  
  return intlResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
