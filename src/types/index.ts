export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: UserRole;
  createdAt: Date;
}

export interface ImageFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageOperation {
  id: string;
  type: "crop" | "resize" | "rotate" | "compress" | "extract-logo" | "remove-background" | "remove-logo";
  timestamp: Date;
  params?: Record<string, unknown>;
  resultUrl: string;
}

export interface ImageEditorState {
  originalImage: string | null;
  currentImage: string | null;
  mimeType: string;
  operations: ImageOperation[];
  isProcessing: boolean;
}

// Multi-image types for batch operations
export interface MultiImageItem {
  id: string;
  originalImage: string;
  currentImage: string;
  mimeType: string;
  fileName: string;
  operations: ImageOperation[];
  isProcessing: boolean;
  isSelected: boolean;
  error?: string; // Store error message if operation failed
}

export interface MultiImageEditorState {
  images: MultiImageItem[];
  activeImageId: string | null; // For single-image operations like Crop
  globalProcessing: boolean; // True when any batch operation is running
}

// Batch operation types
export type BatchOperationType = 
  | "rotate" 
  | "resize" 
  | "compress" 
  | "remove-background" 
  | "extract-logo" 
  | "remove-logo";

export interface BatchOperationParams {
  rotate?: { degrees: number };
  resize?: { width: number; height: number };
  compress?: { targetSizeKB: number };
  "remove-background"?: { modelId?: string };
  "extract-logo"?: { modelId?: string; removeBackground?: boolean };
  "remove-logo"?: { modelId?: string };
}

export interface BatchOperationResult {
  imageId: string;
  success: boolean;
  resultUrl?: string;
  error?: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export interface NavigationGroup {
  name: string;
  items: NavigationItem[];
  adminOnly?: boolean;
}




