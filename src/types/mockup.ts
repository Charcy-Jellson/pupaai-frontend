// =============================================================================
// Product Mockup Types
// =============================================================================

/**
 * Position and transformation of the logo on the product
 */
export interface LogoPosition {
  /** X position as percentage (0-100) of the canvas width */
  x: number;
  /** Y position as percentage (0-100) of the canvas height */
  y: number;
  /** Scale factor (0.1 to 3.0) */
  scale: number;
  /** Rotation angle in degrees (-180 to 180) */
  rotation: number;
}

/**
 * Defines the printable/editable area on a product template
 */
export interface PrintArea {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Width as percentage (0-100) */
  width: number;
  /** Height as percentage (0-100) */
  height: number;
}

/**
 * Product template configuration (for custom gallery images)
 */
export interface ProductTemplate {
  id: string;
  name: string;
  category: "apparel" | "accessories" | "bags" | "custom";
  imageUrl: string;
  thumbnailUrl?: string;
  printArea: PrintArea;
  description?: string;
}

// =============================================================================
// Color Types
// =============================================================================

/**
 * Color option for product color selection
 */
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

/**
 * Preset colors for product mockups
 */
export const PRESET_COLORS: ColorOption[] = [
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "black", name: "Black", hex: "#000000" },
  { id: "red", name: "Red", hex: "#EF4444" },
  { id: "blue", name: "Blue", hex: "#3B82F6" },
  { id: "green", name: "Green", hex: "#22C55E" },
  { id: "gray", name: "Gray", hex: "#6B7280" },
  { id: "navy", name: "Navy", hex: "#1E3A5F" },
  { id: "pink", name: "Pink", hex: "#EC4899" },
  { id: "yellow", name: "Yellow", hex: "#EAB308" },
  { id: "purple", name: "Purple", hex: "#A855F7" },
  { id: "orange", name: "Orange", hex: "#F97316" },
  { id: "brown", name: "Brown", hex: "#78350F" },
];

// =============================================================================
// Two-Phase Workflow Types
// =============================================================================

/**
 * Phase of the mockup generation workflow
 * - compose: Phase 1 - Select product, logo, position, generate first mockup
 * - recolor: Phase 2 - Confirm mockup looks good, select colors, batch recolor
 */
export type MockupPhase = "compose" | "recolor";

/**
 * Result status for batch generation
 */
export type MockupResultStatus = "pending" | "processing" | "fulfilled" | "rejected";

/**
 * Single mockup result in a batch
 */
export interface MockupResult {
  id: string;
  color: string;
  colorName: string;
  status: MockupResultStatus;
  imageDataUrl: string | null;
  error: string | null;
}

/**
 * State for the mockup editor (two-phase workflow)
 */
export interface MockupEditorState {
  // ========== Phase Tracking ==========
  /** Current workflow phase */
  phase: MockupPhase;
  
  // ========== Phase 1: Compose ==========
  /** Selected product image */
  productImage: string | null;
  productMimeType: string;
  /** Logo image to be applied */
  logoImage: string | null;
  logoMimeType: string;
  /** Current logo position and transformation */
  logoPosition: LogoPosition;
  /** First generated mockup (before color variants) */
  firstMockup: string | null;
  firstMockupMimeType: string;
  
  // ========== Phase 2: Recolor ==========
  /** Confirmed mockup that user approved (used as base for recoloring) */
  confirmedMockup: string | null;
  confirmedMockupMimeType: string;
  /** Selected colors for batch generation */
  selectedColors: ColorOption[];
  /** Generated mockup results (for batch recoloring) */
  results: MockupResult[];
  
  // ========== Processing State ==========
  /** Processing state */
  isProcessing: boolean;
  /** Number of mockups currently being generated */
  processingCount: number;
  /** Error message if any */
  error: string | null;
  
  // ========== Legacy/Template Support ==========
  /** Selected template (if using from gallery) */
  selectedTemplate: ProductTemplate | null;
}

/**
 * Request payload for mockup generation API
 */
export interface MockupGenerateRequest {
  product_image_base64: string;
  product_mime_type: string;
  logo_image_base64: string;
  logo_mime_type: string;
  logo_position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  target_color?: string; // Hex color to change product to
}

/**
 * Response from mockup generation API
 */
export interface MockupGenerateResponse {
  image_base64: string;
  mime_type: string;
}

// Default logo position (centered)
export const DEFAULT_LOGO_POSITION: LogoPosition = {
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
};
