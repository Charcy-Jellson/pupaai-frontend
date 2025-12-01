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
  type: "crop" | "resize" | "rotate" | "extract-logo" | "remove-background" | "remove-logo";
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


