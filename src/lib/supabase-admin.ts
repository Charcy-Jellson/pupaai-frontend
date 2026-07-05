import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service_role key (bypasses RLS).
 *
 * NEVER import this into a client component.
 *
 * We intentionally do NOT fall back to the anon key: a missing service key
 * throws loudly instead of silently running every server route with public
 * (anon) privileges. Both `SUPABASE_SERVICE_ROLE_KEY` (canonical) and the
 * legacy `SUPABASE_SERVICE_KEY` name are accepted so existing deployments keep
 * working during the rename.
 */
export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin config: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service_role key)."
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

type AdminCheck = { userId: string } | { status: number; error: string };

/**
 * Resolve the current Clerk user and verify they have the `admin` role.
 *
 * Returns `{ userId }` on success, or `{ status, error }` describing the
 * 401/403 to return. Usage:
 *
 *   const admin = await checkAdmin();
 *   if ("error" in admin) {
 *     return NextResponse.json({ error: admin.error }, { status: admin.status });
 *   }
 */
export async function checkAdmin(): Promise<AdminCheck> {
  const { userId } = await auth();
  if (!userId) {
    return { status: 401, error: "Unauthorized" };
  }

  const { data, error } = await supabaseAdmin()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data || data.role !== "admin") {
    return { status: 403, error: "Forbidden - Admin access required" };
  }

  return { userId };
}
