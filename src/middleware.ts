import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

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

// Check if the route is a sign-up route
const isSignUpRoute = (pathname: string) => {
  return pathname.includes("/sign-up");
};

// Routes that should skip i18n middleware (API routes, static files)
const isApiRoute = (pathname: string) => {
  return pathname.startsWith("/api/") || pathname.startsWith("/_next/");
};

// Check if registration is enabled by querying the database directly
// We use direct Supabase query to avoid circular API calls
async function checkRegistrationEnabled(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // If environment variables are not set, default to enabled
      return true;
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?key=eq.registration_enabled&select=value`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        // Cache for 60 seconds to reduce database calls
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return true; // Default to enabled on error
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return true; // Default to enabled if setting doesn't exist
    }

    const value = data[0]?.value;
    return value === true || value === "true";
  } catch (error) {
    console.error("Error checking registration status:", error);
    return true; // Default to enabled on error
  }
}

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

  // Check if trying to access sign-up page
  if (isSignUpRoute(pathname)) {
    const registrationEnabled = await checkRegistrationEnabled();
    
    if (!registrationEnabled) {
      // Extract locale from pathname (e.g., /en/sign-up -> en)
      const localeMatch = pathname.match(/^\/([a-z]{2})\//);
      const locale = localeMatch ? localeMatch[1] : "en";
      
      // Redirect to sign-in page
      const signInUrl = new URL(`/${locale}/sign-in`, req.url);
      return NextResponse.redirect(signInUrl);
    }
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
