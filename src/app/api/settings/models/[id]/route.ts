import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, checkAdmin } from "@/lib/supabase-admin";

const supabase = supabaseAdmin();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/settings/models/[id]
 * Get a specific model by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Model not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json(
      { error: "Failed to fetch model" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/models/[id]
 * Update a specific model (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await checkAdmin();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { id } = await params;
    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.model_id !== undefined) updateData.model_id = body.model_id;
    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.task_type !== undefined) updateData.task_type = body.task_type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ai_models")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Model not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/models/[id]
 * Delete a specific model (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await checkAdmin();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { id } = await params;

    // Check if model exists
    const { data: existing } = await supabase
      .from("ai_models")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("ai_models")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    );
  }
}
