/**
 * Logo Studio Type Definitions
 * 
 * Types for the creative logo generation and editing feature.
 */

// ============================================================================
// Logo Style Options
// ============================================================================

export type LogoStyle = "minimalist" | "vintage" | "modern" | "playful";

export const LOGO_STYLES: { id: LogoStyle; name: string; description: string }[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple, geometric shapes",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Retro feel, classic typography",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary, sleek, bold",
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, whimsical, colorful",
  },
];

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GenerateLogoRequest {
  description: string;
  style?: LogoStyle;
  colors?: string[];
}

export interface EditLogoRequest {
  image_base64: string;
  mime_type: string;
  instruction: string;
}

export interface LogoResponse {
  image_base64: string;
  mime_type: string;
  model_used?: string;
}

// ============================================================================
// Logo Studio State
// ============================================================================

export interface LogoHistoryItem {
  id: string;
  imageDataUrl: string;
  description?: string;
  instruction?: string;
  timestamp: number;
  type: "generated" | "edited";
}

export interface LogoStudioState {
  // Current logo
  currentLogo: string | null;
  currentMimeType: string;
  
  // Generation inputs
  description: string;
  selectedStyle: LogoStyle | null;
  selectedColors: string[];
  
  // Edit mode
  editInstruction: string;
  
  // Processing state
  isGenerating: boolean;
  isEditing: boolean;
  error: string | null;
  
  // History
  history: LogoHistoryItem[];
}

// ============================================================================
// Default State
// ============================================================================

export const DEFAULT_LOGO_STUDIO_STATE: LogoStudioState = {
  currentLogo: null,
  currentMimeType: "image/png",
  description: "",
  selectedStyle: null,
  selectedColors: [],
  editInstruction: "",
  isGenerating: false,
  isEditing: false,
  error: null,
  history: [],
};

// ============================================================================
// Preset Colors for Logo Generation
// ============================================================================

export const LOGO_PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFD700", // Gold
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#9B59B6", // Purple
  "#F39C12", // Orange
  "#1ABC9C", // Turquoise
  "#34495E", // Dark Gray
];

