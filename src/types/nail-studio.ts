// =============================================================================
// Nail Studio Types
// =============================================================================

/**
 * Active tab in the Nail Studio page
 */
export type NailStudioTab = "background" | "hand" | "video";

/**
 * Result status for each generation task
 */
export type NailStudioResultStatus = "pending" | "processing" | "fulfilled" | "rejected";

/**
 * Box option for background change: keep as-is, force with box, or force without box
 */
export type BoxOption = "keep_original" | "with_box" | "without_box";

// =============================================================================
// Nail Image
// =============================================================================

export interface NailImage {
  id: string;
  imageDataUrl: string;
  mimeType: string;
  name: string;
}

// =============================================================================
// Preset Image
// =============================================================================

export interface PresetImage {
  id: string;
  src: string;
  name: string;
  thumbnail: string;
}

// =============================================================================
// Preset Backgrounds
// =============================================================================

export const PRESET_BACKGROUNDS: PresetImage[] = [
  {
    id: "bg-fur-without-box",
    src: "/presets/nail-studio/backgrounds/fur-without-box.png",
    name: "Fur Background",
    thumbnail: "/presets/nail-studio/backgrounds/fur-without-box.png",
  },
  {
    id: "bg-fur-with-box",
    src: "/presets/nail-studio/backgrounds/fur-with-box.png",
    name: "Fur with Box",
    thumbnail: "/presets/nail-studio/backgrounds/fur-with-box.png",
  },
];

// =============================================================================
// Preset Hand Images
// =============================================================================

export const PRESET_HANDS: PresetImage[] = [
  {
    id: "hand-natural-01",
    src: "/presets/nail-studio/hands/natural-hands.png",
    name: "Natural Hands",
    thumbnail: "/presets/nail-studio/hands/natural-hands.png",
  },
];

// =============================================================================
// Nail Studio Result
// =============================================================================

export interface NailStudioResult {
  id: string;
  nailImageId: string;
  nailImageName: string;
  targetImageName: string;
  type: "background" | "hand";
  status: NailStudioResultStatus;
  imageDataUrl: string | null;
  error: string | null;
}

// =============================================================================
// Nail Studio State
// =============================================================================

export interface NailStudioState {
  activeTab: NailStudioTab;

  // Nail images (shared across tabs)
  nailImages: NailImage[];
  selectedNailId: string | null;

  // Background tab state
  backgroundImage: string | null;
  backgroundMimeType: string;
  backgroundName: string;
  boxOption: BoxOption;

  // Hand tab state
  handImage: string | null;
  handMimeType: string;
  handName: string;

  // Results
  results: NailStudioResult[];

  // Processing state
  isProcessing: boolean;
  processingCount: number;
  error: string | null;
}

// =============================================================================
// Constants
// =============================================================================

export const MAX_CONCURRENT_REQUESTS = 3;

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface ChangeNailBackgroundRequest {
  nail_image_base64: string;
  nail_mime_type: string;
  background_image_base64: string;
  background_mime_type: string;
  box_option: BoxOption;
}

export interface ApplyNailToHandRequest {
  nail_image_base64: string;
  nail_mime_type: string;
  hand_image_base64: string;
  hand_mime_type: string;
}

export interface NailStudioResponse {
  image_base64: string;
  mime_type: string;
  model_used?: string;
}
