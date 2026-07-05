import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabase = supabaseAdmin();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Return default role if not found
      return NextResponse.json({ role: "user" });
    }

    return NextResponse.json({ role: data.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ role: "user" });
  }
}



