import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, checkAdmin } from "@/lib/supabase-admin";

const ROLES = ["admin", "user"];
const TIERS = ["free", "plus", "pro", "premium", "business"];

/**
 * Admin-only user management. All operations write/read OTHER users' rows,
 * so they MUST run server-side with the service_role key (RLS would block a
 * normal user). Authorization is enforced by checkAdmin().
 */

// GET /api/admin/users — list all user_roles
export async function GET() {
  const admin = await checkAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await supabaseAdmin()
    .from("user_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}

// POST /api/admin/users — create/upsert a user's role (+ optional tier)
export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json().catch(() => ({}));
  const { user_id, role, tier } = body ?? {};

  if (!user_id || typeof user_id !== "string") {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (role && !ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${ROLES.join(", ")}` }, { status: 400 });
  }
  if (tier && !TIERS.includes(tier)) {
    return NextResponse.json({ error: `Invalid tier. Must be one of: ${TIERS.join(", ")}` }, { status: 400 });
  }

  const row: Record<string, unknown> = { user_id, role: role ?? "user" };
  if (tier) row.tier = tier;

  const { error } = await supabaseAdmin()
    .from("user_roles")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// PATCH /api/admin/users — update role and/or tier for a user
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json().catch(() => ({}));
  const { user_id, role, tier } = body ?? {};

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (role && !ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${ROLES.join(", ")}` }, { status: 400 });
  }
  if (tier && !TIERS.includes(tier)) {
    return NextResponse.json({ error: `Invalid tier. Must be one of: ${TIERS.join(", ")}` }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (role) update.role = role;
  if (tier) update.tier = tier;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update (provide role and/or tier)" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("user_roles")
    .update(update)
    .eq("user_id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users?user_id=... — remove a user's role record
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const userId = new URL(request.url).searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (userId === admin.userId) {
    return NextResponse.json({ error: "You cannot remove your own admin account" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
