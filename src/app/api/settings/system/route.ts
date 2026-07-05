import { NextResponse } from "next/server";
import { supabaseAdmin, checkAdmin } from "@/lib/supabase-admin";

const supabase = supabaseAdmin();

// GET - Public endpoint to read system settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .eq("key", "registration_enabled")
      .single();

    if (error) {
      // Default to enabled if setting doesn't exist
      return NextResponse.json({ registration_enabled: true });
    }

    // Parse the JSONB value (stored as string 'true' or 'false')
    const registrationEnabled = data.value === true || data.value === "true";

    return NextResponse.json({ registration_enabled: registrationEnabled });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    // Default to enabled on error
    return NextResponse.json({ registration_enabled: true });
  }
}

// PATCH - Admin only endpoint to update system settings
export async function PATCH(request: Request) {
  try {
    const admin = await checkAdmin();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { registration_enabled } = body;

    if (typeof registration_enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body - registration_enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Upsert the setting
    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(
        {
          key: "registration_enabled",
          value: registration_enabled,
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      );

    if (upsertError) {
      console.error("Error updating system settings:", upsertError);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration_enabled
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
