import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create a Supabase admin client that bypasses RLS
// This requires SUPABASE_SERVICE_KEY to be set
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration for webhook");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    const supabaseAdmin = createSupabaseAdmin();

    if (eventType === "user.created") {
      const { id } = evt.data;

      // Create user role record with defaults: role='user', tier='free'
      // Email and name are managed by Clerk, not stored here
      const { error } = await supabaseAdmin.from("user_roles").upsert(
        {
          user_id: id,
          role: "user",
          tier: "free",
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        console.error("Error creating user role:", error);
        return NextResponse.json(
          { error: "Failed to create user role" },
          { status: 500 }
        );
      }

      console.log(`✅ User ${id} added to user_roles table (role=user, tier=free)`);
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;

      if (id) {
        // Delete user role record
        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", id);

        if (error) {
          console.error("Error deleting user role:", error);
          return NextResponse.json(
            { error: "Failed to delete user role" },
            { status: 500 }
          );
        }

        console.log(`✅ User ${id} removed from user_roles table`);
      }
    }

    // Note: user.updated is not handled since email/name are managed by Clerk
    // Our user_roles table only stores role and tier which are admin-controlled

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

