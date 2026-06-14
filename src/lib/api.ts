// FastAPI backend URL (for AI processing)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// Types
// =============================================================================

export type ProviderType = "gemini" | "openai";
export type TaskType = "image_processing" | "video_processing" | "text_processing";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessedImageResponse {
  image_base64: string;
  mime_type: string;
  model_used?: string;
}

// AI Model types
export interface AIModel {
  id: string;
  provider: ProviderType;
  model_id: string;
  display_name: string;
  task_type: TaskType;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AIModelsListResponse {
  models: AIModel[];
}

export interface DefaultModelSetting {
  id: string;
  task_type: TaskType;
  feature: string;
  model_id: string | null;
  ai_models?: AIModel;
}

export interface DefaultModelsResponse {
  defaults: DefaultModelSetting[];
}

// =============================================================================
// Helper Functions
// =============================================================================

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    return {
      success: false,
      error: error.error || error.detail || `HTTP ${response.status}`,
    };
  }

  const data = await response.json();
  return {
    success: true,
    data,
  };
}

/**
 * Build headers with optional authentication token.
 * Call this with the token from Clerk's getToken() in your component.
 */
function buildAuthHeaders(authToken?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  return headers;
}

// Build URL with optional model_id parameter for backend
function buildImageUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/image/${endpoint}`;
  if (modelId) {
    return `${url}?model_id=${modelId}`;
  }
  return url;
}

// Build URL for mockup API
function buildMockupUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/mockup/${endpoint}`;
  if (modelId) {
    return `${url}?model_id=${modelId}`;
  }
  return url;
}

// Build URL for model studio API
function buildModelStudioUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/model-studio/${endpoint}`;
  if (modelId) {
    return `${url}?model_id=${modelId}`;
  }
  return url;
}

// =============================================================================
// Image Processing API (calls FastAPI backend)
// =============================================================================

export async function extractLogo(
  imageBase64: string,
  mimeType: string,
  modelId?: string,
  removeBackground: boolean = true,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildImageUrl("extract-logo", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      remove_background: removeBackground,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

/**
 * Remove background from an image using local rembg (U2-Net model).
 * This is fast and produces true transparent PNG output.
 * No AI model selection needed - uses the built-in U2-Net model.
 */
export async function removeBackground(
  imageBase64: string,
  mimeType: string,
  // modelId is kept for API compatibility but not used - always uses local rembg
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  // Use the local rembg endpoint instead of AI models
  const response = await fetch(`${BACKEND_URL}/api/image/remove-background-local`, {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

export async function removeLogo(
  imageBase64: string,
  mimeType: string,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildImageUrl("remove-logo", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

// =============================================================================
// Product Mockup API (calls FastAPI backend)
// =============================================================================

export interface LogoPositionPayload {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/**
 * Generate a product mockup with logo applied using AI (Phase 1: Logo compositing)
 * @param targetColor - Optional hex color to change the product to (e.g., "#FF0000")
 */
export async function generateMockup(
  productImageBase64: string,
  productMimeType: string,
  logoImageBase64: string,
  logoMimeType: string,
  logoPosition: LogoPositionPayload,
  targetColor?: string,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildMockupUrl("generate", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      product_image_base64: productImageBase64,
      product_mime_type: productMimeType,
      logo_image_base64: logoImageBase64,
      logo_mime_type: logoMimeType,
      logo_position: logoPosition,
      target_color: targetColor || null,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

/**
 * Recolor a mockup image - change the product color while preserving the logo (Phase 2: Color variants)
 * 
 * This is more efficient than generateMockup for color variants because it doesn't re-composite the logo,
 * only changes the garment color on an already-approved mockup.
 * 
 * @param mockupImageBase64 - Base64 encoded mockup image (from Phase 1)
 * @param mockupMimeType - MIME type of the mockup image
 * @param targetColor - Hex color to change product to (e.g., "#FF0000")
 * @param modelId - Optional AI model UUID to use
 */
export async function recolorMockup(
  mockupImageBase64: string,
  mockupMimeType: string,
  targetColor: string,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildMockupUrl("recolor", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      mockup_image_base64: mockupImageBase64,
      mockup_mime_type: mockupMimeType,
      target_color: targetColor,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

// =============================================================================
// Model Studio API (calls FastAPI backend)
// =============================================================================

export type Ethnicity = "caucasian" | "black" | "asian" | "hispanic";
export type Gender = "male" | "female";
export type HairLength = "long" | "short";
export type AgeGroup = "teen" | "adult" | "middle_aged";
export type SceneOption = "original" | "home" | "street" | "office";
export type PoseOption = "front_standing" | "side_standing" | "front_sitting";
export type PantsType = "yoga_pants" | "jeans";

export interface GenerateModelRequest {
  ethnicity: Ethnicity;
  gender: Gender;
  hair_length: HairLength;
  glasses: boolean;
  age_group: AgeGroup;
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

/**
 * Generate an AI fashion model based on specified characteristics
 */
export async function generateFashionModel(
  options: GenerateModelRequest,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildModelStudioUrl("generate-model", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(options),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

/**
 * Dress a model in the specified clothing item
 */
export async function dressModel(
  request: DressModelRequest,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildModelStudioUrl("dress-model", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

// =============================================================================
// Logo Studio API (calls FastAPI backend)
// =============================================================================

export type LogoStyle = "minimalist" | "vintage" | "modern" | "playful";

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

/**
 * Generate a logo from text description using AI
 */
export async function generateLogo(
  request: GenerateLogoRequest,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const url = modelId 
    ? `${BACKEND_URL}/api/logo-studio/generate?model_id=${modelId}`
    : `${BACKEND_URL}/api/logo-studio/generate`;
    
  const response = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

/**
 * Edit an existing logo based on text instructions
 */
export async function editLogo(
  request: EditLogoRequest,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const url = modelId 
    ? `${BACKEND_URL}/api/logo-studio/edit?model_id=${modelId}`
    : `${BACKEND_URL}/api/logo-studio/edit`;
    
  const response = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

// =============================================================================
// Nail Studio API (calls FastAPI backend)
// =============================================================================

function buildNailStudioUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/nail-studio/${endpoint}`;
  if (modelId) {
    return `${url}?model_id=${modelId}`;
  }
  return url;
}

