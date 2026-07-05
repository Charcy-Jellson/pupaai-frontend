import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-only client (service_role, bypasses RLS). No anon fallback.
const supabase = supabaseAdmin();

interface UserColor {
  id: string;
  user_id: string;
  name: string;
  hex: string;
  created_at: string;
}

/**
 * GET /api/colors
 * Fetch all saved colors for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: colors, error } = await supabase
      .from("user_colors")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching user colors:", error);
      return NextResponse.json(
        { error: "Failed to fetch colors" },
        { status: 500 }
      );
    }

    return NextResponse.json({ colors: colors || [] });
  } catch (error) {
    console.error("Error in GET /api/colors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/colors
 * Save a new custom color for the current user
 * Body: { name: string, hex: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, hex } = body;

    // Validate input
    if (!name || !hex) {
      return NextResponse.json(
        { error: "Name and hex color are required" },
        { status: 400 }
      );
    }

    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(hex)) {
      return NextResponse.json(
        { error: "Invalid hex color format" },
        { status: 400 }
      );
    }

    // Check if color already exists for this user
    const { data: existing } = await supabase
      .from("user_colors")
      .select("id")
      .eq("user_id", userId)
      .eq("hex", hex.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This color already exists in your saved colors" },
        { status: 409 }
      );
    }

    // Insert new color
    const { data: newColor, error } = await supabase
      .from("user_colors")
      .insert({
        user_id: userId,
        name: name.trim(),
        hex: hex.toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving color:", error);
      // Provide more specific error messages
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Database table 'user_colors' does not exist. Please run the SQL migration." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to save color: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ color: newColor }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/colors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/colors
 * Delete a saved color by ID
 * Query params: ?id={colorId}
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const colorId = searchParams.get("id");

    if (!colorId) {
      return NextResponse.json(
        { error: "Color ID is required" },
        { status: 400 }
      );
    }

    // Delete the color (only if it belongs to the user)
    const { error } = await supabase
      .from("user_colors")
      .delete()
      .eq("id", colorId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting color:", error);
      return NextResponse.json(
        { error: "Failed to delete color" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/colors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

