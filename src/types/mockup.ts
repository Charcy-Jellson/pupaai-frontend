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
 * Product template configuration
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

/**
 * State for the mockup editor
 */
export interface MockupEditorState {
  /** Selected product template or custom uploaded image */
  productImage: string | null;
  productMimeType: string;
  /** Logo image to be applied */
  logoImage: string | null;
  logoMimeType: string;
  /** Current logo position and transformation */
  logoPosition: LogoPosition;
  /** Generated mockup result */
  generatedMockup: string | null;
  /** Processing state */
  isProcessing: boolean;
  /** Error message if any */
  error: string | null;
  /** Selected template (if using preset) */
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
}

/**
 * Response from mockup generation API
 */
export interface MockupGenerateResponse {
  image_base64: string;
  mime_type: string;
}

// =============================================================================
// Preset Templates
// =============================================================================

export const PRESET_TEMPLATES: ProductTemplate[] = [
  {
    id: "white-tshirt-front",
    name: "White T-Shirt (Front)",
    category: "apparel",
    imageUrl: "/templates/white-tshirt-front.png",
    thumbnailUrl: "/templates/white-tshirt-front-thumb.png",
    printArea: { x: 25, y: 20, width: 50, height: 40 },
    description: "Classic white t-shirt, front view",
  },
  {
    id: "black-tshirt-front",
    name: "Black T-Shirt (Front)",
    category: "apparel",
    imageUrl: "/templates/black-tshirt-front.png",
    thumbnailUrl: "/templates/black-tshirt-front-thumb.png",
    printArea: { x: 25, y: 20, width: 50, height: 40 },
    description: "Classic black t-shirt, front view",
  },
  {
    id: "white-hoodie",
    name: "White Hoodie",
    category: "apparel",
    imageUrl: "/templates/white-hoodie.png",
    thumbnailUrl: "/templates/white-hoodie-thumb.png",
    printArea: { x: 25, y: 25, width: 50, height: 35 },
    description: "White hoodie, front view",
  },
  {
    id: "baseball-cap",
    name: "Baseball Cap",
    category: "accessories",
    imageUrl: "/templates/baseball-cap.png",
    thumbnailUrl: "/templates/baseball-cap-thumb.png",
    printArea: { x: 30, y: 20, width: 40, height: 30 },
    description: "Classic baseball cap",
  },
  {
    id: "tote-bag",
    name: "Canvas Tote Bag",
    category: "bags",
    imageUrl: "/templates/tote-bag.png",
    thumbnailUrl: "/templates/tote-bag-thumb.png",
    printArea: { x: 20, y: 15, width: 60, height: 50 },
    description: "Natural canvas tote bag",
  },
];

// Default logo position (centered)
export const DEFAULT_LOGO_POSITION: LogoPosition = {
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
};

