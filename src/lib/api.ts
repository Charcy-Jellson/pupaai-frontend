const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessedImageResponse {
  image_base64: string;
  mime_type: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    return {
      success: false,
      error: error.detail || `HTTP ${response.status}`,
    };
  }

  const data = await response.json();
  return {
    success: true,
    data,
  };
}

export async function extractLogo(
  imageBase64: string,
  mimeType: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(`${API_URL}/api/image/extract-logo`, {
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
  mimeType: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(`${API_URL}/api/image/remove-background`, {
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
  mimeType: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(`${API_URL}/api/image/remove-logo`, {
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

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}


