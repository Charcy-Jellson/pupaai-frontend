import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name
export const STORAGE_BUCKET = "pupa-ai-media";

// ==================== Types ====================

export type UserRole = "admin" | "user";
export type UserTier = "free" | "plus" | "pro" | "premium" | "business";

// Tier levels for comparison (higher = more access)
export const TIER_LEVELS: Record<UserTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  premium: 3,
  business: 4,
};

// Check if user has access to a feature requiring a certain tier
export function hasTierAccess(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

// ==================== User Role Functions ====================

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

export async function setUserRole(userId: string, role: UserRole, tier?: UserTier): Promise<boolean> {
  const updateData: { user_id: string; role: UserRole; tier?: UserTier } = {
    user_id: userId,
    role: role,
  };
  
  if (tier) {
    updateData.tier = tier;
  }

  const { error } = await supabase.from("user_roles").upsert(
    updateData,
    {
      onConflict: "user_id",
    }
  );

  return !error;
}

export async function updateUserTier(userId: string, tier: UserTier): Promise<boolean> {
  const { error } = await supabase
    .from("user_roles")
    .update({ tier })
    .eq("user_id", userId);

  return !error;
}

export async function updateUserRoleOnly(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from("user_roles")
    .update({ role })
    .eq("user_id", userId);

  return !error;
}

// ==================== Folder Functions ====================

export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null = null
): Promise<FolderRecord | null> {
  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: userId,
      name: name,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) {
    console.error("Create folder error:", error.message);
    return null;
  }

  return data as FolderRecord;
}

export async function getUserFolders(
  userId: string,
  parentId: string | null = null
): Promise<FolderRecord[]> {
  let query = supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId);

  if (parentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("Error fetching folders:", error);
    return [];
  }

  return data as FolderRecord[];
}

export async function getAllUserFolders(userId: string): Promise<FolderRecord[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching all folders:", error);
    return [];
  }

  return data as FolderRecord[];
}

export async function renameFolder(
  folderId: string,
  newName: string
): Promise<boolean> {
  const { error } = await supabase
    .from("folders")
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("id", folderId);

  if (error) {
    console.error("Rename folder error:", error.message);
    return false;
  }

  return true;
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  // Note: This will fail if folder has files due to FK constraint
  // You might want to handle moving/deleting files first
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    console.error("Delete folder error:", error.message);
    return false;
  }

  return true;
}

// ==================== File Functions ====================

// Helper to build storage path: users/{userId}/files/{fileId}/{originalFilename}
/**
 * Sanitize filename for Supabase Storage
 * Replaces spaces and special characters with safe alternatives
 */
function sanitizeFileName(fileName: string): string {
  // Get file extension
  const lastDot = fileName.lastIndexOf(".");
  const ext = lastDot > 0 ? fileName.slice(lastDot) : "";
  const name = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  
  // Replace spaces with underscores, remove special characters
  const sanitized = name
    .replace(/\s+/g, "_")           // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_\-]/g, "") // Remove special characters
    .slice(0, 100);                  // Limit length
  
  return sanitized + ext;
}

function buildStoragePath(userId: string, fileId: string, fileName: string): string {
  const safeFileName = sanitizeFileName(fileName);
  return `users/${userId}/files/${fileId}/${safeFileName}`;
}

export async function saveFile(
  userId: string,
  file: File,
  folderId: string | null = null,
  customFileName?: string,
  dimensions?: { width: number; height: number }
): Promise<FileRecord | null> {
  try {
    const rawFileName = customFileName || file.name;
    const fileName = sanitizeFileName(rawFileName); // Sanitize for storage compatibility
    
    // First create the database record to get the file ID
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        folder_id: folderId,
        name: fileName,
        storage_path: "", // Will update after upload
        mime_type: file.type,
        size: file.size,
        width: dimensions?.width || null,
        height: dimensions?.height || null,
      })
      .select()
      .single();

    if (dbError || !fileRecord) {
      console.error("Database error:", dbError?.message);
      throw new Error(`Database error: ${dbError?.message}`);
    }

    // Build storage path using the file ID
    const storagePath = buildStoragePath(userId, fileRecord.id, fileName);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      // Clean up the database record
      await supabase.from("files").delete().eq("id", fileRecord.id);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Update the storage path in the database
    const { data: updatedRecord, error: updateError } = await supabase
      .from("files")
      .update({ storage_path: storagePath })
      .eq("id", fileRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError.message);
      throw new Error(`Update failed: ${updateError.message}`);
    }

    return updatedRecord as FileRecord;
  } catch (err) {
    console.error("saveFile error:", err);
    return null;
  }
}

export async function getUserFiles(
  userId: string,
  folderId: string | null = null
): Promise<FileRecord[]> {
  let query = supabase
    .from("files")
    .select("*")
    .eq("user_id", userId);

  if (folderId === null) {
    query = query.is("folder_id", null);
  } else {
    query = query.eq("folder_id", folderId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching files:", error);
    return [];
  }

  return data as FileRecord[];
}

export async function getAllUserFiles(userId: string): Promise<FileRecord[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all files:", error);
    return [];
  }

  return data as FileRecord[];
}

export async function moveFile(
  fileId: string,
  newFolderId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from("files")
    .update({ folder_id: newFolderId })
    .eq("id", fileId);

  if (error) {
    console.error("Move file error:", error.message);
    return false;
  }

  return true;
}

export async function renameFile(
  fileId: string,
  newName: string
): Promise<boolean> {
  const { error } = await supabase
    .from("files")
    .update({ name: newName })
    .eq("id", fileId);

  if (error) {
    console.error("Rename file error:", error.message);
    return false;
  }

  return true;
}

export async function deleteFile(fileId: string, storagePath: string): Promise<boolean> {
  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    // Continue anyway to delete DB record
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("Database delete error:", dbError);
    return false;
  }

  return true;
}

// For PUBLIC bucket - direct URL access
export function getFileUrl(storagePath: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// For PRIVATE bucket - signed URL with expiration (more secure)
export async function getSignedFileUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn); // expires in seconds (default 1 hour)
  
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
}

// ==================== Helper Functions ====================

// Get image dimensions from a File object
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Save a file from a data URL (base64) to storage
 * Useful for saving generated/processed images
 */
export async function saveFileFromDataUrl(
  userId: string,
  dataUrl: string,
  fileName: string,
  folderId: string | null = null
): Promise<FileRecord | null> {
  try {
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a File object from the Blob
    const file = new File([blob], fileName, { type: blob.type });
    
    // Get image dimensions if it's an image
    let dimensions: { width: number; height: number } | undefined;
    if (blob.type.startsWith("image/")) {
      try {
        dimensions = await getImageDimensions(file);
      } catch (e) {
        // Continue without dimensions
      }
    }
    
    // Use the existing saveFile function
    return await saveFile(userId, file, folderId, fileName, dimensions);
  } catch (error) {
    console.error("saveFileFromDataUrl error:", error);
    return null;
  }
}
