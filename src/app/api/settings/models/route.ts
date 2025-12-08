import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export type TaskType = "image_processing" | "video_processing" | "text_processing";
export type ProviderType = "gemini" | "openai";

export interface AIModel {
  id: string;
  provider: ProviderType;
  model_id: string;
  display_name: string;
  task_type: TaskType;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/settings/models
 * Get all AI models, optionally filtered by task_type, provider, active_only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get("task_type") as TaskType | null;
    const provider = searchParams.get("provider") as ProviderType | null;
    const activeOnly = searchParams.get("active_only") !== "false"; // default true

    let query = supabase.from("ai_models").select("*");

    if (taskType) {
      query = query.eq("task_type", taskType);
    }
    if (provider) {
      query = query.eq("provider", provider);
    }
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    query = query.order("task_type").order("provider").order("display_name");

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      models: data || [],
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/models
 * Create a new AI model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { provider, model_id, display_name, task_type, description, is_active = true } = body;

    // Validate required fields
    if (!provider || !model_id || !display_name || !task_type) {
      return NextResponse.json(
        { error: "Missing required fields: provider, model_id, display_name, task_type" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ai_models")
      .insert({
        provider,
        model_id,
        display_name,
        task_type,
        description,
        is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A model with this provider, model_id, and task_type already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    );
  }
}





