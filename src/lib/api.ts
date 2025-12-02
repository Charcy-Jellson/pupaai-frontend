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

// Build URL with optional model_id parameter for backend
function buildImageUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/image/${endpoint}`;
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
  modelId?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildImageUrl("extract-logo", modelId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
    }),
  });

  return handleResponse<ProcessedImageResponse>(response);
}

export async function removeBackground(
  imageBase64: string,
  mimeType: string,
  modelId?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildImageUrl("remove-background", modelId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  modelId?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildImageUrl("remove-logo", modelId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
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
