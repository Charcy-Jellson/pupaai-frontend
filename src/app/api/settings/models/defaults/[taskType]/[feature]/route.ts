import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, checkAdmin } from "@/lib/supabase-admin";

const supabase = supabaseAdmin();

interface RouteParams {
  params: Promise<{ taskType: string; feature: string }>;
}

/**
 * PUT /api/settings/models/defaults/[taskType]/[feature]
 * Set the default model for a specific feature (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await checkAdmin();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { taskType, feature } = await params;
    const body = await request.json();
    const { model_id } = body;

    if (!model_id) {
      return NextResponse.json(
        { error: "model_id is required" },
        { status: 400 }
      );
    }

    // Verify the model exists and matches the task type
    const { data: model, error: modelError } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", model_id)
      .eq("task_type", taskType)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or doesn't match the task type" },
        { status: 400 }
      );
    }

    // Upsert the default model setting
    const { data, error } = await supabase
      .from("ai_default_models")
      .upsert(
        {
          task_type: taskType,
          feature: feature,
          model_id: model_id,
        },
        {
          onConflict: "task_type,feature",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      task_type: taskType,
      feature: feature,
      model_id: model_id,
      model: model,
    });
  } catch (error) {
    console.error("Error setting default model:", error);
    return NextResponse.json(
      { error: "Failed to set default model" },
      { status: 500 }
    );
  }
}
