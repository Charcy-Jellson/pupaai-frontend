"use client";

import { useState, useCallback, useRef } from "react";
import type { ImageEditorState, ImageOperation } from "@/types";
import { generateId } from "@/lib/utils";
import * as api from "@/lib/api";

const initialState: ImageEditorState = {
  originalImage: null,
  currentImage: null,
  mimeType: "image/png",
  operations: [],
  isProcessing: false,
};

/**
 * Type for the getAuthToken function from Clerk's useAuth hook
 */
export type GetAuthTokenFn = () => Promise<string | null>;

/**
 * Image editor hook with optional authentication support.
 * @param getAuthToken - Optional function to get auth token (from Clerk's useAuth().getToken)
 */
export function useImageEditor(getAuthToken?: GetAuthTokenFn) {
  // Store getAuthToken in a ref to avoid stale closures
  const getAuthTokenRef = useRef(getAuthToken);
  getAuthTokenRef.current = getAuthToken;
  const [state, setState] = useState<ImageEditorState>(initialState);

  const setImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState({
      originalImage: imageDataUrl,
      currentImage: imageDataUrl,
      mimeType,
      operations: [],
      isProcessing: false,
    });
  }, []);

  const clearImage = useCallback(() => {
    setState(initialState);
  }, []);

  const addOperation = useCallback((operation: Omit<ImageOperation, "id" | "timestamp">) => {
    const newOperation: ImageOperation = {
      ...operation,
      id: generateId(),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      currentImage: operation.resultUrl,
      operations: [...prev.operations, newOperation],
    }));
  }, []);

  const undoLastOperation = useCallback(() => {
    setState((prev) => {
      if (prev.operations.length === 0) return prev;

      const newOperations = prev.operations.slice(0, -1);
      const lastImage =
        newOperations.length > 0
          ? newOperations[newOperations.length - 1].resultUrl
          : prev.originalImage;

      return {
        ...prev,
        currentImage: lastImage,
        operations: newOperations,
      };
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentImage: prev.originalImage,
      operations: [],
    }));
  }, []);

  const rotateImage = useCallback(
    async (degrees: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Normalize degrees to 0-360
        const normalizedDegrees = ((degrees % 360) + 360) % 360;
        
        // For 90 or 270 degrees, swap width and height
        if (normalizedDegrees === 90 || normalizedDegrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else if (normalizedDegrees === 180 || normalizedDegrees === 0) {
          canvas.width = img.width;
          canvas.height = img.height;
        } else {
          // For arbitrary angles, calculate bounding box
          const radians = (normalizedDegrees * Math.PI) / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));
          canvas.width = Math.round(img.width * cos + img.height * sin);
          canvas.height = Math.round(img.width * sin + img.height * cos);
        }

        // Move to center and rotate
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedDegrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "rotate",
          params: { degrees },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const cropImage = useCallback(
    async (x: number, y: number, width: number, height: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "crop",
          params: { x, y, width, height },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const resizeImage = useCallback(
    async (newWidth: number, newHeight: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "resize",
          params: { width: newWidth, height: newHeight },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const compressImage = useCallback(
    async (targetSizeKB: number): Promise<{ originalSize: number; finalSize: number; quality: number }> => {
      if (!state.currentImage) {
        return { originalSize: 0, finalSize: 0, quality: 0 };
      }

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get original size
        const originalBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 1.0);
        });
        const originalSizeKB = originalBlob.size / 1024;

        // If already smaller than target, return as is with high quality JPEG
        if (originalSizeKB <= targetSizeKB) {
          const resultUrl = canvas.toDataURL("image/jpeg", 0.95);
          addOperation({
            type: "compress",
            params: { targetSizeKB, quality: 0.95 },
            resultUrl,
          });
          return {
            originalSize: Math.round(originalSizeKB),
            finalSize: Math.round(originalSizeKB),
            quality: 95,
          };
        }

        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestBlob: Blob = originalBlob;
        let bestQuality = 1.0;
        const targetBytes = targetSizeKB * 1024;

        // Maximum 10 iterations for binary search
        for (let i = 0; i < 10; i++) {
          const midQuality = (minQuality + maxQuality) / 2;
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/jpeg", midQuality);
          });

          if (blob.size <= targetBytes) {
            // Size is acceptable, try higher quality
            bestBlob = blob;
            bestQuality = midQuality;
            minQuality = midQuality;
          } else {
            // Size too large, try lower quality
            maxQuality = midQuality;
          }

          // Close enough
          if (maxQuality - minQuality < 0.02) break;
        }

        // If we couldn't get under target with quality adjustment, also try scaling down
        if (bestBlob.size > targetBytes) {
          let scale = 1.0;
          while (bestBlob.size > targetBytes && scale > 0.3) {
            scale -= 0.1;
            const scaledCanvas = document.createElement("canvas");
            const scaledCtx = scaledCanvas.getContext("2d")!;
            scaledCanvas.width = Math.round(img.width * scale);
            scaledCanvas.height = Math.round(img.height * scale);
            scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
            
            bestBlob = await new Promise<Blob>((resolve) => {
              scaledCanvas.toBlob((b) => resolve(b!), "image/jpeg", bestQuality);
            });
          }
        }

        // Convert blob to data URL
        const resultUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(bestBlob);
        });

        const finalSizeKB = bestBlob.size / 1024;

        addOperation({
          type: "compress",
          params: { targetSizeKB, quality: Math.round(bestQuality * 100) },
          resultUrl,
        });

        return {
          originalSize: Math.round(originalSizeKB),
          finalSize: Math.round(finalSizeKB),
          quality: Math.round(bestQuality * 100),
        };
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, addOperation]
  );

  const extractLogo = useCallback(async (modelId?: string, removeBackground: boolean = true) => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      // Get auth token if getAuthToken function is provided
      const authToken = getAuthTokenRef.current ? await getAuthTokenRef.current() : undefined;
      const response = await api.extractLogo(base64Data, state.mimeType, modelId, removeBackground, authToken || undefined);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "extract-logo",
          params: { modelId: modelId || "default", removeBackground },
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to extract logo");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const removeBackground = useCallback(async (modelId?: string) => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      // Get auth token if getAuthToken function is provided
      const authToken = getAuthTokenRef.current ? await getAuthTokenRef.current() : undefined;
      const response = await api.removeBackground(base64Data, state.mimeType, modelId, authToken || undefined);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "remove-background",
          params: { modelId: modelId || "default" },
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to remove background");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const removeLogo = useCallback(async (modelId?: string) => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      // Get auth token if getAuthToken function is provided
      const authToken = getAuthTokenRef.current ? await getAuthTokenRef.current() : undefined;
      const response = await api.removeLogo(base64Data, state.mimeType, modelId, authToken || undefined);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "remove-logo",
          params: { modelId: modelId || "default" },
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to remove logo");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const downloadImage = useCallback(
    (filename: string = "edited-image") => {
      if (!state.currentImage) return;

      const link = document.createElement("a");
      link.download = `${filename}.${state.mimeType.split("/")[1]}`;
      link.href = state.currentImage;
      link.click();
    },
    [state.currentImage, state.mimeType]
  );

  return {
    state,
    setImage,
    clearImage,
    rotateImage,
    cropImage,
    resizeImage,
    compressImage,
    extractLogo,
    removeBackground,
    removeLogo,
    undoLastOperation,
    resetToOriginal,
    downloadImage,
  };
}



