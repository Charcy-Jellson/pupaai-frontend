import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/settings/models/defaults
 * Get default model settings for all features
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get("task_type");

    let query = supabase
      .from("ai_default_models")
      .select("*, ai_models(*)");

    if (taskType) {
      query = query.eq("task_type", taskType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      defaults: data || [],
    });
  } catch (error) {
    console.error("Error fetching default models:", error);
    return NextResponse.json(
      { error: "Failed to fetch default models" },
      { status: 500 }
    );
  }
}

