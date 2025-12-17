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
  { id: "blush", name: "Blush", hex: "#FDC6BF" },
  { id: "silver-gray", name: "Silver Gray", hex: "#C1C2C4" },
  { id: "cream", name: "Cream", hex: "#E8E2CC" },
  { id: "slate-blue", name: "Slate Blue", hex: "#4B526C" },
];

// =============================================================================
// Two-Phase Workflow Types
// =============================================================================

/**
 * Phase of the mockup generation workflow
 * - compose: Phase 1 - Select products, logo, position, generate previews
 * - preview: Phase 2 - Review previews, select which to use for color variants
 * - recolor: Phase 3 - Select colors and generate color variants
 */
export type MockupPhase = "compose" | "preview" | "recolor";

/**
 * Result status for batch generation
 */
export type MockupResultStatus = "idle" | "pending" | "processing" | "fulfilled" | "rejected";

/**
 * Single product item in multi-product workflow
 */
export interface ProductItem {
  /** Unique identifier */
  id: string;
  /** Product image as data URL */
  image: string;
  /** MIME type of the image */
  mimeType: string;
  /** Logo position for this specific product */
  logoPosition: LogoPosition;
  /** Generated preview image as data URL */
  preview: string | null;
  /** Preview generation status */
  previewStatus: MockupResultStatus;
  /** Preview generation error if any */
  previewError: string | null;
  /** Whether this product is selected for batch operations */
  selected: boolean;
  /** Color variants generated for this product's preview */
  variants: MockupResult[];
}

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
 * State for the mockup editor (multi-product workflow)
 */
export interface MockupEditorState {
  // ========== Phase Tracking ==========
  /** Current workflow phase */
  phase: MockupPhase;
  
  // ========== Multi-Product Support ==========
  /** All product items */
  products: ProductItem[];
  /** Currently active product ID (for editing logo position) */
  activeProductId: string | null;
  
  // ========== Logo (shared across all products) ==========
  /** Logo image to be applied (shared) */
  logoImage: string | null;
  logoMimeType: string;
  
  // ========== Color Variants ==========
  /** Selected colors for batch generation */
  selectedColors: ColorOption[];
  
  // ========== Processing State ==========
  /** Processing state */
  isProcessing: boolean;
  /** Number of items currently being processed */
  processingCount: number;
  /** Total items to process */
  totalToProcess: number;
  /** Error message if any */
  error: string | null;
  
  // ========== Legacy Support (single product mode) ==========
  /** Selected product image (legacy - for backward compatibility) */
  productImage: string | null;
  productMimeType: string;
  /** Current logo position (legacy) */
  logoPosition: LogoPosition;
  /** First generated mockup (legacy) */
  firstMockup: string | null;
  firstMockupMimeType: string;
  /** Confirmed mockup (legacy) */
  confirmedMockup: string | null;
  confirmedMockupMimeType: string;
  /** Results (legacy) */
  results: MockupResult[];
  /** Selected template (legacy) */
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

// Maximum concurrent API requests for batch operations
export const MAX_CONCURRENT_REQUESTS = 5;
