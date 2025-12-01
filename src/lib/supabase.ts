import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = "admin" | "user";

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface ImageRecord {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return "user";
  }

  return data.role as UserRole;
}

export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: role,
    },
    {
      onConflict: "user_id",
    }
  );

  return !error;
}

export async function saveImage(
  userId: string,
  file: File,
  storagePath: string
): Promise<ImageRecord | null> {
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(storagePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  const { data, error } = await supabase
    .from("images")
    .insert({
      user_id: userId,
      file_name: file.name,
      storage_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    return null;
  }

  return data as ImageRecord;
}

export async function getUserImages(userId: string): Promise<ImageRecord[]> {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching images:", error);
    return [];
  }

  return data as ImageRecord[];
}

export async function deleteImage(imageId: string, storagePath: string): Promise<boolean> {
  const { error: storageError } = await supabase.storage
    .from("images")
    .remove([storagePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    return false;
  }

  const { error: dbError } = await supabase.from("images").delete().eq("id", imageId);

  if (dbError) {
    console.error("Database delete error:", dbError);
    return false;
  }

  return true;
}

export function getImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from("images").getPublicUrl(storagePath);
  return data.publicUrl;
}


