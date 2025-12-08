// =============================================================================
// Model Studio Types
// =============================================================================

/**
 * Ethnicity options for AI model generation
 */
export type Ethnicity = "caucasian" | "black" | "asian" | "hispanic";

export const ETHNICITY_OPTIONS: { id: Ethnicity; name: string }[] = [
  { id: "caucasian", name: "Caucasian" },
  { id: "black", name: "Black" },
  { id: "asian", name: "Asian" },
  { id: "hispanic", name: "Hispanic" },
];

/**
 * Gender options
 */
export type Gender = "male" | "female";

export const GENDER_OPTIONS: { id: Gender; name: string }[] = [
  { id: "male", name: "Male" },
  { id: "female", name: "Female" },
];

/**
 * Hair length options
 */
export type HairLength = "long" | "short";

export const HAIR_OPTIONS: { id: HairLength; name: string }[] = [
  { id: "long", name: "Long Hair" },
  { id: "short", name: "Short Hair" },
];

/**
 * Age group options
 */
export type AgeGroup = "teen" | "adult" | "middle_aged";

export const AGE_OPTIONS: { id: AgeGroup; name: string; range: string }[] = [
  { id: "teen", name: "Teen", range: "16-17" },
  { id: "adult", name: "Adult", range: "20-33" },
  { id: "middle_aged", name: "Middle Aged", range: "35-45" },
];

/**
 * Model generation options for AI
 */
export interface ModelGenerationOptions {
  ethnicity: Ethnicity;
  gender: Gender;
  hairLength: HairLength;
  glasses: boolean;
  ageGroup: AgeGroup;
}

export const DEFAULT_MODEL_OPTIONS: ModelGenerationOptions = {
  ethnicity: "caucasian",
  gender: "female",
  hairLength: "long",
  glasses: false,
  ageGroup: "adult",
};

// =============================================================================
// Scene Options
// =============================================================================

export type SceneOption = "original" | "home" | "street" | "office";

export const SCENE_OPTIONS: { id: SceneOption; name: string; description: string }[] = [
  { id: "original", name: "Original Background", description: "Keep the model's original background" },
  { id: "home", name: "Home", description: "Cozy home interior setting" },
  { id: "street", name: "City Street", description: "Busy urban street background" },
  { id: "office", name: "Office", description: "Professional office environment" },
];

// =============================================================================
// Pose Options
// =============================================================================

export type PoseOption = "front_standing" | "side_standing" | "front_sitting";

export const POSE_OPTIONS: { id: PoseOption; name: string; description: string }[] = [
  { id: "front_standing", name: "Front Standing", description: "Model facing camera, standing" },
  { id: "side_standing", name: "Side Standing", description: "Model from side angle, standing" },
  { id: "front_sitting", name: "Front Sitting", description: "Model facing camera, sitting" },
];

// =============================================================================
// Pants Type Options
// =============================================================================

export type PantsType = "yoga_pants" | "jeans";

export const PANTS_OPTIONS: { id: PantsType; name: string }[] = [
  { id: "yoga_pants", name: "Black Yoga Pants (Short)" },
  { id: "jeans", name: "Jeans" },
];

// =============================================================================
// Clothing Item
// =============================================================================

export interface ClothingItem {
  id: string;
  imageDataUrl: string;
  mimeType: string;
  name: string;
}

// =============================================================================
// Model Studio Result
// =============================================================================

export type ModelStudioResultStatus = "pending" | "processing" | "fulfilled" | "rejected";

export interface ModelStudioResult {
  id: string;
  clothingId: string;
  clothingName: string;
  pose: PoseOption;
  scene: SceneOption;
  pantsType: PantsType;
  status: ModelStudioResultStatus;
  imageDataUrl: string | null;
  error: string | null;
}

// =============================================================================
// Model Studio State
// =============================================================================

export type ModelSourceType = "upload" | "gallery" | "generate";

export interface ModelStudioState {
  // Model selection
  modelSource: ModelSourceType;
  modelImage: string | null;
  modelMimeType: string;
  modelGenerationOptions: ModelGenerationOptions;
  isGeneratingModel: boolean;

  // Clothing selection (multi-select)
  selectedClothingItems: ClothingItem[];

  // Generation options
  selectedScene: SceneOption;
  selectedPoses: PoseOption[];
  selectedPantsType: PantsType;

  // Results
  results: ModelStudioResult[];

  // Processing state
  isProcessing: boolean;
  processingCount: number;
  error: string | null;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface GenerateModelRequest {
  ethnicity: Ethnicity;
  gender: Gender;
  hair_length: HairLength;
  glasses: boolean;
  age_group: AgeGroup;
}

export interface GenerateModelResponse {
  image_base64: string;
  mime_type: string;
}

export interface DressModelRequest {
  model_image_base64: string;
  model_mime_type: string;
  clothing_image_base64: string;
  clothing_mime_type: string;
  scene: SceneOption;
  pose: PoseOption;
  pants_type: PantsType;
}

export interface DressModelResponse {
  image_base64: string;
  mime_type: string;
  model_used?: string;
}