/**
 * Change the background of a nail art / press-on nail image
 */
export async function changeNailBackground(
  nailImageBase64: string,
  nailMimeType: string,
  backgroundImageBase64: string,
  backgroundMimeType: string,
  boxOption: string = "keep_original",
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildNailStudioUrl("change-background", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      nail_image_base64: nailImageBase64,
      nail_mime_type: nailMimeType,
      background_image_base64: backgroundImageBase64,
      background_mime_type: backgroundMimeType,
      box_option: boxOption,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

/**
 * Apply nail art / press-on nail design onto a hand photo
 */
export async function applyNailToHand(
  nailImageBase64: string,
  nailMimeType: string,
  handImageBase64: string,
  handMimeType: string,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildNailStudioUrl("apply-to-hand", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify({
      nail_image_base64: nailImageBase64,
      nail_mime_type: nailMimeType,
      hand_image_base64: handImageBase64,
      hand_mime_type: handMimeType,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

// =============================================================================
// Health Check (FastAPI backend)
// =============================================================================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// AI Models Management API (calls Next.js API routes)
// =============================================================================

/**
 * Get all AI models, optionally filtered by task type or provider
 */
export async function getAIModels(
  taskType?: TaskType,
  provider?: ProviderType,
  activeOnly: boolean = true
): Promise<ApiResponse<AIModelsListResponse>> {
  try {
    const params = new URLSearchParams();
    if (taskType) params.append("task_type", taskType);
    if (provider) params.append("provider", provider);
    params.append("active_only", activeOnly.toString());

    const url = `/api/settings/models?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<AIModelsListResponse>(response);
  } catch {
    return {
      success: false,
      error: "Failed to fetch AI models",
    };
  }
}

/**
 * Create a new AI model configuration
 */
export async function createAIModel(
  model: Omit<AIModel, "id" | "created_at" | "updated_at">
): Promise<ApiResponse<AIModel>> {
  try {
    const response = await fetch("/api/settings/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(model),
    });
    return handleResponse<AIModel>(response);
  } catch {
    return {
      success: false,
      error: "Failed to create AI model",
    };
  }
}

/**
 * Update an existing AI model configuration
 */
export async function updateAIModel(
  modelUuid: string,
  updates: Partial<Omit<AIModel, "id" | "created_at" | "updated_at">>
): Promise<ApiResponse<AIModel>> {
  try {
    const response = await fetch(`/api/settings/models/${modelUuid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<AIModel>(response);
  } catch {
    return {
      success: false,
      error: "Failed to update AI model",
    };
  }
}

/**
 * Delete an AI model configuration
 */
export async function deleteAIModel(
  modelUuid: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`/api/settings/models/${modelUuid}`, {
      method: "DELETE",
    });
    return handleResponse<{ message: string }>(response);
  } catch {
    return {
      success: false,
      error: "Failed to delete AI model",
    };
  }
}

// =============================================================================
// Default Model Settings API (calls Next.js API routes)
// =============================================================================

/**
 * Get default model settings for features
 */
export async function getDefaultModels(
  taskType?: TaskType
): Promise<ApiResponse<DefaultModelsResponse>> {
  try {
    const params = taskType ? `?task_type=${taskType}` : "";
    const response = await fetch(`/api/settings/models/defaults${params}`);
    return handleResponse<DefaultModelsResponse>(response);
  } catch {
    return {
      success: false,
      error: "Failed to fetch default models",
    };
  }
}

/**
 * Set default model for a specific feature
 */
export async function setDefaultModel(
  taskType: TaskType,
  feature: string,
  modelId: string
): Promise<ApiResponse<{ task_type: string; feature: string; model_id: string; model: AIModel }>> {
  try {
    const response = await fetch(
      `/api/settings/models/defaults/${taskType}/${feature}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model_id: modelId }),
      }
    );
    return handleResponse<{ task_type: string; feature: string; model_id: string; model: AIModel }>(response);
  } catch {
    return {
      success: false,
      error: "Failed to set default model",
    };
  }
}

// =============================================================================
// Provider Status API (calls FastAPI backend - needs API keys check)
// =============================================================================

/**
 * Get status of AI providers (API key configured or not)
 * This must call the FastAPI backend because API keys are stored there
 */
export async function getProvidersStatus(): Promise<ApiResponse<Record<ProviderType, boolean>>> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings/providers`);
    return handleResponse<Record<ProviderType, boolean>>(response);
  } catch {
    return {
      success: false,
      error: "Failed to fetch provider status",
    };
  }
}
